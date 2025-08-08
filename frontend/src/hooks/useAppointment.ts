import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { appointmentClient } from "../services/appointmentClient";
import * as appointmentPb from "../proto/appointment_pb"; // Namespace import
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import {
  Appointment,
  ListAppointmentsRequest,
  ListAppointmentsResponse,
  CreateAppointmentRequest,
} from "../types/appointment";

// Create type aliases for cleaner usage
type ProtoAppointment = appointmentPb.Appointment;
type ProtoAppointmentStreamResponse = appointmentPb.AppointmentStreamResponse;

const protoToAppointment = (proto: ProtoAppointment): Appointment => ({
  id: proto.getId(),
  title: proto.getTitle(),
  startTime: proto.getStartTime()?.toDate() || new Date(),
  endTime: proto.getEndTime()?.toDate() || new Date(),
  createdAt: proto.getCreatedAt()?.toDate() || new Date(),
  updatedAt: proto.getUpdatedAt()?.toDate() || new Date(),
});

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
      const response = await appointmentClient.listAppointments(
        filters.page || 1,
        filters.limit || 20,
        filters.search || ""
      );

      return {
        appointments: response.getAppointmentsList().map(protoToAppointment),
        total: response.getTotal(),
        page: response.getPage(),
        limit: response.getLimit(),
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
      return protoToAppointment(response);
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
      const response = await appointmentClient.createAppointment(
        data.title,
        data.startTime,
        data.endTime
      );
      return protoToAppointment(response);
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
    return appointmentClient.streamAppointments(
      (event) => {
        const eventType = event.getEventType();
        const appointment = event.hasAppointment()
          ? protoToAppointment(event.getAppointment()!)
          : null;

        switch (eventType) {
          case appointmentPb.AppointmentStreamResponse.EventType.CREATED:
            queryClient.invalidateQueries({
              queryKey: appointmentKeys.lists(),
            });
            if (appointment) {
              toast.success(`New appointment: ${appointment.title}`);
            }
            break;

          case appointmentPb.AppointmentStreamResponse.EventType.UPDATED:
            if (appointment) {
              queryClient.setQueryData(
                appointmentKeys.detail(appointment.id),
                appointment
              );
              queryClient.invalidateQueries({
                queryKey: appointmentKeys.lists(),
              });
            }
            break;

          case appointmentPb.AppointmentStreamResponse.EventType.DELETED:
            if (appointment) {
              queryClient.removeQueries({
                queryKey: appointmentKeys.detail(appointment.id),
              });
              queryClient.invalidateQueries({
                queryKey: appointmentKeys.lists(),
              });
              toast.success(`Appointment deleted: ${appointment.title}`);
            }
            break;
        }
      },
      (err) => {
        console.error("Stream error:", err);
        setTimeout(subscribeToUpdates, 3000); // reconnect
      },
      () => {
        console.warn("Stream ended");
        setTimeout(subscribeToUpdates, 3000); // reconnect
      }
    );
  };

  return { subscribeToUpdates };
};
