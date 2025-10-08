# Troubleshooting: Mechanic Details View Issue

## Date: October 8, 2025

## Problem Identified

### Error Message

```
code: 'ER_NO_SUCH_TABLE',
errno: 1146,
sql: 'SELECT * FROM mechanic_details WHERE isActive = true ORDER BY mechanicCode ASC LIMIT ? OFFSET ?',
sqlState: '42S02',
sqlMessage: "Table 'vehicle_service_db.mechanic_details' doesn't exist"
```

## Root Cause

The `mechanic_details` view was not created in the database, even though it was defined in the `db_setup.sql` file.

## Additional Issue Discovered

The `mechanic` table structure in the database **does NOT match** the schema in `db_setup.sql`:

### Schema File (Incorrect)

```sql
CREATE TABLE mechanic (
    mechanicId INT,
    staffId INT,
    mechanicName VARCHAR(50) NOT NULL,  ❌ This column doesn't exist
    mechanicCode VARCHAR(20),
    ...
);
```

### Actual Database Table (Correct)

```sql
CREATE TABLE mechanic (
    mechanicId INT,
    staffId INT,
    mechanicCode VARCHAR(20),  ✅ No mechanicName column
    specialization VARCHAR(255),
    experienceYears INT,
    ...
);
```

**The `mechanicName` field does NOT exist in the actual `mechanic` table!**  
The name comes from the `staff` table via the JOIN.

## Solution Implemented

### 1. Created the Missing View

Created `create_mechanic_details_view.js` script to establish the view:

```sql
CREATE OR REPLACE VIEW mechanic_details AS
SELECT
    m.mechanicId,
    m.staffId,
    m.mechanicCode,
    s.name as mechanicName,     -- Get name from staff table
    s.name as staffName,         -- Also as staffName for compatibility
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

### 2. Fixed Schema Documentation

Updated `db_setup.sql` to match the actual database structure:

**Removed:**

- `mechanicName VARCHAR(50) NOT NULL` from mechanic table

**Updated View:**

- Changed `m.mechanicName` to `s.name as mechanicName`

**Added Comment:**

```sql
-- mechanicName is obtained from staff.name via the mechanic_details view
```

### 3. Verified Table Structure

Created `check_mechanic_table.js` to inspect actual table columns:

**Actual Mechanic Table Columns:**

- ✅ mechanicId
- ✅ staffId
- ✅ mechanicCode
- ✅ specialization
- ✅ experienceYears
- ✅ certifications
- ✅ availability
- ✅ hourlyRate
- ✅ isActive
- ✅ createdAt
- ✅ updatedAt
- ❌ mechanicName (doesn't exist - comes from staff table)

## Files Created/Modified

### Created Files

1. **`vehicle-service-backend/create_mechanic_details_view.js`**

   - Script to create the mechanic_details view
   - Includes testing and verification
   - Can be run manually: `node create_mechanic_details_view.js`

2. **`vehicle-service-backend/check_mechanic_table.js`**
   - Diagnostic script to check table structure
   - Shows actual columns and sample data
   - Useful for future troubleshooting

### Modified Files

1. **`vehicle-service-backend/db_setup.sql`**
   - Removed `mechanicName` column from mechanic table definition
   - Updated mechanic_details view to use `s.name as mechanicName`
   - Updated INSERT statements to exclude mechanicName
   - Added clarifying comment

## Execution Results

### View Creation - SUCCESS ✅

```
Connected to database
Dropping existing view if it exists...
Creating mechanic_details view...
✅ mechanic_details view created successfully!

Testing the view...
Found 3 mechanics in the view:
  - Mechanic (MEC-001) - Available
  - Mechanic (MEC001) - Available
  - Mechanic (MEC002) - Available

