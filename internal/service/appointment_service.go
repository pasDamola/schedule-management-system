package service

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/pasDamola/schedule-management-system/internal/models"
	"github.com/pasDamola/schedule-management-system/internal/repository"
	"github.com/sirupsen/logrus"
)

type AppointmentService interface {
	CreateAppointment(ctx context.Context, req *models.CreateAppointmentRequest) (*models.Appointment, error)
	GetAppointment(ctx context.Context, id uuid.UUID) (*models.Appointment, error)
	UpdateAppointment(ctx context.Context, req *models.UpdateAppointmentRequest) (*models.Appointment, error)
	DeleteAppointment(ctx context.Context, id uuid.UUID) error
	ListAppointments(ctx context.Context, req *models.ListAppointmentsRequest) (*models.ListAppointmentsResponse, error)
	SubscribeToUpdates() <-chan AppointmentEvent
	UnsubscribeFromUpdates(ch <-chan AppointmentEvent)
}

type EventType int

const (
	EventTypeCreated EventType = iota
	EventTypeUpdated
	EventTypeDeleted
)

type AppointmentEvent struct {
	Type        EventType
	Appointment *models.Appointment
	Timestamp   time.Time
}

type appointmentService struct {
	repo        repository.AppointmentRepository
	subscribers map[chan AppointmentEvent]bool
	mutex       sync.RWMutex
}

func NewAppointmentService(repo repository.AppointmentRepository) AppointmentService {
	return &appointmentService{
		repo:        repo,
		subscribers: make(map[chan AppointmentEvent]bool),
	}
}

func (s *appointmentService) CreateAppointment(ctx context.Context, req *models.CreateAppointmentRequest) (*models.Appointment, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		logrus.WithError(err).Error("Invalid create appointment request")
		return nil, err
	}

	// Create appointment
	appointment, err := s.repo.Create(ctx, req)
	if err != nil {
		logrus.WithError(err).Error("Failed to create appointment")
		return nil, err
	}

	// Notify subscribers
	s.notifySubscribers(AppointmentEvent{
		Type:        EventTypeCreated,
		Appointment: appointment,
		Timestamp:   time.Now(),
	})

	logrus.WithField("appointment_id", appointment.ID).Info("Appointment created successfully")
	return appointment, nil
}

func (s *appointmentService) GetAppointment(ctx context.Context, id uuid.UUID) (*models.Appointment, error) {
	if id == uuid.Nil {
		return nil, models.ErrInvalidID
	}

	appointment, err := s.repo.GetByID(ctx, id)
	if err != nil {
		logrus.WithError(err).WithField("appointment_id", id).Error("Failed to get appointment")
		return nil, err
	}

	return appointment, nil
}

func (s *appointmentService) UpdateAppointment(ctx context.Context, req *models.UpdateAppointmentRequest) (*models.Appointment, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		logrus.WithError(err).Error("Invalid update appointment request")
		return nil, err
	}

	// Update appointment
	appointment, err := s.repo.Update(ctx, req)
	if err != nil {
		logrus.WithError(err).WithField("appointment_id", req.ID).Error("Failed to update appointment")
		return nil, err
	}

	// Notify subscribers
	s.notifySubscribers(AppointmentEvent{
		Type:        EventTypeUpdated,
		Appointment: appointment,
		Timestamp:   time.Now(),
	})

	logrus.WithField("appointment_id", appointment.ID).Info("Appointment updated successfully")
	return appointment, nil
}

func (s *appointmentService) DeleteAppointment(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return models.ErrInvalidID
	}

	// Get appointment before deletion for notification
	appointment, err := s.repo.GetByID(ctx, id)
	if err != nil {
		logrus.WithError(err).WithField("appointment_id", id).Error("Failed to get appointment for deletion")
		return err
	}

	// Delete appointment
	err = s.repo.Delete(ctx, id)
	if err != nil {
		logrus.WithError(err).WithField("appointment_id", id).Error("Failed to delete appointment")
		return err
	}

	// Notify subscribers
	s.notifySubscribers(AppointmentEvent{
		Type:        EventTypeDeleted,
		Appointment: appointment,
		Timestamp:   time.Now(),
	})

	logrus.WithField("appointment_id", id).Info("Appointment deleted successfully")
	return nil
}

func (s *appointmentService) ListAppointments(ctx context.Context, req *models.ListAppointmentsRequest) (*models.ListAppointmentsResponse, error) {
	// Set defaults if not provided
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 20
	}
	if req.Limit > 100 {
		req.Limit = 100
	}

	response, err := s.repo.List(ctx, req)
	if err != nil {
		logrus.WithError(err).Error("Failed to list appointments")
		return nil, err
	}

	return response, nil
}

func (s *appointmentService) SubscribeToUpdates() <-chan AppointmentEvent {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	ch := make(chan AppointmentEvent, 100) // Buffer to prevent blocking
	s.subscribers[ch] = true

	logrus.Info("New subscriber added to appointment updates")
	return ch
}

func (s *appointmentService) UnsubscribeFromUpdates(ch <-chan AppointmentEvent) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if readOnlyChan, ok := ch.(chan AppointmentEvent); ok {
		delete(s.subscribers, readOnlyChan)
		close(readOnlyChan)
		logrus.Info("Subscriber removed from appointment updates")
	}
}

func (s *appointmentService) notifySubscribers(event AppointmentEvent) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	for subscriber := range s.subscribers {
		select {
		case subscriber <- event:
		default:
			// Channel is full, skip this subscriber to prevent blocking
			logrus.Warn("Subscriber channel is full, skipping notification")
		}
	}
}

// Additional utility methods for business logic
func (s *appointmentService) IsTimeSlotAvailable(ctx context.Context, startTime, endTime time.Time, excludeID *uuid.UUID) (bool, error) {
	hasConflict, err := s.repo.CheckConflict(ctx, startTime, endTime, excludeID)
	if err != nil {
		return false, err
	}
	return !hasConflict, nil
}

// ValidateAppointmentTime validates appointment time constraints
func ValidateAppointmentTime(startTime, endTime time.Time) error {
	now := time.Now()
	
	// Check if start time is in the past
	if startTime.Before(now) {
		return models.ErrPastTime
	}
	
	// Check if end time is before start time
	if endTime.Before(startTime) || endTime.Equal(startTime) {
		return models.ErrInvalidTimeRange
	}
	
	// Business rule: appointments must be at least 15 minutes long
	minDuration := 15 * time.Minute
	if endTime.Sub(startTime) < minDuration {
		return models.ErrInvalidTimeRange
	}
	
	// Business rule: appointments cannot be longer than 8 hours
	maxDuration := 8 * time.Hour
	if endTime.Sub(startTime) > maxDuration {
		return models.ErrInvalidTimeRange
	}
	
	return nil
}