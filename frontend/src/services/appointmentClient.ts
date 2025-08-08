import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { Empty } from "../proto/google/protobuf/empty";

import { AppointmentServiceClient } from "../proto/appointment/appointment.client";

import {
  Appointment,
  CreateAppointmentRequest,
  DeleteAppointmentRequest,
  GetAppointmentRequest,
  ListAppointmentsRequest,
  ListAppointmentsResponse,
} from "../proto/appointment/appointment";

const transport = new GrpcWebFetchTransport({
  baseUrl: import.meta.env.VITE_GRPC_URL || "http://localhost:8080",
});

// Instantiate the generated client with the transport.
const client = new AppointmentServiceClient(transport);

export const appointmentClient = {
  /**
   * Creates a new appointment.
   * Translates a request with a Date object into a gRPC request with a Timestamp.
   */
  async createAppointment(
    request: CreateAppointmentRequest
  ): Promise<Appointment> {
    // The generated client returns a `UnaryCall` object.
    // We await its `.response` property, which is a Promise.
    const { response } = await client.createAppointment(request);
    return response;
  },

  /**
   * Fetches a single appointment by its ID.
   */
  async getAppointment(id: string): Promise<Appointment> {
    const request: GetAppointmentRequest = { id };
    const { response } = await client.getAppointment(request);
    return response;
  },

  /**
   * Deletes an appointment by its ID.
   */
  async deleteAppointment(id: string): Promise<Empty> {
    const request: DeleteAppointmentRequest = { id };
    const { response } = await client.deleteAppointment(request);
    return response;
  },

  /**
   * Fetches a paginated and filtered list of appointments.
   */
  async listAppointments(
    request: ListAppointmentsRequest
  ): Promise<ListAppointmentsResponse> {
    const { response } = await client.listAppointments(request);
    return response;
  },

  /**
   * Establishes a real-time stream for appointment events.
   * This returns the stream object directly for the UI to handle.
   */
  streamAppointments() {
    const request: Empty = {};
    // The `ServerStreamingCall` object is an async iterable, perfect for `for await...of` loops.
    const stream = client.streamAppointments(request);
    return stream;
  },
};