✅ All done! View is ready to use.
```

## Current Database State

### Mechanics in System

The system currently has 3 mechanics:

1. **Mechanic** (MEC-001)

   - Specialization: Engine Diagnostics, Fuel Systems
   - Experience: 10 years
   - Certifications: ASE Master Technician, Bosch Certified
   - Hourly Rate: LKR 75.50
   - Status: Available

2. **Mechanic** (MEC001)

   - Specialization: Engine and Transmission
   - Experience: 5 years
   - Certifications: ["ASE Certified","Engine Specialist"]
   - Hourly Rate: LKR 2,500.00
   - Status: Available

3. **Mechanic** (MEC002)
   - Specialization: Electrical Systems
   - Experience: 3 years
   - Certifications: ["Auto Electrician","Hybrid Systems"]
   - Hourly Rate: LKR 2,200.00
   - Status: Available

## How the View Works

### Data Flow

```
mechanic table           staff table
┌─────────────┐         ┌──────────────┐
│ mechanicId  │◄────┐   │ staffId      │
│ staffId     │─────┼───┤ name         │
│ mechanicCode│     │   │ email        │
│ ...         │     │   │ ...          │
└─────────────┘     │   └──────────────┘
                    │
                    │   JOIN
                    │
                    ▼
            ┌────────────────────┐
            │ mechanic_details   │
            │ (VIEW)             │
            ├────────────────────┤
            │ mechanicId         │
            │ staffId            │
            │ mechanicCode       │
            │ mechanicName ◄─────┼─── from staff.name
            │ staffName    ◄─────┼─── from staff.name
            │ email        ◄─────┼─── from staff.email
            │ specialization     │
            │ experience         │
            │ certifications     │
            │ availability       │
            │ hourlyRate         │
            │ isActive           │
            │ createdAt          │
            │ updatedAt          │
            └────────────────────┘
```

### Key Points

1. **mechanicName** comes from `staff.name` via JOIN
2. Both **mechanicName** and **staffName** reference the same field for compatibility
3. **email** comes from `staff.email`
4. All other fields come directly from the `mechanic` table

## Testing & Verification

### Test API Endpoint

```bash
GET http://localhost:5000/api/mechanics?limit=100
```

### Expected Response

```json
{
  "success": true,
  "data": [
    {
      "mechanicId": 17,
      "staffId": 4,
      "mechanicCode": "MEC-001",
      "mechanicName": "Mechanic",
      "staffName": "Mechanic",
      "email": "mechanic@example.com",
      "specialization": "Engine Diagnostics, Fuel Systems",
      "experience": 10,
      "certifications": "ASE Master Technician, Bosch Certified",
      "availability": "Available",
      "hourlyRate": "75.50",
      "isActive": 1,
      "createdAt": "2025-10-07T17:34:32.000Z",
      "updatedAt": "2025-10-07T17:34:32.000Z"
    }
  ]
}
```

## Frontend Compatibility

The frontend code in `ServiceAdvisorDashboard.jsx` is now compatible because:

1. **mechanicName** is available from the view (pulled from staff.name)
2. **staffName** is also available as a fallback
3. All required fields are present in the view
4. The display code handles both field name variations:
   ```jsx
   {
     mechanic.mechanicName || mechanic.staffName;
   }
   ```

## Prevention for Future

### Best Practices

1. **Always run db_setup.sql** after major schema changes
2. **Verify views exist** before deploying frontend changes
3. **Keep schema file synchronized** with actual database
4. **Use diagnostic scripts** to check table structure
5. **Document joins and derived fields** clearly

### Diagnostic Commands

**Check if view exists:**

```sql
SHOW FULL TABLES WHERE Table_type = 'VIEW';
```

**Describe view structure:**

```sql
DESCRIBE mechanic_details;
```

**Check mechanic table structure:**

```sql
DESCRIBE mechanic;
```

**Test view with sample query:**

```sql
SELECT * FROM mechanic_details LIMIT 5;
```

## Scripts for Future Use

### Create View

```bash
cd vehicle-service-backend
node create_mechanic_details_view.js
```

### Check Table Structure

```bash
cd vehicle-service-backend
node check_mechanic_table.js
```

## Resolution Status

✅ **RESOLVED**

- View `mechanic_details` created successfully
- Schema documentation updated to match reality
- Frontend can now fetch mechanic data
- All mechanics are visible in the system
- No more "table doesn't exist" errors

## Additional Notes

### Why No mechanicName Column?

The database design intentionally **doesn't duplicate** the name in the `mechanic` table because:

1. **Normalization**: Name is already in the `staff` table
2. **Data Integrity**: Single source of truth for names
3. **Consistency**: Name changes in staff table automatically reflect everywhere
4. **Storage Efficiency**: No duplicate data

### View Benefits

Using a view provides:

1. **Abstraction**: Hides the complexity of the JOIN
2. **Simplicity**: API code can query one "table"
3. **Flexibility**: Can add computed fields easily
4. **Performance**: MySQL can optimize view queries
5. **Maintainability**: Changes to JOIN logic in one place

## Conclusion

The issue was caused by a missing database view that the API was trying to query. The view was defined in the SQL schema file but never actually created in the database. Additionally, the schema file incorrectly documented a `mechanicName` column that doesn't exist in the actual table.

Both issues have been resolved:

1. ✅ View created and tested
2. ✅ Schema documentation corrected
3. ✅ Diagnostic scripts created for future use
4. ✅ System is now fully operational

The Service Advisor Dashboard can now successfully display all mechanic information!
