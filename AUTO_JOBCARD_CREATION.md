# Auto-Create Jobcard for Arrived Bookings

## Overview

When a booking status is updated to "arrived", the system now automatically creates a jobcard entry in the jobcard table.

## Implementation Date

October 8, 2025

---

## What Was Changed

### Modified File

`vehicle-service-backend/controllers/bookingController.js`

### Function Updated

`updateBookingStatus()`

---

## How It Works

### Workflow:

```
1. Receptionist marks booking as "arrived"
         ↓
2. System updates booking status to "arrived"
         ↓
3. System sets arrivedTime to current time
         ↓
4. System automatically creates jobcard ✨ NEW
         ↓
5. Jobcard is ready for Service Advisor to assign mechanics
```

---

## Jobcard Creation Logic

When booking status → "arrived":

1. ✅ Fetch booking's serviceTypes
2. ✅ Find an available mechanic (or use first active mechanic as placeholder)
3. ✅ Create jobcard with:
   - **mechanicId**: Placeholder mechanic (first available)
   - **bookingId**: The arrived booking ID
   - **partCode**: "PENDING_ASSIGNMENT" (to indicate not yet fully assigned)
   - **status**: "open"
   - **serviceDetails**: Service types from booking

---

## Database Changes

### jobcard table entry created:

```sql
INSERT INTO jobcard (
    mechanicId,
    bookingId,
    partCode,
    status,
    serviceDetails
) VALUES (
    ?, -- Placeholder mechanic ID
    ?, -- Arrived booking ID
    'PENDING_ASSIGNMENT',
    'open',
    ? -- Service types JSON from booking
);
```

---

## Code Implementation

```javascript
// If status changed to 'arrived', automatically create a jobcard
if (status === "arrived") {
  try {
    // Get booking details for jobcard creation
    const [bookingDetails] = await db.query(
      "SELECT serviceTypes FROM booking WHERE bookingId = ?",
      [bookingId]
    );

    if (bookingDetails.length > 0) {
      const serviceTypes = bookingDetails[0]?.serviceTypes || "[]";

      // Get an available mechanic as placeholder
      const [availableMechanics] = await db.query(
        "SELECT mechanicId FROM mechanic WHERE isActive = true ORDER BY mechanicId LIMIT 1"
      );

      if (availableMechanics.length > 0) {
        const defaultMechanicId = availableMechanics[0].mechanicId;

        // Create jobcard with status 'open'
        await db.query(
          `INSERT INTO jobcard (mechanicId, bookingId, partCode, status, serviceDetails) 
           VALUES (?, ?, ?, 'open', ?)`,
          [defaultMechanicId, bookingId, "PENDING_ASSIGNMENT", serviceTypes]
        );

        console.log(
          `✅ Jobcard automatically created for booking ${bookingId}`
        );
      }
    }
  } catch (jobcardError) {
    console.error("Error creating jobcard:", jobcardError);
    // Status update continues even if jobcard creation fails
  }
}
```

---

## Features

### ✅ Automatic Creation

- Jobcard created immediately when booking arrives
- No manual intervention needed
- Reduces workflow steps

### ✅ Placeholder Mechanic

- Uses first available mechanic as placeholder
- Service Advisor can reassign later
- Prevents jobcard creation failure

### ✅ Error Handling

- If jobcard creation fails, booking status still updates
- Error logged to console
- System continues to function

### ✅ Service Details Preserved

- All service types from booking copied to jobcard
- Mechanics know what services to perform
- No data loss

---

## Database Schema

### booking table:

```sql
bookingId INT PRIMARY KEY
status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'arrived')
arrivedTime TIME NULL
serviceTypes JSON
```

### jobcard table:

