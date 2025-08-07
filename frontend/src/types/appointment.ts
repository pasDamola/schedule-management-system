export interface Appointment {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
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

export enum AppointmentEventType {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
}

export interface AppointmentStreamEvent {
  eventType: AppointmentEventType;
  appointment: Appointment;
}

export interface FormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface AppointmentConflict {
  conflictingAppointment: Appointment;
  message: string;
}
