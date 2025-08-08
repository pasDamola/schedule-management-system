import React, { useState } from "react";
import { useAppointments, useDeleteAppointment } from "../hooks/useAppointment";
import { Appointment, ListAppointmentsRequest } from "../types/appointment";
import {
  formatDateTime,
  formatTime,
  getRelativeDateString,
  isToday,
} from "../utils/validation";

interface AppointmentListProps {
  filters?: ListAppointmentsRequest;
  onEditAppointment?: (appointment: Appointment) => void;
  selectedAppointments?: string[];
  onSelectAppointment?: (id: string, selected: boolean) => void;
  onSelectAllAppointments?: (selected: boolean) => void;
  className?: string;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  filters = {},
  onEditAppointment,
  selectedAppointments = [],
  onSelectAppointment,
  className = "",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const {
    data: appointmentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAppointments({ ...filters, page: currentPage });

  const deleteMutation = useDeleteAppointment();

  const appointments = appointmentsData?.appointments || [];
  const totalPages = appointmentsData
    ? Math.ceil(appointmentsData.total / appointmentsData.limit)
    : 0;

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Failed to delete appointment:", error);
    }
  };

  const isAppointmentPast = (appointment: Appointment): boolean => {
    return new Date(appointment.endTime) < new Date();
  };

  const isAppointmentUpcoming = (appointment: Appointment): boolean => {
    const now = new Date();
    const startTime = new Date(appointment.startTime);
    return (
      startTime > now &&
      startTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000
    ); // Within 24 hours
  };

  if (isLoading) {
    return <LoadingSpinner className={className} />;
  }

  if (isError) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="text-danger-500 text-lg font-semibold mb-2">
            Error Loading Appointments
          </div>
          <p className="text-gray-600 mb-4">
            {error instanceof Error
              ? error.message
              : "Failed to load appointments"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        title="No appointments found"
        description="Get started by creating your first appointment."
        className={className}
      />
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Appointment list */}
      <div className="divide-y divide-gray-200">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {/* Selection checkbox */}
                {onSelectAppointment && (
                  <input
                    type="checkbox"
                    checked={selectedAppointments.includes(appointment.id)}
                    onChange={(e) =>
                      onSelectAppointment(appointment.id, e.target.checked)
                    }
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                )}

                {/* Appointment details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {appointment.title}
                    </h3>

                    {/* Status badges */}
                    {isAppointmentPast(appointment) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Past
                      </span>
                    )}

                    {isAppointmentUpcoming(appointment) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Upcoming
                      </span>
                    )}

                    {isToday(new Date(appointment.startTime)) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">
                        {getRelativeDateString(new Date(appointment.startTime))}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        {formatTime(new Date(appointment.startTime))} -{" "}
                        {formatTime(new Date(appointment.endTime))}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Created {formatDateTime(new Date(appointment.createdAt))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2 ml-4">
                {onEditAppointment && (
                  <button
                    onClick={() => onEditAppointment(appointment)}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    title="Edit appointment"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                )}

                <button
                  onClick={() => setConfirmDeleteId(appointment.id)}
                  className="p-2 text-gray-400 hover:text-danger-600 transition-colors"
                  title="Delete appointment"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * (appointmentsData?.limit || 20) + 1}{" "}
              to{" "}
              {Math.min(
                currentPage * (appointmentsData?.limit || 20),
                appointmentsData?.total || 0
              )}{" "}
              of {appointmentsData?.total || 0} appointments
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this appointment? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAppointment(confirmDeleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components
const LoadingSpinner: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`bg-white rounded-lg shadow-md p-8 flex items-center justify-center ${className}`}
  >
    <div className="flex items-center space-x-3">
      <div className="w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-gray-600">Loading appointments...</span>
    </div>
  </div>
);

const EmptyState: React.FC<{
  title: string;
  description: string;
  className?: string;
}> = ({ title, description, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md p-8 text-center ${className}`}>
    <svg
      className="w-16 h-16 text-gray-400 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);
