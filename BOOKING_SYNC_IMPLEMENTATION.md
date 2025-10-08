# Real-Time Booking Synchronization Between Dashboards

## Overview

This document describes the implementation of real-time booking synchronization between the Receptionist Dashboard and Management Dashboard, ensuring that updates made in the Receptionist Dashboard are automatically reflected in the Management Dashboard.

## Booking Flow

```
Customer Makes Booking
        ↓
Booking Saved to Database
        ↓
    ┌───────────────────┐
    │                   │
    ↓                   ↓
Receptionist        Management
Dashboard           Dashboard
    │                   │
    └─── Updates ───────┘
         Synced
```

## Implementation Details

### 1. Auto-Refresh Mechanism

**Polling Interval:** 10 seconds

The Management Dashboard automatically fetches the latest booking data from the database every 10 seconds when the bookings tab is active.

```javascript
// Set up auto-refresh every 10 seconds when on bookings tab
let refreshInterval;
if (activeTab === "bookings") {
  refreshInterval = setInterval(async () => {
    try {
      const response = await bookingsAPI.getAll();
      setBookings(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing bookings:", error);
    }
  }, 10000); // Refresh every 10 seconds
}
```

**Benefits:**

- Automatic updates without user intervention
- Detects changes made in Receptionist Dashboard
- Shows real-time status updates (arrived, cancelled, confirmed, etc.)
- Updates arrived time when receptionist marks vehicles as arrived

### 2. Manual Refresh Button

Added a manual refresh button for immediate updates:

**Features:**

- Blue button with refresh icon
- Animated spinning icon during loading
- Disabled state while refreshing
- Located in the header next to booking count

```javascript
const refreshBookings = async () => {
  setLoadingBookings(true);
  try {
    const response = await bookingsAPI.getAll();
    setBookings(response.data);
    setLastUpdated(new Date());
  } catch (error) {
    console.error("Error refreshing bookings:", error);
    setError("Failed to refresh bookings");
  } finally {
    setLoadingBookings(false);
  }
};
```

### 3. Last Updated Indicator

Displays when the booking data was last refreshed:

**Format:** "Last updated: HH:MM:SS AM/PM"

**Updates:**

- On initial load
- After auto-refresh
- After manual refresh

### 4. Tab Activation Refresh

Bookings are automatically refreshed whenever the user switches to the bookings tab:

```javascript
useEffect(() => {
  const loadBookings = async () => {
    if (activeTab === "bookings") {
      // Load bookings...
    }
  };
  loadBookings();
}, [activeTab]);
```

## How the Sync Works

### Scenario 1: Receptionist Marks Vehicle as Arrived

1. Receptionist clicks "Check In" button in Receptionist Dashboard
2. API call updates booking status to "arrived" in database
3. Management Dashboard auto-refreshes within 10 seconds
4. Table updates to show "arrived" status with green badge
5. Arrived time is displayed in the ARRIVED TIME column

### Scenario 2: Receptionist Cancels Booking

1. Receptionist cancels booking in Receptionist Dashboard
2. Status changed to "cancelled" in database
3. Management Dashboard picks up change on next refresh
4. Status badge changes to red "cancelled"

### Scenario 3: New Booking Created

1. Customer creates new booking
2. Booking saved to database
3. Management Dashboard auto-refresh detects new booking
4. New row appears in the bookings table
5. Total count updates automatically

## UI Features

### Header Section

```jsx
<div className="flex justify-between items-center mb-6">
  <div>
    <h3 className="text-xl font-bold text-gray-900">All Bookings</h3>
    <p className="text-sm text-gray-500 mt-1">
      Last updated: {lastUpdated.toLocaleTimeString()}
    </p>
  </div>
  <div className="flex items-center gap-4">
    <span className="text-sm text-gray-600">
      Total: {bookings.length} bookings
    </span>
    <button onClick={refreshBookings} disabled={loadingBookings}>
      <RefreshCw className={loadingBookings ? "animate-spin" : ""} />
      Refresh
    </button>
  </div>
</div>
```

### Visual Indicators

**Loading State:**