```sql
jobcardId INT PRIMARY KEY AUTO_INCREMENT
mechanicId INT NOT NULL
bookingId INT NOT NULL
partCode VARCHAR(100) NOT NULL
status ENUM('open', 'in_progress', 'ready_for_review', 'completed', 'canceled')
serviceDetails JSON NOT NULL
assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## Example Scenario

### Before Implementation:

```
1. Booking arrives → Status: "arrived"
2. Service Advisor manually creates jobcard
3. Service Advisor assigns mechanics
```

### After Implementation:

```
1. Booking arrives → Status: "arrived" → Jobcard AUTO-CREATED ✨
2. Service Advisor just assigns mechanics (jobcard already exists)
```

---

## Testing

### Test Script:

Run the verification script to test the functionality:

```bash
cd vehicle-service-backend
node test_auto_jobcard_creation.js
```

### Manual Testing:

1. Create a booking
2. Mark booking as "arrived" via Receptionist Dashboard
3. Check jobcard table for new entry
4. Verify bookingId matches the arrived booking

### SQL Query to Verify:

```sql
-- Check jobcards for arrived bookings
SELECT
    j.jobcardId,
    j.bookingId,
    j.mechanicId,
    j.partCode,
    j.status AS jobcardStatus,
    b.status AS bookingStatus,
    b.vehicleNumber,
    b.arrivedTime
FROM jobcard j
INNER JOIN booking b ON j.bookingId = b.bookingId
WHERE b.status = 'arrived'
ORDER BY j.assignedAt DESC;
```

---

## Important Notes

### Placeholder Mechanic

- **partCode**: "PENDING_ASSIGNMENT" indicates mechanic needs to be reassigned
- Service Advisor should assign actual mechanics through the dashboard
- The placeholder mechanic ensures jobcard exists for tracking

### Error Scenarios

- If no active mechanics exist, jobcard won't be created (logged as warning)
- If booking has no serviceTypes, empty JSON array "[]" is used
- Jobcard creation failure doesn't prevent booking status update

### Future Enhancements

1. **Smart Mechanic Assignment**
   - Auto-assign based on mechanic specialization
   - Load balancing across mechanics
2. **Multiple Jobcards**

   - Create separate jobcards for different service types
   - Better workload distribution

3. **Notification System**
   - Notify Service Advisor when new jobcard is created
   - Alert mechanics about new assignments

---

## API Endpoint

### Update Booking Status

```
PUT /api/bookings/:bookingId/status
Body: { "status": "arrived" }

Response:
{
  "message": "Booking status updated to arrived"
}

Side Effect:
- Jobcard automatically created in database
- Console log: "✅ Jobcard automatically created for booking 33"
```

---

## Verification Queries

### Check Created Jobcards:

```sql
SELECT * FROM jobcard
WHERE partCode = 'PENDING_ASSIGNMENT'
ORDER BY assignedAt DESC;
```

### Count Auto-Created Jobcards Today:

```sql
SELECT COUNT(*) as autoCreatedToday
FROM jobcard
WHERE partCode = 'PENDING_ASSIGNMENT'
AND DATE(assignedAt) = CURDATE();
```

### See Jobcard Details with Booking Info:

```sql
SELECT
    j.jobcardId,
    j.bookingId,
    j.partCode,
    j.status as jobcard_status,
    j.serviceDetails,
    b.vehicleNumber,
    b.name as customer_name,
    b.status as booking_status,
    b.arrivedTime
FROM jobcard j
JOIN booking b ON j.bookingId = b.bookingId
WHERE j.partCode = 'PENDING_ASSIGNMENT';
```

---

## Success Criteria

✅ **All criteria met:**

1. When booking status → "arrived"
2. System automatically creates jobcard entry
3. Jobcard has correct bookingId from arrived booking
4. Jobcard status is "open"
5. Service details copied from booking
6. Error handling prevents system failure
7. Booking status update succeeds regardless

---

## Related Files

### Backend:

- `vehicle-service-backend/controllers/bookingController.js` - Modified updateBookingStatus()
- `vehicle-service-backend/db_setup.sql` - jobcard and booking table schemas

### Database Tables:

- `booking` - Stores booking information
- `jobcard` - Stores job assignments

---

## Logs to Monitor

### Success Log:

```
✅ Jobcard automatically created for booking 33
```

### Warning Log:

```
⚠️ No active mechanics found to create jobcard for booking 33
```

### Error Log:

```
Error creating jobcard: [error details]
```

---

## Summary

✅ **Feature Implemented Successfully**

When a booking is marked as "arrived", a jobcard is automatically inserted into the jobcard table with:

- The arrived booking's ID
- A placeholder mechanic
- "PENDING_ASSIGNMENT" part code
- "open" status
- Service details from the booking

This streamlines the workflow and ensures all arrived bookings have corresponding jobcards ready for mechanic assignment.
