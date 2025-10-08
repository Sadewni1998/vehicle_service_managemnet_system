# Complete Mechanic Table Details Display

## Date: October 8, 2025

## Overview

Enhanced the Assign Mechanics interface in the Service Advisor Dashboard to display ALL fields from the mechanic table and mechanic_details view, providing complete visibility of mechanic information.

## Complete Mechanic Table Schema

### Base Mechanic Table Fields

```sql
CREATE TABLE mechanic (
    mechanicId INT AUTO_INCREMENT PRIMARY KEY,
    staffId INT NOT NULL,
    mechanicName VARCHAR(50) NOT NULL,
    mechanicCode VARCHAR(20) NOT NULL UNIQUE,
    specialization VARCHAR(255),
    experienceYears INT DEFAULT 0,
    certifications TEXT, -- JSON array
    availability ENUM('Available', 'Busy', 'On Break', 'Off Duty'),
    hourlyRate DECIMAL(8, 2),
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,
    FOREIGN KEY (staffId) REFERENCES staff(staffId)
);
```

### Mechanic_Details View (Joined with Staff)

```sql
CREATE VIEW mechanic_details AS
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

## All Fields Now Displayed in Interface

### Header Section

| Field                  | Display Label                | Format                | Source                              |
| ---------------------- | ---------------------------- | --------------------- | ----------------------------------- |
| mechanicName/staffName | (Name displayed prominently) | Bold, large text      | mechanic.mechanicName or staff.name |
| mechanicId             | ID: {value}                  | Small text, top-right | mechanic.mechanicId                 |

### Details Section

| Field           | Display Label             | Format           | Source                         |
| --------------- | ------------------------- | ---------------- | ------------------------------ |
| mechanicCode    | Code: {value}             | Regular text     | mechanic.mechanicCode          |
| email           | Email: {value}            | Regular text     | staff.email                    |
| staffId         | Staff ID: {value}         | Regular text     | mechanic.staffId               |
| specialization  | Specialization: {value}   | Regular text     | mechanic.specialization        |
| experienceYears | Experience: {value} years | Regular text     | mechanic.experienceYears       |
| certifications  | Certifications:           | Badge pills      | mechanic.certifications (JSON) |
| hourlyRate      | Hourly Rate: LKR {value}  | Formatted number | mechanic.hourlyRate            |
| availability    | Status: {value}           | Color-coded text | mechanic.availability          |

### Fields NOT Displayed (Internal Use Only)

- ❌ `isActive` - Used for filtering only (always true for displayed records)
- ❌ `createdAt` - Timestamp not relevant for assignment
- ❌ `updatedAt` - Timestamp not relevant for assignment

## Enhanced Display Features

### 1. Mechanic ID Display

**Added**: Top-right corner of each mechanic card

```jsx
<div className="text-xs text-gray-500">ID: {mechanic.mechanicId}</div>
```

- Small, non-intrusive display
- Useful for tracking and reference
- Placed in card header

### 2. Staff ID Display

**Added**: In details section

```jsx
<div className="text-sm text-gray-600">
  <span className="font-medium">Staff ID:</span> {mechanic.staffId}
