package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pasDamola/schedule-management-system/internal/database"
	"github.com/pasDamola/schedule-management-system/internal/models"
	"github.com/sirupsen/logrus"
)

type AppointmentRepository interface {
	Create(ctx context.Context, appointment *models.CreateAppointmentRequest) (*models.Appointment, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.Appointment, error)
	Update(ctx context.Context, appointment *models.UpdateAppointmentRequest) (*models.Appointment, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, req *models.ListAppointmentsRequest) (*models.ListAppointmentsResponse, error)
	CheckConflict(ctx context.Context, startTime, endTime time.Time, excludeID *uuid.UUID) (bool, error)
}

type appointmentRepository struct {
	db *database.DB
}

func NewAppointmentRepository(db *database.DB) AppointmentRepository {
	return &appointmentRepository{db: db}
}

func (r *appointmentRepository) Create(ctx context.Context, req *models.CreateAppointmentRequest) (*models.Appointment, error) {
	// Start transaction for conflict checking and insertion
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Check for conflicts using database function
	var hasConflict bool
	err = tx.QueryRowContext(ctx, 
		"SELECT check_appointment_conflict($1, $2)", 
		req.StartTime, req.EndTime,
	).Scan(&hasConflict)
	if err != nil {
		return nil, fmt.Errorf("failed to check conflicts: %v", err)
	}

	if hasConflict {
		return nil, models.ErrAppointmentConflict
	}

	// Insert new appointment
	appointment := &models.Appointment{
		ID:        uuid.New(),
		Title:     req.Title,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	query := `
		INSERT INTO appointments (id, title, start_time, end_time, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, title, start_time, end_time, created_at, updated_at`

	err = tx.QueryRowContext(ctx, query,
		appointment.ID, appointment.Title, appointment.StartTime,
		appointment.EndTime, appointment.CreatedAt, appointment.UpdatedAt,
	).Scan(
		&appointment.ID, &appointment.Title, &appointment.StartTime,
		&appointment.EndTime, &appointment.CreatedAt, &appointment.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create appointment: %v", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	logrus.WithField("appointment_id", appointment.ID).Info("Appointment created successfully")
	return appointment, nil
}

func (r *appointmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Appointment, error) {
	appointment := &models.Appointment{}
	query := `
		SELECT id, title, start_time, end_time, created_at, updated_at
		FROM appointments
		WHERE id = $1`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&appointment.ID, &appointment.Title, &appointment.StartTime,
		&appointment.EndTime, &appointment.CreatedAt, &appointment.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, models.ErrAppointmentNotFound
		}
		return nil, fmt.Errorf("failed to get appointment: %v", err)
	}

	return appointment, nil
}

func (r *appointmentRepository) Update(ctx context.Context, req *models.UpdateAppointmentRequest) (*models.Appointment, error) {
	// Start transaction for conflict checking and update
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Check for conflicts excluding current appointment
	var hasConflict bool
	err = tx.QueryRowContext(ctx,
		"SELECT check_appointment_conflict($1, $2, $3)",
		req.StartTime, req.EndTime, req.ID,
	).Scan(&hasConflict)
	if err != nil {
		return nil, fmt.Errorf("failed to check conflicts: %v", err)
	}

	if hasConflict {
		return nil, models.ErrAppointmentConflict
	}

	// Update appointment
	query := `
		UPDATE appointments
		SET title = $2, start_time = $3, end_time = $4, updated_at = NOW()
		WHERE id = $1
		RETURNING id, title, start_time, end_time, created_at, updated_at`

	appointment := &models.Appointment{}
	err = tx.QueryRowContext(ctx, query, req.ID, req.Title, req.StartTime, req.EndTime).Scan(
		&appointment.ID, &appointment.Title, &appointment.StartTime,
		&appointment.EndTime, &appointment.CreatedAt, &appointment.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, models.ErrAppointmentNotFound
		}
		return nil, fmt.Errorf("failed to update appointment: %v", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	logrus.WithField("appointment_id", appointment.ID).Info("Appointment updated successfully")
	return appointment, nil
}

func (r *appointmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM appointments WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete appointment: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return models.ErrAppointmentNotFound
	}

	logrus.WithField("appointment_id", id).Info("Appointment deleted successfully")
	return nil
}

func (r *appointmentRepository) List(ctx context.Context, req *models.ListAppointmentsRequest) (*models.ListAppointmentsResponse, error) {
	// Set defaults
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 20
	}

	// Build query with filters
	var whereConditions []string
	var args []interface{}
	argIndex := 1

	if req.Search != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("to_tsvector('english', title) @@ plainto_tsquery('english', $%d)", argIndex))
		args = append(args, req.Search)
		argIndex++
	}

	if !req.StartDate.IsZero() {
		whereConditions = append(whereConditions, fmt.Sprintf("start_time >= $%d", argIndex))
		args = append(args, req.StartDate)
		argIndex++
	}

	if !req.EndDate.IsZero() {
		whereConditions = append(whereConditions, fmt.Sprintf("end_time <= $%d", argIndex))
		args = append(args, req.EndDate)
		argIndex++
	}

	whereClause := ""
	if len(whereConditions) > 0 {
		whereClause = "WHERE " + strings.Join(whereConditions, " AND ")
	}

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM appointments %s", whereClause)
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to get total count: %v", err)
	}

	// Get appointments with pagination
	offset := (req.Page - 1) * req.Limit
	query := fmt.Sprintf(`
		SELECT id, title, start_time, end_time, created_at, updated_at
		FROM appointments %s
		ORDER BY start_time ASC
		LIMIT $%d OFFSET $%d`,
		whereClause, argIndex, argIndex+1)

	args = append(args, req.Limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list appointments: %v", err)
	}
	defer rows.Close()

	var appointments []models.Appointment
	for rows.Next() {
		var appointment models.Appointment
		err := rows.Scan(
			&appointment.ID, &appointment.Title, &appointment.StartTime,
			&appointment.EndTime, &appointment.CreatedAt, &appointment.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan appointment: %v", err)
		}
		appointments = append(appointments, appointment)
	}

	return &models.ListAppointmentsResponse{
		Appointments: appointments,
		Total:        total,
		Page:         req.Page,
		Limit:        req.Limit,
	}, nil
}

func (r *appointmentRepository) CheckConflict(ctx context.Context, startTime, endTime time.Time, excludeID *uuid.UUID) (bool, error) {
	var hasConflict bool
	var err error

	if excludeID != nil {
		err = r.db.QueryRowContext(ctx,
			"SELECT check_appointment_conflict($1, $2, $3)",
			startTime, endTime, *excludeID,
		).Scan(&hasConflict)
	} else {
		err = r.db.QueryRowContext(ctx,
			"SELECT check_appointment_conflict($1, $2)",
			startTime, endTime,
		).Scan(&hasConflict)
	}