- Spinning refresh icon in button
- Disabled button during refresh
- No interruption to existing data display

**Last Updated Timestamp:**

- Gray text below title
- Shows exact time of last refresh
- Updates automatically

**Total Count:**

- Dynamic count of visible bookings
- Updates with each refresh

## Database Synchronization

### API Endpoint Used

**Endpoint:** `GET /api/bookings`

**Returns:** Array of all bookings with complete information including:

- bookingId
- timeSlot
- vehicleNumber
- name (customer)
- phone
- status
- arrivedTime
- All vehicle details
- Service information

### Data Consistency

**Guarantees:**

1. Both dashboards read from the same database
2. Updates in Receptionist Dashboard immediately persist to database
3. Management Dashboard fetches latest data every 10 seconds
4. No data caching issues - always fetches fresh data

## Configuration

### Adjustable Settings

**Refresh Interval:**

```javascript
// Change this value to adjust auto-refresh frequency
const REFRESH_INTERVAL = 10000; // milliseconds (currently 10 seconds)
```

**Recommended Values:**

- 5000 (5 seconds) - For high-traffic environments
- 10000 (10 seconds) - Current default, balanced
- 30000 (30 seconds) - For low-traffic environments

## Performance Considerations

### Optimizations Implemented:

1. **Conditional Polling:**

   - Only refreshes when bookings tab is active
   - Stops polling when user switches to other tabs
   - Prevents unnecessary API calls

2. **Cleanup on Unmount:**

   ```javascript
   return () => {
     if (refreshInterval) {
       clearInterval(refreshInterval);
     }
   };
   ```

3. **Error Handling:**

   - Failed refreshes don't disrupt user experience
   - Previous data remains visible during errors
   - Error logged to console for debugging

4. **Non-blocking Updates:**
   - Background refreshes don't interfere with user interactions
   - Table updates smoothly without page reload

## Testing the Sync

### Test Steps:

1. **Setup:**

   - Open Receptionist Dashboard in one browser tab
   - Open Management Dashboard in another tab
   - Navigate to Bookings tab in Management Dashboard

2. **Test Status Update:**

   - In Receptionist Dashboard, mark a booking as "arrived"
   - Wait up to 10 seconds
   - Verify status updates to green "arrived" badge in Management Dashboard
   - Verify arrived time appears

3. **Test Manual Refresh:**

   - Make a change in Receptionist Dashboard
   - Click "Refresh" button in Management Dashboard
   - Verify immediate update

4. **Test Auto-Refresh:**
   - Make multiple changes in Receptionist Dashboard
   - Observe Management Dashboard
   - Verify updates appear automatically every 10 seconds

## Future Enhancements

Potential improvements for even better synchronization:

1. **WebSocket Integration:**

   - Real-time push updates instead of polling
   - Instant synchronization
   - Lower server load

2. **Visual Notification:**

   - Toast notification when data updates
   - Highlight changed rows
   - Sound alert for new bookings

3. **Selective Refresh:**

   - Only update changed bookings
   - Reduce data transfer
   - Smoother user experience

4. **Conflict Resolution:**
   - Handle simultaneous edits
   - Show update indicators
   - Merge strategies

## Troubleshooting

### Issue: Bookings Not Updating

**Check:**

1. Verify bookings tab is active
2. Check browser console for errors
3. Verify API endpoint is working
4. Check network connectivity

**Solution:**

- Click manual refresh button
- Switch to another tab and back
- Check backend server is running

### Issue: Slow Updates

**Cause:** 10-second polling interval

**Solution:**

- Reduce REFRESH_INTERVAL value
- Use manual refresh for immediate updates
- Consider WebSocket implementation

## Summary

The Management Dashboard now provides real-time visibility into all bookings with:
✅ Automatic refresh every 10 seconds
✅ Manual refresh button for immediate updates
✅ Last updated timestamp
✅ Seamless synchronization with Receptionist Dashboard updates
✅ No page reload required
✅ Clean, professional UI with loading indicators

This ensures managers always have up-to-date information about all bookings, including status changes, arrival times, and new bookings created by customers or updated by receptionists.