</div>
```

- Shows the linked staff record
- Useful for administrative purposes
- Links mechanic to staff table

### 3. Certifications Display (NEW)

**Added**: Dynamic certification badges

```jsx
{
  mechanic.certifications && (
    <div className="text-sm text-gray-600">
      <span className="font-medium">Certifications:</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {/* Certification badges */}
      </div>
    </div>
  );
}
```

**Features:**

- Parses JSON certification data
- Displays as blue badge pills
- Multiple certifications shown inline
- Handles missing/invalid data gracefully
- Shows "None" if no certifications

**Example Certifications:**

- ASE Certified
- Engine Specialist
- Auto Electrician
- Hybrid Systems

### 4. Enhanced Label Formatting

**Updated**: All field labels are now bold

```jsx
<span className="font-medium">Field Name:</span> {value}
```

- Clearer visual hierarchy
- Easier to scan information
- Professional appearance

### 5. Formatted Hourly Rate

**Updated**: Number formatting with locale

```jsx
Hourly Rate: LKR {mechanic.hourlyRate?.toLocaleString() || 'N/A'}
```

- Adds comma separators (e.g., 2,500.00)
- Shows "N/A" if rate is missing
- Better readability for currency

## Complete Mechanic Card Layout

```
┌─────────────────────────────────────────────────────┐
│ ☐  Name of Mechanic                        ID: 123 │
│                                                      │
│    Code: MEC001                                     │
│    Email: mechanic@example.com                      │
│    Staff ID: 4                                      │
│    Specialization: Engine and Transmission          │
│    Experience: 5 years                              │
│    Certifications:                                  │
│    [ASE Certified] [Engine Specialist]              │
│    Hourly Rate: LKR 2,500.00                        │
│    Status: Available                                │
└─────────────────────────────────────────────────────┘
```

## Field-by-Field Details

### 1. Mechanic Name

- **Field**: `mechanicName` or `staffName`
- **Display**: Bold, large font
- **Location**: Top of card
- **Example**: "Sarah"

### 2. Mechanic ID

- **Field**: `mechanicId`
- **Display**: Small text, top-right
- **Location**: Card header
- **Example**: "ID: 1"
- **Purpose**: Unique identifier for database reference

### 3. Mechanic Code

- **Field**: `mechanicCode`
- **Display**: "Code: {value}"
- **Location**: First detail line
- **Example**: "Code: MEC001"
- **Purpose**: Human-readable unique code

### 4. Email

- **Field**: `email` (from staff table)
- **Display**: "Email: {value}"
- **Location**: Second detail line
- **Example**: "Email: sarah@example.com"
- **Purpose**: Contact information

### 5. Staff ID

- **Field**: `staffId`
- **Display**: "Staff ID: {value}"
- **Location**: Third detail line
- **Example**: "Staff ID: 4"
- **Purpose**: Links to staff table, administrative reference

### 6. Specialization

- **Field**: `specialization`
- **Display**: "Specialization: {value}"
- **Location**: Fourth detail line
- **Example**: "Specialization: Engine and Transmission"
- **Purpose**: Shows mechanic's area of expertise

### 7. Experience

- **Field**: `experienceYears`
- **Display**: "Experience: {value} years"
- **Location**: Fifth detail line
- **Example**: "Experience: 5 years"
- **Purpose**: Shows years of experience

### 8. Certifications (NEW)

- **Field**: `certifications` (TEXT/JSON)
- **Display**: Badge pills
- **Location**: Sixth detail line
- **Example**: [ASE Certified] [Engine Specialist]
- **Format**: Blue badges with rounded corners
- **Purpose**: Shows qualifications and credentials

**Technical Implementation:**

```jsx
{
  (() => {
    try {
      const certs =
        typeof mechanic.certifications === "string"
          ? JSON.parse(mechanic.certifications)
          : mechanic.certifications;
      return Array.isArray(certs) ? (
        certs.map((cert, idx) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {cert}
          </span>
        ))
      ) : (
        <span className="text-xs italic">None</span>
      );
    } catch (e) {
      return <span className="text-xs italic">None</span>;
    }
  })();
}
```

**Handles:**

- String JSON data
- Already parsed arrays
- Missing certifications
- Invalid JSON format

### 9. Hourly Rate

- **Field**: `hourlyRate`
- **Display**: "Hourly Rate: LKR {formatted value}"
- **Location**: Seventh detail line
- **Example**: "Hourly Rate: LKR 2,500.00"
- **Format**: Comma-separated for thousands
- **Purpose**: Shows mechanic's billing rate

### 10. Availability Status

- **Field**: `availability`
- **Display**: "Status: {value}"
- **Location**: Last detail line
- **Color-coded**:
  - 🟢 Green: Available
  - 🟠 Orange: Busy
  - 🔵 Blue: On Break
  - ⚫ Gray: Off Duty
- **Purpose**: Shows current work status

## Sample Data Display

### Example 1: Full Information

```
┌─────────────────────────────────────────────────────┐
│ ☐  Sarah                                    ID: 1   │
│                                                      │
│    Code: MEC001                                     │
│    Email: sarah@example.com                         │
│    Staff ID: 4                                      │
│    Specialization: Engine and Transmission          │
│    Experience: 5 years                              │
│    Certifications:                                  │
│    [ASE Certified] [Engine Specialist]              │
│    Hourly Rate: LKR 2,500.00                        │
│    Status: Available                                │
└─────────────────────────────────────────────────────┘
```

### Example 2: With Multiple Certifications

```
┌─────────────────────────────────────────────────────┐
│ ☐  John                                     ID: 2   │
│                                                      │
│    Code: MEC002                                     │
│    Email: john@example.com                          │
│    Staff ID: 4                                      │
│    Specialization: Electrical Systems               │
│    Experience: 3 years                              │
│    Certifications:                                  │
│    [Auto Electrician] [Hybrid Systems]              │
│    Hourly Rate: LKR 2,200.00                        │
│    Status: Busy                                     │
└─────────────────────────────────────────────────────┘
```

## Visual Enhancements

### 1. Typography Hierarchy

- **Name**: Bold, 16px (text-base)
- **ID**: Small, 12px (text-xs), gray
- **Labels**: Medium weight (font-medium)
- **Values**: Regular weight
- **Status**: Medium weight with color

### 2. Color Coding

- **Available**: `text-green-600` (#059669)
- **Busy**: `text-orange-600` (#ea580c)
- **On Break**: `text-blue-600` (#2563eb)
- **Off Duty**: `text-gray-600` (#4b5563)
- **Certification Badges**: Blue 100/800 scheme

### 3. Spacing and Layout

- Consistent spacing between fields
- Badge pills wrap to new line if needed
- Card padding: 16px (p-4)
- Gap between badges: 4px (gap-1)

## Data Flow

### 1. API Request

```javascript
const response = await mechanicsAPI.getAllMechanics({ limit: 100 });
```

### 2. Data Structure Received

```javascript
{
  success: true,
  data: [
    {
      mechanicId: 1,
      staffId: 4,
      mechanicCode: "MEC001",
      mechanicName: "Sarah",
      staffName: "Sarah Johnson",
      email: "sarah@example.com",
      specialization: "Engine and Transmission",
      experience: 5,
      certifications: '["ASE Certified","Engine Specialist"]',
      availability: "Available",
      hourlyRate: 2500.00,
      isActive: true,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-10-08T00:00:00.000Z"
    }
  ]
}
```

### 3. Display Processing

- Name: Uses mechanicName, falls back to staffName
- Certifications: Parses JSON string to array
- Hourly Rate: Formats with toLocaleString()
- Availability: Maps to color classes

## Benefits of Complete Display

### 1. Full Transparency ✅

- All relevant mechanic data visible
- No hidden information
- Complete decision-making context

### 2. Professional Credentials ✅

- Certifications prominently displayed
- Easy to verify qualifications
- Helps match mechanics to jobs

### 3. Administrative Reference ✅

- IDs visible for record-keeping
- Staff linkage clear
- Billing rates transparent

### 4. Better Matching ✅

- Can see specialization
- Can see certifications
- Can see experience level
- Can see availability

### 5. Improved UX ✅

- Clear visual hierarchy
- Color-coded status
- Formatted numbers
- Badge-style certifications

## Error Handling

### Certifications Field

```javascript
try {
  const certs =
    typeof mechanic.certifications === "string"
      ? JSON.parse(mechanic.certifications)
      : mechanic.certifications;
  // Display logic
} catch (e) {
  return <span className="text-xs italic">None</span>;
}
```

**Handles:**

- Invalid JSON
- Null values
- Empty strings
- Non-array data
- Missing field

### Hourly Rate

```javascript
LKR {mechanic.hourlyRate?.toLocaleString() || 'N/A'}
```

**Handles:**

- Null/undefined values
- Zero values
- Missing field
- Shows "N/A" as fallback

## Comparison: Before vs After

### Before

```
Name
Code: MEC001
Email: sarah@example.com
Specialization: Engine and Transmission
Experience: 5 years
Hourly Rate: LKR 2500
Status: Available
```

### After

```
Name                                    ID: 1
Code: MEC001
Email: sarah@example.com
Staff ID: 4
Specialization: Engine and Transmission
Experience: 5 years
Certifications:
[ASE Certified] [Engine Specialist]
Hourly Rate: LKR 2,500.00
Status: Available
```

**Added:**

- ✅ Mechanic ID
- ✅ Staff ID
- ✅ Certifications with badges
- ✅ Formatted hourly rate
- ✅ Bold field labels
- ✅ Better visual hierarchy

## Testing Checklist

- ✅ Mechanic ID displays correctly
- ✅ Staff ID displays correctly
- ✅ Certifications parse from JSON
- ✅ Multiple certifications display as badges
- ✅ Missing certifications show "None"
- ✅ Invalid JSON doesn't crash
- ✅ Hourly rate formats with commas
- ✅ Missing rate shows "N/A"
- ✅ All labels are bold
- ✅ Color coding works for all statuses
- ✅ Layout doesn't break with long text
- ✅ Badges wrap properly

## Database Query

The data comes from this view:

```sql
SELECT * FROM mechanic_details
WHERE isActive = true
ORDER BY mechanicCode ASC
LIMIT 100
```

This ensures:

- Only active mechanics shown
- Includes staff table data (email, staffName)
- Sorted by mechanic code
- Reasonable limit for performance

## API Endpoint

**Endpoint**: `GET /api/mechanics?limit=100`

**Response includes all fields:**

- mechanicId ✅
- staffId ✅
- mechanicCode ✅
- mechanicName ✅
- staffName ✅
- email ✅
- specialization ✅
- experience ✅
- certifications ✅
- availability ✅
- hourlyRate ✅
- isActive ✅
- createdAt ✅
- updatedAt ✅

## Conclusion

The Assign Mechanics interface now displays **complete information** from the mechanic table and mechanic_details view. Service advisors can see:

✅ All identification fields (ID, Code, Staff ID)  
✅ All contact information (Name, Email)  
✅ All skill information (Specialization, Experience, Certifications)  
✅ All availability information (Status with color coding)  
✅ All billing information (Hourly Rate, formatted)

The interface provides full transparency and all necessary information for informed mechanic assignment decisions.
