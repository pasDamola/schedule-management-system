import * as jspb from 'google-protobuf'

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'; // proto import: "google/protobuf/timestamp.proto"
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"


export class Appointment extends jspb.Message {
  getId(): string;
  setId(value: string): Appointment;

  getTitle(): string;
  setTitle(value: string): Appointment;

  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): Appointment;
  hasStartTime(): boolean;
  clearStartTime(): Appointment;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): Appointment;
  hasEndTime(): boolean;
  clearEndTime(): Appointment;

  getCreatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreatedAt(value?: google_protobuf_timestamp_pb.Timestamp): Appointment;
  hasCreatedAt(): boolean;
  clearCreatedAt(): Appointment;

  getUpdatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setUpdatedAt(value?: google_protobuf_timestamp_pb.Timestamp): Appointment;
  hasUpdatedAt(): boolean;
  clearUpdatedAt(): Appointment;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Appointment.AsObject;
  static toObject(includeInstance: boolean, msg: Appointment): Appointment.AsObject;
  static serializeBinaryToWriter(message: Appointment, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Appointment;
  static deserializeBinaryFromReader(message: Appointment, reader: jspb.BinaryReader): Appointment;
}

export namespace Appointment {
  export type AsObject = {
    id: string,
    title: string,
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    createdAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    updatedAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class CreateAppointmentRequest extends jspb.Message {
  getTitle(): string;
  setTitle(value: string): CreateAppointmentRequest;

  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): CreateAppointmentRequest;
  hasStartTime(): boolean;
  clearStartTime(): CreateAppointmentRequest;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): CreateAppointmentRequest;
  hasEndTime(): boolean;
  clearEndTime(): CreateAppointmentRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateAppointmentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateAppointmentRequest): CreateAppointmentRequest.AsObject;
  static serializeBinaryToWriter(message: CreateAppointmentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateAppointmentRequest;
  static deserializeBinaryFromReader(message: CreateAppointmentRequest, reader: jspb.BinaryReader): CreateAppointmentRequest;
}

export namespace CreateAppointmentRequest {
  export type AsObject = {
    title: string,
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class GetAppointmentRequest extends jspb.Message {
  getId(): string;
  setId(value: string): GetAppointmentRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAppointmentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetAppointmentRequest): GetAppointmentRequest.AsObject;
  static serializeBinaryToWriter(message: GetAppointmentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAppointmentRequest;
  static deserializeBinaryFromReader(message: GetAppointmentRequest, reader: jspb.BinaryReader): GetAppointmentRequest;
}

export namespace GetAppointmentRequest {
  export type AsObject = {
    id: string,
  }
}

export class DeleteAppointmentRequest extends jspb.Message {
  getId(): string;
  setId(value: string): DeleteAppointmentRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteAppointmentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteAppointmentRequest): DeleteAppointmentRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteAppointmentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteAppointmentRequest;
  static deserializeBinaryFromReader(message: DeleteAppointmentRequest, reader: jspb.BinaryReader): DeleteAppointmentRequest;
}

export namespace DeleteAppointmentRequest {
  export type AsObject = {
    id: string,
  }
}

export class ListAppointmentsRequest extends jspb.Message {
  getPage(): number;
  setPage(value: number): ListAppointmentsRequest;

  getLimit(): number;
  setLimit(value: number): ListAppointmentsRequest;

  getSearch(): string;
  setSearch(value: string): ListAppointmentsRequest;

  getStartDate(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartDate(value?: google_protobuf_timestamp_pb.Timestamp): ListAppointmentsRequest;
  hasStartDate(): boolean;
  clearStartDate(): ListAppointmentsRequest;

  getEndDate(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndDate(value?: google_protobuf_timestamp_pb.Timestamp): ListAppointmentsRequest;
  hasEndDate(): boolean;
  clearEndDate(): ListAppointmentsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListAppointmentsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListAppointmentsRequest): ListAppointmentsRequest.AsObject;
  static serializeBinaryToWriter(message: ListAppointmentsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListAppointmentsRequest;
  static deserializeBinaryFromReader(message: ListAppointmentsRequest, reader: jspb.BinaryReader): ListAppointmentsRequest;
}

export namespace ListAppointmentsRequest {
  export type AsObject = {
    page: number,
    limit: number,
    search: string,
    startDate?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    endDate?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class ListAppointmentsResponse extends jspb.Message {
  getAppointmentsList(): Array<Appointment>;
  setAppointmentsList(value: Array<Appointment>): ListAppointmentsResponse;
  clearAppointmentsList(): ListAppointmentsResponse;
  addAppointments(value?: Appointment, index?: number): Appointment;

  getTotal(): number;
  setTotal(value: number): ListAppointmentsResponse;

  getPage(): number;
  setPage(value: number): ListAppointmentsResponse;

  getLimit(): number;
  setLimit(value: number): ListAppointmentsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListAppointmentsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListAppointmentsResponse): ListAppointmentsResponse.AsObject;
  static serializeBinaryToWriter(message: ListAppointmentsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListAppointmentsResponse;
  static deserializeBinaryFromReader(message: ListAppointmentsResponse, reader: jspb.BinaryReader): ListAppointmentsResponse;
}

export namespace ListAppointmentsResponse {
  export type AsObject = {
    appointmentsList: Array<Appointment.AsObject>,
    total: number,
    page: number,
    limit: number,
  }
}

export class AppointmentStreamResponse extends jspb.Message {
  getEventType(): AppointmentStreamResponse.EventType;
  setEventType(value: AppointmentStreamResponse.EventType): AppointmentStreamResponse;

  getAppointment(): Appointment | undefined;
  setAppointment(value?: Appointment): AppointmentStreamResponse;
  hasAppointment(): boolean;
  clearAppointment(): AppointmentStreamResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AppointmentStreamResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AppointmentStreamResponse): AppointmentStreamResponse.AsObject;
  static serializeBinaryToWriter(message: AppointmentStreamResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AppointmentStreamResponse;
  static deserializeBinaryFromReader(message: AppointmentStreamResponse, reader: jspb.BinaryReader): AppointmentStreamResponse;
}

export namespace AppointmentStreamResponse {
  export type AsObject = {
    eventType: AppointmentStreamResponse.EventType,
    appointment?: Appointment.AsObject,
  }

  export enum EventType { 
    CREATED = 0,
    UPDATED = 1,
    DELETED = 2,
  }
}

