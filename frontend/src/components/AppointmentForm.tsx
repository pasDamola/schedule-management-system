import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useCreateAppointment } from "../hooks/useAppointment";
import { Appointment, FormData } from "../types/appointment";
import { validateAppointmentForm, combineDateTime } from "../utils/validation";

interface AppointmentFormProps {
  appointment?: Appointment;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  onSuccess,
  onCancel,
  className = "",
}) => {
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const createMutation = useCreateAppointment();

  const isLoading = createMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      title: "",
      date: "",
      startTime: "",
      endTime: "",
    },
  });

  // Watch form values for real-time validation
  const formValues = watch();

  // Initialize form with appointment data if editing
  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.startTime);
      const endDate = new Date(appointment.endTime);

      setValue("title", appointment.title);
      setValue("date", startDate.toISOString().split("T")[0]);
      setValue("startTime", startDate.toTimeString().slice(0, 5));
      setValue("endTime", endDate.toTimeString().slice(0, 5));
    }
  }, [appointment, setValue]);

  // Real-time validation
  useEffect(() => {
    if (
      formValues.title ||
      formValues.date ||
      formValues.startTime ||
      formValues.endTime
    ) {
      const validationResult = validateAppointmentForm(formValues);
      const errorMap: Record<string, string> = {};

      validationResult.forEach((error) => {
        errorMap[error.field] = error.message;
      });

      setValidationErrors(errorMap);
    }
  }, [formValues]);

  // Initialize form with appointment data if editing
  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.startTime);
      const endDate = new Date(appointment.endTime);

      setValue("title", appointment.title);
      setValue("date", startDate.toISOString().split("T")[0]);
      setValue("startTime", startDate.toTimeString().slice(0, 5));
      setValue("endTime", endDate.toTimeString().slice(0, 5));
    }
  }, [appointment, setValue]);

  const onSubmit = async (data: FormData) => {
    // Validate form
    console.log("a", appointment);
    console.log(data);
    const validationResult = validateAppointmentForm(data);
    if (validationResult.length > 0) {
      const errorMap: Record<string, string> = {};
      validationResult.forEach((error) => {
        errorMap[error.field] = error.message;
      });
      setValidationErrors(errorMap);
      return;
    }

    try {
      const startTime = combineDateTime(data.date, data.startTime);
      const endTime = combineDateTime(data.date, data.endTime);

      await createMutation.mutateAsync({
        title: data.title.trim(),
        startTime,
        endTime,
      });

      reset();
      setValidationErrors({});
      onSuccess?.();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    reset();
    setValidationErrors({});
    onCancel?.();
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {"Create New Appointment"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title Field */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Title *
          </label>
          <input
            {...register("title", { required: "Title is required" })}
            type="text"
            id="title"
            placeholder="Enter appointment title"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
              errors.title || validationErrors.title
                ? "border-danger-500 bg-danger-50"
                : "border-gray-300"
            }`}
            disabled={isLoading}
          />
          {(errors.title || validationErrors.title) && (
            <p className="mt-1 text-sm text-danger-600">
              {errors.title?.message || validationErrors.title}
            </p>
          )}
        </div>

        {/* Date Field */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Date *
          </label>
          <input
            {...register("date", { required: "Date is required" })}
            type="date"
            id="date"
            min={new Date().toISOString().split("T")[0]}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
              errors.date || validationErrors.date
                ? "border-danger-500 bg-danger-50"
                : "border-gray-300"
            }`}
            disabled={isLoading}
          />
          {(errors.date || validationErrors.date) && (
            <p className="mt-1 text-sm text-danger-600">
              {errors.date?.message || validationErrors.date}
            </p>
          )}
        </div>

        {/* Time Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Start Time *
            </label>
            <input
              {...register("startTime", { required: "Start time is required" })}
              type="time"
              id="startTime"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.startTime || validationErrors.startTime
                  ? "border-danger-500 bg-danger-50"
                  : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {(errors.startTime || validationErrors.startTime) && (
              <p className="mt-1 text-sm text-danger-600">
                {errors.startTime?.message || validationErrors.startTime}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              End Time *
            </label>
            <input
              {...register("endTime", { required: "End time is required" })}
              type="time"
              id="endTime"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.endTime || validationErrors.endTime
                  ? "border-danger-500 bg-danger-50"
                  : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {(errors.endTime || validationErrors.endTime) && (
              <p className="mt-1 text-sm text-danger-600">
                {errors.endTime?.message || validationErrors.endTime}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isLoading || Object.keys(validationErrors).length > 0}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {"Creating..."}
              </div>
            ) : (
              "Create Appointment"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
