# Schedule Management System

A full-stack appointment scheduling application built with React, TypeScript, Go, gRPC, and PostgreSQL.

## 🚀 Features

### Core Features

- ✅ **Appointment Management**: Create, read, and delete appointments
- ✅ **Conflict Prevention**: Prevents double-booking with real-time validation
- ✅ **Concurrent Safety**: Handles multiple users booking simultaneously
- ✅ **Real-time Updates**: Live updates using gRPC streaming
- ✅ **Search & Filter**: Find appointments by title, date range
- ✅ **Responsive Design**: Works seamlessly on desktop and mobile

### Technical Features

- ✅ **Type-Safe**: Full TypeScript integration
- ✅ **gRPC Communication**: High-performance client-server communication
- ✅ **Database Transactions**: ACID compliance with PostgreSQL
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **Validation**: Client-side and server-side validation
- ✅ **Performance**: Optimized queries with proper indexing
- ✅ **Containerized**: Docker-based deployment

## 🛠️ Technology Stack

### Backend

- **Language**: Go 1.21+
- **Framework**: gRPC with Protocol Buffers
- **Database**: PostgreSQL 15
- **Container**: Docker & Docker Compose

### Frontend

- **Framework**: React 18 with TypeScript
- **State Management**: React Query (TanStack Query)
- **Styling**: Tailwind CSS
- **Communication**: gRPC-Web via Envoy proxy
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

### Infrastructure

- **Proxy**: Envoy Proxy for gRPC-Web support
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL with proper indexing

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Go 1.21+ (for local development)
- Protocol Buffers compiler (for local development)

### Running with Docker (Recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/pasDamola/schedule-management-system.git
   cd schedule-management-system
   ```

2. **Start the backend services**

   ```bash
   cd backend
   docker-compose up -d
   ```

3. **Build and start the frontend**

   ```bash
   cd ../frontend
   docker build -t schedule-frontend .
   docker run -p 3000:80 schedule-frontend
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend gRPC: localhost:50051
   - Backend HTTP (via Envoy): http://localhost:8080

### Local Development Setup

#### Backend Setup

1. **Install dependencies**

   ```bash
   cd backend
   go mod download
   ```

2. **Install Protocol Buffers compiler**

   ```bash
   # macOS
   brew install protobuf

   # Ubuntu/Debian
   sudo apt-get install protobuf-compiler

   # Install Go plugins
   go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
   go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
   ```

3. **Generate protobuf files**

   ```bash
   mkdir -p pkg/pb
   protoc --go_out=pkg/pb --go_opt=paths=source_relative \
          --go-grpc_out=pkg/pb --go-grpc_opt=paths=source_relative \
          proto/appointment/appointment.proto
   ```

4. **Start PostgreSQL**

   ```bash
   docker run -d \
     --name postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=schedule_management \
     -p 5432:5432 \
     postgres:15-alpine
   ```

5. **Run the server**
   ```bash
   go run cmd/server/main.go
   ```

#### Frontend Setup

1. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Generate protobuf files** (if needed)

   ```bash
   npm run generate-proto
   ```

3. **Start development server**

   ```bash
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8080 (via Envoy proxy)

## 📋 API Documentation

### gRPC Service: AppointmentService

#### Methods

**CreateAppointment**

```protobuf
rpc CreateAppointment(CreateAppointmentRequest) returns (Appointment);
```

**GetAppointment**

```protobuf
rpc GetAppointment(GetAppointmentRequest) returns (Appointment);
```

**DeleteAppointment**

```protobuf
rpc DeleteAppointment(DeleteAppointmentRequest) returns (google.protobuf.Empty);
```

**ListAppointments**

```protobuf
rpc ListAppointments(ListAppointmentsRequest) returns (ListAppointmentsResponse);
```

**StreamAppointments**

```protobuf
rpc StreamAppointments(google.protobuf.Empty) returns (stream AppointmentStreamResponse);
```

### Data Models

**Appointment**

```protobuf
message Appointment {
  string id = 1;
  string title = 2;
  google.protobuf.Timestamp start_time = 3;
  google.protobuf.Timestamp end_time = 4;
  google.protobuf.Timestamp created_at = 5;
  google.protobuf.Timestamp updated_at = 6;
}
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
go test ./...
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Manual Testing Scenarios

1. **Basic Functionality Test**

   - Create several appointments
   - Verify chronological ordering
   - Test conflict prevention
   - Delete appointments

2. **Concurrent Booking Test**

   - Open multiple browser tabs
   - Try to book the same time slot simultaneously
   - Verify only one booking succeeds

3. **Real-time Updates Test**
   - Open multiple browser tabs
   - Create/update/delete appointments in one tab
   - Verify updates appear in other tabs

## 🚀 Deployment

### Production Deployment

1. **Build Docker images**

   ```bash
   # Backend
   cd backend
   docker build -t schedule-backend .

   # Frontend
   cd frontend
   docker build -t schedule-frontend .
   ```

2. **Deploy with Docker Compose**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Environment Variables**

   ```bash
   # Backend
   DB_HOST=postgres
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   DB_NAME=schedule_management
   SERVER_PORT=50051

   # Frontend
   REACT_APP_GRPC_URL=http://your-domain:8080
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=schedule_management
DB_SSLMODE=disable
SERVER_PORT=50051
```

#### Frontend (.env)

```env
REACT_APP_GRPC_URL=http://localhost:8080
```
