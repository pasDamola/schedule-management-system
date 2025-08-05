package grpc

import (
	"context"

	"github.com/google/uuid"
	"github.com/pasDamola/schedule-management-system/internal/models"
	"github.com/pasDamola/schedule-management-system/internal/service"
	pb "github.com/pasDamola/schedule-management-system/pkg/pb"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type AppointmentServer struct {
	pb.UnimplementedAppointmentServiceServer
	service service.AppointmentService
}

func NewAppointmentServer(service service.AppointmentService) *AppointmentServer {
	return &AppointmentServer{
		service: service,
	}
}

func (s *AppointmentServer) CreateAppointment(ctx context.Context, req *pb.CreateAppointmentRequest) (*pb.Appointment, error) {
	logrus.WithField("title", req.Title).Info("Creating appointment")

	// Validate request
	if req.Title == "" {
		return nil, status.Errorf(codes.InvalidArgument, "title is required")
	}
	if req.StartTime == nil || req.EndTime == nil {
		return nil, status.Errorf(codes.InvalidArgument, "start_time and end_time are required")
	}

	startTime := req.StartTime.AsTime()
	endTime := req.EndTime.AsTime()

	// Additional validation
	if err := service.ValidateAppointmentTime(startTime, endTime); err != nil {
		return nil, s.handleServiceError(err)
	}

	createReq := &models.CreateAppointmentRequest{
		Title:     req.Title,
		StartTime: startTime,
		EndTime:   endTime,
	}

	appointment, err := s.service.CreateAppointment(ctx, createReq)
	if err != nil {
		return nil, s.handleServiceError(err)
	}

	return s.appointmentToProto(appointment), nil
}

func (s *AppointmentServer) GetAppointment(ctx context.Context, req *pb.GetAppointmentRequest) (*pb.Appointment, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid appointment ID: %v", err)
	}

	appointment, err := s.service.GetAppointment(ctx, id)
	if err != nil {
		return nil, s.handleServiceError(err)
	}

	return s.appointmentToProto(appointment), nil
}

func (s *AppointmentServer) UpdateAppointment(ctx context.Context, req *pb.UpdateAppointmentRequest) (*pb.Appointment, error) {
	logrus.WithField("id", req.Id).Info("Updating appointment")

	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid appointment ID: %v", err)
	}

	if req.Title == "" {
		return nil, status.Errorf(codes.InvalidArgument, "title is required")
	}
	if req.StartTime == nil || req.EndTime == nil {
		return nil, status.Errorf(codes.InvalidArgument, "start_time and end_time are required")
	}

	startTime := req.StartTime.AsTime()
	endTime := req.EndTime.AsTime()

	// Additional validation
	if err := service.ValidateAppointmentTime(startTime, endTime); err != nil {
		return nil, s.handleServiceError(err)
	}

	updateReq := &models.UpdateAppointmentRequest{
		ID:        id,
		Title:     req.Title,
		StartTime: startTime,
		EndTime:   endTime,
	}

	appointment, err := s.service.UpdateAppointment(ctx, updateReq)
	if err != nil {
		return nil, s.handleServiceError(err)
	}

	return s.appointmentToProto(appointment), nil
}

func (s *AppointmentServer) DeleteAppointment(ctx context.Context, req *pb.DeleteAppointmentRequest) (*emptypb.Empty, error) {
	logrus.WithField("id", req.Id).Info("Deleting appointment")

	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid appointment ID: %v", err)
	}

	err = s.service.DeleteAppointment(ctx, id)
	if err != nil {
		return nil, s.handleServiceError(err)
	}

	return &emptypb.Empty{}, nil
}

func (s *AppointmentServer) ListAppointments(ctx context.Context, req *pb.ListAppointmentsRequest) (*pb.ListAppointmentsResponse, error) {
	listReq := &models.ListAppointmentsRequest{
		Page:   int(req.Page),
		Limit:  int(req.Limit),
		Search: req.Search,
	}

	if req.StartDate != nil {
		listReq.StartDate = req.StartDate.AsTime()
	}
	if req.EndDate != nil {
		listReq.EndDate = req.EndDate.AsTime()
	}

	response, err := s.service.ListAppointments(ctx, listReq)
	if err != nil {
		return nil, s.handleServiceError(err)
	}

	protoAppointments := make([]*pb.Appointment, len(response.Appointments))
	for i, appointment := range response.Appointments {
		protoAppointments[i] = s.appointmentToProto(&appointment)
	}

	return &pb.ListAppointmentsResponse{
		Appointments: protoAppointments,
		Total:        int32(response.Total),
		Page:         int32(response.Page),
		Limit:        int32(response.Limit),
	}, nil
}

func (s *AppointmentServer) StreamAppointments(_ *emptypb.Empty, stream pb.AppointmentService_StreamAppointmentsServer) error {
	ctx := stream.Context()
	eventChan := s.service.SubscribeToUpdates()
	defer s.service.UnsubscribeFromUpdates(eventChan)

	logrus.Info("Client connected to appointment stream")

	for {
		select {
		case event := <-eventChan:
			var eventType pb.AppointmentStreamResponse_EventType
			switch event.Type {
			case service.EventTypeCreated:
				eventType = pb.AppointmentStreamResponse_CREATED
			case service.EventTypeUpdated:
				eventType = pb.AppointmentStreamResponse_UPDATED
			case service.EventTypeDeleted:
				eventType = pb.AppointmentStreamResponse_DELETED
			}

			response := &pb.AppointmentStreamResponse{
				EventType:   eventType,
				Appointment: s.appointmentToProto(event.Appointment),
			}

			if err := stream.Send(response); err != nil {
				logrus.WithError(err).Error("Failed to send stream response")
				return err
			}

		case <-ctx.Done():
			logrus.Info("Client disconnected from appointment stream")
			return ctx.Err()
		}
	}
}

// Helper methods
func (s *AppointmentServer) appointmentToProto(appointment *models.Appointment) *pb.Appointment {
	return &pb.Appointment{
		Id:        appointment.ID.String(),
		Title:     appointment.Title,
		StartTime: timestamppb.New(appointment.StartTime),
		EndTime:   timestamppb.New(appointment.EndTime),
		CreatedAt: timestamppb.New(appointment.CreatedAt),
		UpdatedAt: timestamppb.New(appointment.UpdatedAt),
	}
}

func (s *AppointmentServer) handleServiceError(err error) error {
	switch err {
	case models.ErrAppointmentNotFound:
		return status.Errorf(codes.NotFound, "appointment not found")
	case models.ErrAppointmentConflict:
		return status.Errorf(codes.AlreadyExists, "appointment time conflicts with existing appointment")
	case models.ErrInvalidTitle:
		return status.Errorf(codes.InvalidArgument, "invalid title: title cannot be empty")
	case models.ErrInvalidTime:
		return status.Errorf(codes.InvalidArgument, "invalid time: start time and end time are required")
	case models.ErrInvalidTimeRange:
		return status.Errorf(codes.InvalidArgument, "invalid time range: start time must be before end time and appointments must be 15 minutes to 8 hours long")
	case models.ErrInvalidID:
		return status.Errorf(codes.InvalidArgument, "invalid ID: ID cannot be empty")
	case models.ErrPastTime:
		return status.Errorf(codes.InvalidArgument, "invalid time: cannot schedule appointments in the past")
	default:
		logrus.WithError(err).Error("Unexpected service error")
		return status.Errorf(codes.Internal, "internal server error")
	}
}