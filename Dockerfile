# Build stage
FROM golang:1.21-alpine AS builder

# Install necessary packages
RUN apk add --no-cache git protobuf-dev

# Install protoc-gen-go and protoc-gen-go-grpc
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Change directory to proto and generate protobuf files into ../pkg/pb
WORKDIR /app/proto
RUN protoc --go_out=../pkg/pb --go_opt=paths=source_relative \
    --go-grpc_out=../pkg/pb --go-grpc_opt=paths=source_relative \
    appointment/appointment.proto

# Back to app directory for building
WORKDIR /app

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/server/main.go

# Runtime stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/main .

# Copy migration files
COPY --from=builder /app/internal/database/migrations ./internal/database/migrations

# Expose port
EXPOSE 50051

# Run the binary
CMD ["./main"]
