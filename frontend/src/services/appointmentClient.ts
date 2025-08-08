// Import all gRPC functionality as namespaces
import * as grpcWeb from "../proto/appointment_grpc_web_pb";
import * as appointmentPb from "../proto/appointment_pb";

// Import Google protobuf types directly
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

// Initialize client using the namespace
const client = new grpcWeb.proto.appointment.AppointmentServiceClient(
  import.meta.env.VITE_GRPC_URL || "http://localhost:8080",
  null,
  {
    withCredentials: true,
    unaryInterceptors: [],
    streamInterceptors: [],
  }
);

// Create type aliases for cleaner usage
type Appointment = appointmentPb.Appointment;
type CreateAppointmentRequest = appointmentPb.CreateAppointmentRequest;
type GetAppointmentRequest = appointmentPb.GetAppointmentRequest;
type ListAppointmentsRequest = appointmentPb.ListAppointmentsRequest;
type ListAppointmentsResponse = appointmentPb.ListAppointmentsResponse;
type AppointmentStreamResponse = appointmentPb.AppointmentStreamResponse;
type DeleteAppointmentRequest = appointmentPb.DeleteAppointmentRequest;

export const appointmentClient = {
  createAppointment: (title: string, startTime: Date, endTime: Date) => {
    const request = new appointmentPb.CreateAppointmentRequest();
    request.setTitle(title);

    const pbStart = new Timestamp();
    pbStart.fromDate(startTime);
    request.setStartTime(pbStart);

    const pbEnd = new Timestamp();
    pbEnd.fromDate(endTime);
    request.setEndTime(pbEnd);

    return new Promise<Appointment>((resolve, reject) => {
      client.createAppointment(request, {}, (err, response) => {
        if (err) reject(err);
        else resolve(response as Appointment);
      });
    });
  },

  getAppointment: (id: string) => {
    const request = new appointmentPb.GetAppointmentRequest();
    request.setId(id);

    return new Promise<Appointment>((resolve, reject) => {
      client.getAppointment(request, {}, (err, response) => {
        if (err) reject(err);
        else resolve(response as Appointment);
      });
    });
  },

  deleteAppointment: (id: string) => {
    const request = new appointmentPb.DeleteAppointmentRequest();
    request.setId(id);

    return new Promise<void>((resolve, reject) => {
      client.deleteAppointment(request, {}, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  listAppointments: (page: number, limit: number, search = "") => {
    const request = new appointmentPb.ListAppointmentsRequest();
    request.setPage(page);
    request.setLimit(limit);
    request.setSearch(search);

    return new Promise<ListAppointmentsResponse>((resolve, reject) => {
      client.listAppointments(request, {}, (err, response) => {
        if (err) reject(err);
        else resolve(response as ListAppointmentsResponse);
      });
    });
  },

  streamAppointments: (
    onData: (res: AppointmentStreamResponse) => void,
    onError?: (err: unknown) => void,
    onEnd?: () => void
  ) => {
    const request = new Empty();
    const stream = client.streamAppointments(request, {});

    stream.on("data", (response: AppointmentStreamResponse) => {
      onData(response);
    });

    if (onError) stream.on("error", onError);
    if (onEnd) stream.on("end", onEnd);

    return stream;
  },
};
