import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { appointmentClient } from "../services/appointmentClient";

import { AppointmentStreamResponse } from "../proto/appointment/appointment_pb";
import {
  Appointment as ProtoAppointment,
  CreateAppointmentRequest as ProtoCreateAppointmentRequest,
  ListAppointmentsRequest as ProtoListAppointmentsRequest,
  ListAppointmentsResponse as ProtoListAppointmentsResponse,
} from "../proto/appointment/appointment_pb"; // Adjust path if necessary
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import {
  Appointment,
  ListAppointmentsRequest,
  ListAppointmentsResponse,
  CreateAppointmentRequest,
} from "../types/appointment";

const protoToAppointment = (proto: ProtoAppointment.AsObject): Appointment => ({
  id: proto.id,
  title: proto.title,
  startTime: new Date(proto.startTime!.seconds * 1000),
  endTime: new Date(proto.endTime!.seconds * 1000),
  createdAt: new Date(proto.createdAt!.seconds * 1000),
  updatedAt: new Date(proto.updatedAt!.seconds * 1000),
});

// ==================================================================
// 4. REACT QUERY HOOKS
// ==================================================================

// --- Query Keys ---
export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: ListAppointmentsRequest) =>
    [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

// --- List Appointments Hook ---
export const useAppointments = (filters: ListAppointmentsRequest = {}) => {
  return useQuery({
    queryKey: appointmentKeys.list(filters),
    queryFn: async (): Promise<ListAppointmentsResponse> => {
      // Translate plain filter object to gRPC request class
      const grpcRequest = new ProtoListAppointmentsRequest();
      grpcRequest.setPage(filters.page || 1);
      grpcRequest.setLimit(filters.limit || 20);
      grpcRequest.setSearch(filters.search || "");
      if (filters.startDate)
        grpcRequest.setStartDate(Timestamp.fromDate(filters.startDate));
      if (filters.endDate)
        grpcRequest.setEndDate(Timestamp.fromDate(filters.endDate));

      const response = await appointmentClient.listAppointments(grpcRequest);
      const plainResponse = response.toObject();

      // Translate gRPC response to our plain application response type
      return {
        appointments: plainResponse.appointmentsList.map(protoToAppointment),
        total: plainResponse.total,
        page: plainResponse.page,
        limit: plainResponse.limit,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

// --- Get Single Appointment Hook ---
export const useAppointment = (id: string) => {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: async (): Promise<Appointment> => {
      const response = await appointmentClient.getAppointment(id);
      return protoToAppointment(response.toObject());
    },
    enabled: !!id, // Only run query if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// --- Create Appointment Mutation ---
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateAppointmentRequest
    ): Promise<Appointment> => {
      // Translate plain request object to gRPC request class
      const grpcRequest = new ProtoCreateAppointmentRequest();
      grpcRequest.setTitle(data.title);
      grpcRequest.setStartTime(Timestamp.fromDate(data.startTime));
      grpcRequest.setEndTime(Timestamp.fromDate(data.endTime));

      const response = await appointmentClient.createAppointment(grpcRequest);
      // Translate gRPC response class back to a plain object for the app
      return protoToAppointment(response.toObject());
    },
    onSuccess: () => {
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      toast.success("Appointment created successfully!");
    },
    onError: (error: Error) => {
      console.error("Failed to create appointment:", error);
      toast.error(error.message || "Failed to create appointment");
    },
  });
};

// --- Delete Appointment Mutation ---
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentClient.deleteAppointment(id),
    onSuccess: (_, deletedId) => {
      // Invalidate lists to refetch from the server
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      // Also remove the now-stale detail query from the cache
      queryClient.removeQueries({
        queryKey: appointmentKeys.detail(deletedId),
      });
      toast.success("Appointment deleted successfully!");
    },
    onError: (error: Error) => {
      console.error("Failed to delete appointment:", error);
      toast.error(error.message || "Failed to delete appointment");
    },
  });
};

export const useAppointmentUpdates = () => {
  const queryClient = useQueryClient();

  const subscribeToUpdates = () => {
    return appointmentClient.streamAppointments((event) => {
      const eventType = event.getEventType();
      const appointment = event.hasAppointment()
        ? event.getAppointment()!
        : null;

      switch (eventType) {
        case AppointmentStreamResponse.EventType.CREATED:
          queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
          if (appointment) {
            toast.success(`New appointment: ${appointment.getTitle()}`);
          }
          break;

        case AppointmentStreamResponse.EventType.UPDATED:
          if (appointment) {
            queryClient.setQueryData(
              appointmentKeys.detail(appointment.getId()),
              appointment
            );
            queryClient.invalidateQueries({
              queryKey: appointmentKeys.lists(),
            });
          }
          break;

        case AppointmentStreamResponse.EventType.DELETED:
          if (appointment) {
            queryClient.removeQueries({
              queryKey: appointmentKeys.detail(appointment.getId()),
            });
            queryClient.invalidateQueries({
              queryKey: appointmentKeys.lists(),
            });
          }
          break;
      }
    });
  };

  return { subscribeToUpdates };
};
