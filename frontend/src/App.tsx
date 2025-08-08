import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AppointmentForm } from "./components/AppointmentForm";
import { AppointmentList } from "./components/AppointmentList";
import { SearchFilter } from "./components/SearchFilter";
import { useAppointmentUpdates } from "./hooks/useAppointment";
import { Appointment, ListAppointmentsRequest } from "./types/appointment";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppointmentManager: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<
    Appointment | undefined
  >();
  const [filters, setFilters] = useState<ListAppointmentsRequest>({});
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>(
    []
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useAppointmentUpdates();

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAppointment(undefined);
    setSidebarOpen(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAppointment(undefined);
  };

  const handleSelectAppointment = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedAppointments((prev) => [...prev, id]);
    } else {
      setSelectedAppointments((prev) =>
        prev.filter((appointmentId) => appointmentId !== id)
      );
    }
  };

  const handleSelectAllAppointments = (selected: boolean) => {
    if (selected) {
      // This would need to be implemented with current appointments list
      // For now, we'll clear selections
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleNewAppointment = () => {
    setEditingAppointment(undefined);
    setShowForm(true);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-primary-600"
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
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Schedule Management
                </h1>
                <p className="text-sm text-gray-500">
                  Manage your appointments efficiently
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* New Appointment Button */}
              <button
                onClick={handleNewAppointment}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Appointment
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar */}
          <div
            className={`lg:col-span-4 xl:col-span-3 ${
              sidebarOpen ? "block" : "hidden lg:block"
            }`}
          >
            <div className="space-y-6">
              {/* Search and Filters */}
              <SearchFilter onFiltersChange={setFilters} />

              {/* Appointment Form */}
              {showForm && (
                <div className="lg:sticky lg:top-6">
                  <AppointmentForm
                    appointment={editingAppointment}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                  />
                </div>
              )}

              {/* Quick Stats */}
              {/* <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Today's Appointments
                    </span>
                    <span className="text-sm font-medium text-gray-900">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="text-sm font-medium text-gray-900">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Total Appointments
                    </span>
                    <span className="text-sm font-medium text-gray-900">0</span>
                  </div>
                </div>
              </div> */}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 xl:col-span-9 mt-6 lg:mt-0">
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Appointment List */}
            <AppointmentList
              filters={filters}
              selectedAppointments={selectedAppointments}
              onSelectAppointment={handleSelectAppointment}
              onSelectAllAppointments={handleSelectAllAppointments}
            />
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            style: {
              background: "#10B981",
            },
          },
          error: {
            style: {
              background: "#EF4444",
            },
          },
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppointmentManager />
    </QueryClientProvider>
  );
};

export default App;
