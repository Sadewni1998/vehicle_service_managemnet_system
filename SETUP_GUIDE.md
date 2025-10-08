# Vehicle Service Management System - Setup Guide

## Backend Setup

### 1. Environment Variables

Create a `.env` file in the `vehicle-service-backend` directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=vehicle_service_db

# JWT Secret (use a strong, random string)
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 2. Database Setup

1. Create a MySQL database named `vehicle_service_db`
2. Run the SQL script from `vehicle-service-backend/db_setup.sql` to create tables

### 3. Install Dependencies

```bash
cd vehicle-service-backend
npm install
```

### 4. Start Backend Server

```bash
npm start
```

The backend will run on http://localhost:5000

## Frontend Setup

### 1. Environment Variables

Create a `.env` file in the root directory with:

```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Frontend Development Server

```bash
npm run dev
```

The frontend will run on http://localhost:5173

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration (with mandatory vehicle information)
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)

### Vehicles

- `GET /api/vehicles` - Get user vehicles (protected)
- `POST /api/vehicles` - Add new vehicle (protected)
- `GET /api/vehicles/:id` - Get vehicle by ID (protected)
- `PUT /api/vehicles/:id` - Update vehicle (protected)
- `DELETE /api/vehicles/:id` - Delete vehicle (protected)

### Bookings

- `GET /api/bookings/availability` - Check booking availability (public)
- `POST /api/bookings` - Create booking (protected)
- `GET /api/bookings/user` - Get user bookings (protected)
- `GET /api/bookings/:id` - Get booking by ID (protected)
- `PUT /api/bookings/:id` - Update booking (protected)
- `PUT /api/bookings/:id/status` - Update booking status (protected)
- `DELETE /api/bookings/:id` - Delete booking (protected)

### Breakdown Service

- `POST /api/breakdown/request` - Create breakdown request (protected)
- `GET /api/breakdown/my-requests` - Get user breakdown requests (protected)

## Features Connected

✅ **User Registration** - Users must register with complete vehicle information
✅ **User Login** - Email/password authentication with JWT tokens
✅ **Booking System** - Create, view, update, and delete bookings
✅ **Vehicle Management** - Mandatory vehicle information during registration and dashboard management
✅ **Authentication** - Protected routes with JWT middleware
✅ **Error Handling** - Proper error messages and validation
✅ **CORS** - Configured for frontend-backend communication

## Testing the Connection

1. Start both backend and frontend servers
2. Visit http://localhost:5173
3. Try registering a new account
4. Try logging in
5. Try creating a booking

The system is now fully connected and ready to use!
