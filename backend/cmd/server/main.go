package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware"
	grpc_logrus "github.com/grpc-ecosystem/go-grpc-middleware/logging/logrus"
	grpc_recovery "github.com/grpc-ecosystem/go-grpc-middleware/recovery"
	grpc_ctxtags "github.com/grpc-ecosystem/go-grpc-middleware/tags"
	"github.com/pasDamola/schedule-management-system/internal/config"
	"github.com/pasDamola/schedule-management-system/internal/database"
	grpcServer "github.com/pasDamola/schedule-management-system/internal/grpc"
	"github.com/pasDamola/schedule-management-system/internal/repository"
	"github.com/pasDamola/schedule-management-system/internal/service"
	pb "github.com/pasDamola/schedule-management-system/pkg/pb"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	// Initialize logger
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetLevel(logrus.InfoLevel)

	// Load configuration
	cfg := config.Load()
	logrus.WithField("config", cfg).Info("Configuration loaded")

	// Initialize database
	db, err := database.NewPostgresDB(&cfg.Database)
	if err != nil {
		logrus.WithError(err).Fatal("Failed to connect to database")
	}
	defer db.Close()

	// Run migrations
	if err := db.RunMigrations(); err != nil {
		logrus.WithError(err).Fatal("Failed to run database migrations")
	}

	// Initialize repository
	appointmentRepo := repository.NewAppointmentRepository(db)

	// Initialize service
	appointmentService := service.NewAppointmentService(appointmentRepo)

	// Initialize gRPC server
	server := setupGRPCServer(appointmentService)

	// Start server
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", cfg.Server.Port))
	if err != nil {
		logrus.WithError(err).Fatal("Failed to listen")
	}

	// Graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		logrus.WithField("port", cfg.Server.Port).Info("Starting gRPC server")
		if err := server.Serve(lis); err != nil {
			logrus.WithError(err).Error("gRPC server failed")
			cancel()
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-sigChan:
		logrus.WithField("signal", sig).Info("Received shutdown signal")
	case <-ctx.Done():
		logrus.Info("Context cancelled")
	}

	// Graceful shutdown
	logrus.Info("Shutting down gRPC server...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	done := make(chan struct{})
	go func() {
		server.GracefulStop()
		close(done)
	}()

	select {
	case <-done:
		logrus.Info("gRPC server shut down gracefully")
	case <-shutdownCtx.Done():
		logrus.Warn("gRPC server shutdown timed out, forcing stop")
		server.Stop()
	}
}

func setupGRPCServer(appointmentService service.AppointmentService) *grpc.Server {
	// Setup logging
	logrusEntry := logrus.NewEntry(logrus.StandardLogger())
	
	// Setup gRPC middleware
	opts := []grpc.ServerOption{
		grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(
			grpc_ctxtags.StreamServerInterceptor(),
			grpc_logrus.StreamServerInterceptor(logrusEntry),
			grpc_recovery.StreamServerInterceptor(),
		)),
		grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(
			grpc_ctxtags.UnaryServerInterceptor(),
			grpc_logrus.UnaryServerInterceptor(logrusEntry),
			grpc_recovery.UnaryServerInterceptor(),
		)),
	}

	server := grpc.NewServer(opts...)

	// Register services
	appointmentServer := grpcServer.NewAppointmentServer(appointmentService)
	pb.RegisterAppointmentServiceServer(server, appointmentServer)

	// Enable reflection for development
	reflection.Register(server)

	logrus.Info("gRPC server configured successfully")
	return server
}