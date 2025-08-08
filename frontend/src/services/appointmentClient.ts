import { AppointmentServiceClient } from "../proto/appointment/AppointmentServiceClientPb";
import {
  Appointment,
  CreateAppointmentRequest,
  GetAppointmentRequest,
  DeleteAppointmentRequest,
  ListAppointmentsRequest,
  ListAppointmentsResponse,
  AppointmentStreamResponse,
} from "../proto/appointment/appointment_pb";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

const client = new AppointmentServiceClient(
  import.meta.env.VITE_GRPC_URL || "http://localhost:8080",
  null,
  null
);

export const appointmentClient = {
  createAppointment: (data: CreateAppointmentRequest) =>
    new Promise<Appointment>((resolve, reject) => {
      client.createAppointment(data, {}, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    }),

  getAppointment: (id: string) =>
    new Promise<Appointment>((resolve, reject) => {
      const req = new GetAppointmentRequest();
      req.setId(id);
      client.getAppointment(req, {}, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    }),

  deleteAppointment: (id: string) =>
    new Promise<void>((resolve, reject) => {
      const req = new DeleteAppointmentRequest();
      req.setId(id);
      client.deleteAppointment(req, {}, (err) => {
        if (err) reject(err);
        else resolve();
      });
    }),

  listAppointments: (filters: ListAppointmentsRequest) =>
    new Promise<ListAppointmentsResponse>((resolve, reject) => {
      client.listAppointments(filters, {}, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    }),

  streamAppointments: (
    onData: (res: AppointmentStreamResponse) => void,
    onError?: (err: unknown) => void,
    onEnd?: () => void
  ) => {
    const req = new Empty();
    const stream = client.streamAppointments(req, {});
    stream.on("data", onData);
    if (onError) stream.on("error", onError);
    if (onEnd) stream.on("end", onEnd);
    return stream;
  },
};
