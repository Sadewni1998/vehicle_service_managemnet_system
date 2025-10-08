# Mechanic Information Display Implementation

## Overview

Enhanced the Service Advisor Dashboard to properly display mechanic information from the mechanic table when clicking the "Assign Mechanics" button in the assign jobs tab.

## Changes Made

### 1. Fixed Mechanic Data Display (ServiceAdvisorDashboard.jsx)

#### Added State Variables for Search/Filter

```javascript
const [mechanicSearchTerm, setMechanicSearchTerm] = useState("");
const [mechanicSpecializationFilter, setMechanicSpecializationFilter] =
  useState("");
```

#### Updated `openAssignMechanics` Function

- Reset search and filter states when opening the modal
- Ensures clean state for each mechanic assignment session

#### Enhanced Mechanic Information Display

The modal now displays comprehensive mechanic information:

- **Name**: `mechanicName` or `staffName` (from mechanic_details view)
- **Code**: `mechanicCode` (unique identifier like MEC001, MEC002)
- **Email**: `email` (from staff table)
- **Specialization**: `specialization` (e.g., Engine and Transmission, Electrical Systems)
- **Experience**: `experience` years
- **Hourly Rate**: `hourlyRate` (in LKR)
- **Availability Status**: Color-coded based on status:
  - Available: Green
  - Busy: Orange
  - On Break: Blue
  - Off Duty: Gray

#### Added Search and Filter Functionality

##### Search Input

- Search mechanics by name (mechanicName or staffName)
- Search by mechanic code (mechanicCode)
- Real-time filtering as user types

##### Specialization Filter

- Dropdown filter to select specific specializations:
  - All Specializations (default)
  - Engine and Transmission
  - Electrical Systems
  - Brake Systems
  - Suspension
  - Body Work
  - General Maintenance

##### Combined Filtering

- Both search and filter work together
- Shows "No mechanics match your search criteria" when filters result in no matches
- Shows "No available mechanics found" when no mechanics are available at all

## Data Source

### Database Tables

- **mechanic**: Base table containing mechanic-specific information
- **staff**: Contains staff member details (name, email, etc.)
- **mechanic_details**: View that joins mechanic and staff tables

### API Endpoint

- **GET /api/mechanics/available**: Returns all available mechanics from mechanic_details view

### Mechanic Data Structure

```javascript
{
  mechanicId: INT,
  staffId: INT,
  mechanicCode: STRING,      // e.g., "MEC001"
  mechanicName: STRING,      // Name from mechanic table
  staffName: STRING,         // Name from staff table
  email: STRING,
  specialization: STRING,    // e.g., "Engine and Transmission"
  experience: INT,           // Years of experience
  certifications: TEXT,      // JSON array of certifications
  availability: ENUM,        // Available, Busy, On Break, Off Duty
  hourlyRate: DECIMAL,       // Rate in LKR
  isActive: BOOLEAN,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

## User Workflow

1. **Navigate to Assign Jobs Tab**

   - Service Advisor opens the dashboard
   - Clicks on "Assign jobs" tab

2. **View Arrived Bookings**

   - System displays all arrived bookings
   - Each booking shows vehicle and customer information

3. **Click "Assign Mechanics" Button**

   - Modal opens showing all available mechanics
   - Each mechanic card displays comprehensive information

4. **Search and Filter (Optional)**

   - Use search box to find specific mechanics by name or code
   - Use specialization dropdown to filter by expertise
   - Both filters work together for refined results

5. **Select Mechanics**

   - Check the box next to desired mechanics
   - Multiple mechanics can be selected
   - Selected mechanics are highlighted

6. **Assign to Booking**
   - Click "Assign Selected Mechanics" button
   - System assigns mechanics to the booking
   - Updates are saved to the database

## Features

### Visual Enhancements

- Clean, card-based layout for mechanic information
- Color-coded availability status for quick identification
- Responsive design for different screen sizes
- Smooth scrolling for long lists of mechanics

### User Experience

- Real-time search and filtering
- Clear visual feedback for selected mechanics
- Empty state messages when no mechanics are available
- Informative error messages

### Data Integrity

- Fetches real-time data from mechanic_details view
- Displays only available mechanics (availability = "Available")
- Shows only active mechanics (isActive = true)
- Proper error handling if API fails

## Technical Implementation

### Component: ServiceAdvisorDashboard.jsx

- Location: `src/pages/ServiceAdvisorDashboard.jsx`
- Framework: React with Hooks
- UI Library: Tailwind CSS
- Icons: Lucide React

### State Management

- Uses React useState for local state
- Fetches data via mechanicsAPI utility
- Updates state based on user interactions

### API Integration

- Uses axios for HTTP requests
- Endpoint: `/api/mechanics/available`
- Error handling with try-catch blocks
- Fallback to empty array on error

## Testing Recommendations

1. **Verify Data Display**

   - Check if all mechanic fields are displayed correctly
   - Verify color coding for different availability statuses

2. **Test Search Functionality**

   - Search by mechanic name
   - Search by mechanic code
   - Test with partial matches
   - Test with no matches

3. **Test Filter Functionality**

   - Filter by each specialization
   - Combine search with filter
   - Clear filters and search

4. **Test Selection**

   - Select single mechanic
   - Select multiple mechanics
   - Deselect mechanics
   - Assign to booking

5. **Test Edge Cases**
   - No mechanics available
   - All mechanics busy
   - API failure scenario
   - Network timeout

## Future Enhancements

1. **Additional Filters**

   - Filter by availability status
   - Filter by experience level
   - Filter by hourly rate range

2. **Sorting Options**

   - Sort by name
   - Sort by experience
   - Sort by hourly rate
   - Sort by availability

3. **Mechanic Details View**

   - Click on mechanic card for detailed view
   - Show certifications in detail
   - Show work history
   - Show ratings/reviews

4. **Bulk Actions**

   - Select all available mechanics
   - Clear all selections
   - Assign same mechanics to multiple bookings

5. **Real-time Updates**
   - WebSocket integration for live availability updates
   - Notifications when mechanic status changes

## Related Files

- Frontend: `src/pages/ServiceAdvisorDashboard.jsx`
- API Utils: `src/utils/api.js`
- Backend Routes: `vehicle-service-backend/routes/mechanicRoutes.js`
- Database Schema: `vehicle-service-backend/db_setup.sql`

## Database Schema Reference

### mechanic_details View

```sql
CREATE OR REPLACE VIEW mechanic_details AS
SELECT
    m.mechanicId,
    m.staffId,
    m.mechanicCode,
    m.mechanicName,
    s.name as staffName,
    s.email,
    m.specialization,
    m.experienceYears as experience,
    m.certifications,
    m.availability,
    m.hourlyRate,
    m.isActive,
    m.createdAt,
    m.updatedAt
FROM mechanic m
INNER JOIN staff s ON m.staffId = s.staffId
WHERE m.isActive = true;
```

## Conclusion

The mechanic information display functionality is now fully implemented in the Service Advisor Dashboard. The system properly fetches and displays comprehensive mechanic information from the database, with search and filter capabilities for easy mechanic selection during job assignment.
