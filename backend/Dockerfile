# =========================================================
# Stage 1: Builder
# Use a specific version for reproducibility
# =========================================================
FROM golang:1.24-alpine AS builder

# Install build dependencies first
RUN apk add --no-cache git protobuf-dev

WORKDIR /app

# --- OPTIMIZATION 1: Copy ONLY dependency files first ---
# This is the most important change.
# go.mod and go.sum only change when you add/remove a dependency.
COPY go.mod go.sum ./

# --- OPTIMIZATION 2: Download dependencies in a separate layer ---
# This layer will only be re-run if go.mod or go.sum changes.
# This saves a huge amount of time.
RUN go mod download

# --- OPTIMIZATION 3: Copy proto files and generate code next ---
# Proto files change more often than dependencies, but less often
# than your main application code.
COPY proto/ ./proto/
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
# Generate Go code from .proto files
RUN protoc --proto_path=proto --go_out=./ --go_opt=paths=source_relative \
    --go-grpc_out=./ --go-grpc_opt=paths=source_relative \
    proto/appointment/appointment.proto

# --- OPTIMIZATION 4: Copy the rest of your source code LAST ---
# Your main .go files are what you change most often. By copying
# them last, we ensure the slow `go build` command is the only
# thing that re-runs during daily development.
COPY . .

# Build the application. This is now one of the last steps.
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /main cmd/server/main.go


# =========================================================
# Stage 2: Final Runtime Image
# This stage is much smaller because it doesn't contain the Go toolchain.
# =========================================================
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app/

# Copy the compiled binary from the builder stage
COPY --from=builder /main .

# Copy migration files from the builder stage
COPY --from=builder /app/internal/database/migrations ./internal/database/migrations

# Expose port
EXPOSE 50051

# Define the command to run your application
CMD ["/app/main"]