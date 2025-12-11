# Receptionist Dashboard - Booking Management

## Overview

The Receptionist Dashboard displays all bookings from the `booking` table in the database for today's date. Receptionists can view, approve, reject, and mark bookings as arrived.

## Database Table: `booking`

The receptionist dashboard reads from the `booking` table which has the following key fields:

```sql
CREATE TABLE booking (
    bookingId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicleNumber VARCHAR(100) NOT NULL,
    vehicleType VARCHAR(100),
    fuelType VARCHAR(50),
    vehicleBrand VARCHAR(100),
    vehicleBrandModel VARCHAR(100),
    manufacturedYear YEAR,
    transmissionType VARCHAR(50),
    bookingDate DATE NOT NULL,
    timeSlot VARCHAR(100) NOT NULL,
    serviceTypes JSON,
    specialRequests TEXT,
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'arrived'),
    arrivedTime TIME NULL,
    customerId INT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Status Workflow

The receptionist can manage bookings through the following status transitions:

1. **pending** → **confirmed** (Approve)
   - Receptionist reviews and approves the booking
2. **pending** → **cancelled** (Reject)
   - Receptionist rejects the booking
3. **confirmed** → **arrived** (Mark Arrived)
   - Customer arrives at the service center
   - System captures the arrival time

## API Endpoints

### Get Today's Bookings

```
GET /api/bookings/today
```

Returns all bookings for today, ordered by time slot.

Response format:

```json
[
  {
    "id": 14,
    "timeSlot": "07:30 AM - 09:00 AM",
    "vehicleNumber": "ABC-1234",
    "customer": "John Smith",
    "status": "pending",
    "arrivedTime": null,
    "phone": "0771234567",
    "vehicleType": "Sedan",
    "serviceTypes": ["Oil Change", "Brake Inspection"],
    "specialRequests": "Please check the air conditioning system"
  }
]
```

### Update Booking Status

```
PUT /api/bookings/:bookingId/status
```

Request body:

```json
{
  "status": "confirmed" // or "cancelled", "arrived"
}
```

### Get Booking Details

```
GET /api/bookings/:bookingId
```

Returns full details of a specific booking.

## Frontend Features

### Dashboard View

- **Summary Cards**: Total scheduled, pending, confirmed, arrived, cancelled
- **Filter Options**: All, Pending, Confirmed, Arrived, Cancelled
- **Search**: By vehicle number, customer name, or phone number
- **Actions**: Approve, Reject, Mark Arrived (based on current status)

### Status Badge Colors

- 🟡 **Pending**: Yellow (awaiting receptionist approval)
- 🔵 **Confirmed**: Blue (approved, awaiting arrival)
- 🟢 **Arrived**: Green (customer has arrived)
- 🔴 **Cancelled**: Red (booking rejected)
- 🟣 **In Progress**: Purple (being serviced)
- 🔵 **Completed**: Blue (service finished)

## Testing

### Add Test Bookings

Run the test data script to add sample bookings for today:

```bash
cd vehicle-service-backend
node add_today_bookings.js
```

This will add 6 test bookings with various statuses:

- 3 pending bookings
- 2 confirmed bookings
- 1 arrived booking

### Verify Data

Check bookings via API:

```bash
curl http://localhost:5000/api/bookings/today
```

Check database directly:

```sql
SELECT bookingId, vehicleNumber, name, timeSlot, status, arrivedTime
FROM booking
WHERE bookingDate = CURDATE()
ORDER BY timeSlot;
```

## Usage Flow

1. **Customer books service** → Status: `pending`
2. **Receptionist reviews** →
   - Approves → Status: `confirmed`
   - Rejects → Status: `cancelled`
3. **Customer arrives** → Receptionist marks as arrived → Status: `arrived`
4. **Service advisor assigns mechanics** → Status: `in_progress`
5. **Service completed** → Status: `completed`

## File Locations

### Backend

- Controller: `vehicle-service-backend/controllers/bookingController.js`
- Routes: `vehicle-service-backend/routes/bookingRoutes.js`
- Test Data Script: `vehicle-service-backend/add_today_bookings.js`

### Frontend

- Dashboard Component: `src/pages/ReceptionistDashboard.jsx`
- API Client: `src/utils/api.js`

## Running the Application

### Start Backend (Port 5000)

```bash
cd vehicle-service-backend
npm run dev
```

### Start Frontend (Port 5173)

```bash
cd ..
npm run dev
```

### Access Dashboard

Navigate to: `http://localhost:5173/receptionist-dashboard`

## Notes

- The booking table has a **unique constraint** on `(bookingDate, timeSlot)` to prevent double-booking
- **8 time slots** are available per day:
  - 07:30 AM - 09:00 AM
  - 09:00 AM - 10:30 AM
  - 10:30 AM - 12:00 PM
  - 12:30 PM - 02:00 PM
  - 02:00 PM - 03:30 PM
  - 03:30 PM - 05:00 PM
  - 05:00 PM - 06:30 PM
  - 06:30 PM - 07:30 PM
- `arrivedTime` is automatically set when marking a booking as "arrived"
- Bookings can be filtered by status for easy management
- The dashboard auto-refreshes on status changes without page reload
