package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Custom errors
var (
	ErrAppointmentNotFound = errors.New("appointment not found")
	ErrAppointmentConflict = errors.New("appointment time conflicts with existing appointment")
	ErrInvalidTitle        = errors.New("invalid title: title cannot be empty")
	ErrInvalidTime         = errors.New("invalid time: start time and end time are required")
	ErrInvalidTimeRange    = errors.New("invalid time range: start time must be before end time")
	ErrInvalidID           = errors.New("invalid ID: ID cannot be empty")
	ErrPastTime            = errors.New("invalid time: cannot schedule appointments in the past")
)

type Appointment struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Title     string    `json:"title" db:"title"`
	StartTime time.Time `json:"start_time" db:"start_time"`
	EndTime   time.Time `json:"end_time" db:"end_time"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type CreateAppointmentRequest struct {
	Title     string    `json:"title" validate:"required,min=1,max=255"`
	StartTime time.Time `json:"start_time" validate:"required"`
	EndTime   time.Time `json:"end_time" validate:"required"`
}

type UpdateAppointmentRequest struct {
	ID        uuid.UUID `json:"id" validate:"required"`
	Title     string    `json:"title" validate:"required,min=1,max=255"`
	StartTime time.Time `json:"start_time" validate:"required"`
	EndTime   time.Time `json:"end_time" validate:"required"`
}

type ListAppointmentsRequest struct {
	Page      int       `json:"page" validate:"min=1"`
	Limit     int       `json:"limit" validate:"min=1,max=100"`
	Search    string    `json:"search"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
}

type ListAppointmentsResponse struct {
	Appointments []Appointment `json:"appointments"`
	Total        int           `json:"total"`
	Page         int           `json:"page"`
	Limit        int           `json:"limit"`
}

// Validation methods
func (req *CreateAppointmentRequest) Validate() error {
	if req.Title == "" {
		return ErrInvalidTitle
	}
	if req.StartTime.IsZero() || req.EndTime.IsZero() {
		return ErrInvalidTime
	}
	if req.StartTime.After(req.EndTime) || req.StartTime.Equal(req.EndTime) {
		return ErrInvalidTimeRange
	}
	if req.StartTime.Before(time.Now()) {
		return ErrPastTime
	}
	return nil
}

func (req *UpdateAppointmentRequest) Validate() error {
	if req.ID == uuid.Nil {
		return ErrInvalidID
	}
	if req.Title == "" {
		return ErrInvalidTitle
	}
	if req.StartTime.IsZero() || req.EndTime.IsZero() {
		return ErrInvalidTime
	}
	if req.StartTime.After(req.EndTime) || req.StartTime.Equal(req.EndTime) {
		return ErrInvalidTimeRange
	}
	return nil
}