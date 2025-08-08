import { FormData, ValidationError } from "../types/appointment";

export const validateAppointmentForm = (data: FormData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Title validation
  if (!data.title.trim()) {
    errors.push({
      field: "title",
      message: "Title is required",
    });
  } else if (data.title.trim().length < 2) {
    errors.push({
      field: "title",
      message: "Title must be at least 2 characters long",
    });
  } else if (data.title.trim().length > 255) {
    errors.push({
      field: "title",
      message: "Title must be less than 255 characters",
    });
  }

  // Date validation
  if (!data.date) {
    errors.push({
      field: "date",
      message: "Date is required",
    });
  } else {
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      errors.push({
        field: "date",
        message: "Cannot schedule appointments in the past",
      });
    }
  }

  // Start time validation
  if (!data.startTime) {
    errors.push({
      field: "startTime",
      message: "Start time is required",
    });
  }

  // End time validation
  if (!data.endTime) {
    errors.push({
      field: "endTime",
      message: "End time is required",
    });
  }

  // Time range validation
  if (data.startTime && data.endTime) {
    const startDateTime = new Date(`${data.date}T${data.startTime}`);
    const endDateTime = new Date(`${data.date}T${data.endTime}`);

    if (endDateTime <= startDateTime) {
      errors.push({
        field: "endTime",
        message: "End time must be after start time",
      });
    } else {
      const durationMinutes =
        (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);

      if (durationMinutes < 15) {
        errors.push({
          field: "endTime",
          message: "Appointment must be at least 15 minutes long",
        });
      } else if (durationMinutes > 480) {
        // 8 hours
        errors.push({
          field: "endTime",
          message: "Appointment cannot be longer than 8 hours",
        });
      }
    }

    // Check if appointment is in the past
    const now = new Date();
    if (startDateTime <= now) {
      errors.push({
        field: "startTime",
        message: "Appointment time must be in the future",
      });
    }
  }

  return errors;
};

export const combineDateTime = (date: string, time: string): Date => {
  return new Date(`${date}T${time}`);
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
};

export const getRelativeDateString = (date: Date): string => {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return formatDate(date);
};
