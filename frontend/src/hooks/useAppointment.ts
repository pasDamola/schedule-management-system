import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useEffect } from "react";

import { appointmentClient } from "../services/appointmentClient";

import {
  Appointment as ProtoAppointment,
  CreateAppointmentRequest as ProtoCreateAppointmentRequest,
  ListAppointmentsRequest as ProtoListAppointmentsRequest,
  AppointmentStreamResponse,
  AppointmentStreamResponse_EventType,
} from "../proto/appointment/appointment";
import { Timestamp } from "../proto/google/protobuf/timestamp";

export interface Appointment {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAppointmentsRequest {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ListAppointmentsResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateAppointmentRequest {
  title: string;
  startTime: Date;
  endTime: Date;
}

export interface UpdateAppointmentRequest {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

// ==================================================================
// 3. TRANSLATION HELPERS (THE "BOUNDARY")
// ==================================================================
// This helper converts the gRPC response (with Timestamp objects)
// into our clean application-level Appointment (with Date objects).
const protoToAppointment = (proto: ProtoAppointment): Appointment => ({
  id: proto.id,
  title: proto.title,
  startTime: proto.startTime ? Timestamp.toDate(proto.startTime) : new Date(),
  endTime: proto.endTime ? Timestamp.toDate(proto.endTime) : new Date(),
  createdAt: proto.createdAt ? Timestamp.toDate(proto.createdAt) : new Date(),
  updatedAt: proto.updatedAt ? Timestamp.toDate(proto.updatedAt) : new Date(),
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
      // Translate our app-level request (with Date) to the gRPC request (with Timestamp)
      const grpcRequest: ProtoListAppointmentsRequest = {
        page: filters.page || 1,
        limit: filters.limit || 20,
        search: filters.search || "",
        // Translate Date to Timestamp at the boundary
        startDate: filters.startDate
          ? Timestamp.fromDate(filters.startDate)
          : undefined,
        endDate: filters.endDate
          ? Timestamp.fromDate(filters.endDate)
          : undefined,
      };

      const response = await appointmentClient.listAppointments(grpcRequest);

      // Translate the gRPC response back to our clean app-level response
      return {
        ...response,
        appointments: response.appointments.map(protoToAppointment),
      };
    },
    staleTime: 30 * 1000,
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
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// --- Create Appointment Mutation ---
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateAppointmentRequest
    ): Promise<Appointment> => {
      const grpcRequest: ProtoCreateAppointmentRequest = {
        title: data.title,
        startTime: Timestamp.fromDate(data.startTime),
        endTime: Timestamp.fromDate(data.endTime),
      };
      const response = await appointmentClient.createAppointment(grpcRequest);
      return protoToAppointment(response);
    },
    onSuccess: () => {
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
    onSuccess: (_: unknown, deletedId: string) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
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
  // Get access to the query client so we can update the cache
  const queryClient = useQueryClient();

  useEffect(() => {
    let isSubscribed = true;

    const handleStreamEvent = (event: AppointmentStreamResponse) => {
      // Get the translated, clean appointment object
      const appointment = event.appointment
        ? protoToAppointment(event.appointment)
        : null;
      if (!appointment) return; // Ignore events without an appointment

      console.log(
        `[STREAM] Received event: ${
          AppointmentStreamResponse_EventType[event.eventType]
        } for ${appointment.title}`
      );

      switch (event.eventType) {
        case AppointmentStreamResponse_EventType.CREATED:
          // When a new item is created, the simplest and most reliable
          // way to update is to refetch the entire list.
          queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
          toast.success(`New appointment: ${appointment.title}`);
          break;

        case AppointmentStreamResponse_EventType.UPDATED:
          // When an item is updated, we can be more surgical.
          // Update the specific item's cache...
          queryClient.setQueryData(
            appointmentKeys.detail(appointment.id),
            appointment
          );
          // ...and then invalidate the lists to show the change.
          queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
          toast(`Appointment updated: ${appointment.title}`);
          break;

        case AppointmentStreamResponse_EventType.DELETED:
          // When an item is deleted, remove it from the cache...
          queryClient.removeQueries({
            queryKey: appointmentKeys.detail(appointment.id),
          });
          // ...and invalidate the lists.
          queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
          toast.error(`Appointment deleted: ${appointment.title}`);
          break;
      }
    };

    async function listenForUpdates() {
      const stream = appointmentClient.streamAppointments();
      try {
        for await (const event of stream.responses) {
          if (!isSubscribed) break;
          handleStreamEvent(event);
        }
      } catch (error) {
        if (isSubscribed) {
          console.error("Appointment stream disconnected with error:", error);
          // Optionally, you could add logic here to try and reconnect after a delay.
        }
      }
    }

    // Start listening when the hook is mounted
    listenForUpdates();

    // Cleanup function that runs when the component using the hook unmounts
    return () => {
      isSubscribed = false;
      console.log("[STREAM] Unsubscribed from appointment updates.");
    };
  }, [queryClient]); // Rerun the effect if the queryClient instance changes
};
