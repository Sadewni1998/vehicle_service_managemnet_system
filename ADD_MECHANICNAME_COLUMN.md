# Solution: Add mechanicName Column to Mechanic Table

## Problem

Currently, the mechanic table doesn't have a `mechanicName` column. The name is pulled from the staff table via JOIN, which means:

- You cannot change a mechanic's name independently
- Changing the staff name affects the mechanic name
- No flexibility for different display names

## Solution: Add mechanicName Column

### Step 1: Add Column to Mechanic Table

```sql
ALTER TABLE mechanic
ADD COLUMN mechanicName VARCHAR(50) AFTER staffId;
```

### Step 2: Populate with Existing Names

```sql
UPDATE mechanic m
INNER JOIN staff s ON m.staffId = s.staffId
SET m.mechanicName = s.name;
```

### Step 3: Make it NOT NULL (Optional)

```sql
ALTER TABLE mechanic
MODIFY COLUMN mechanicName VARCHAR(50) NOT NULL;
```

### Step 4: Update the View

```sql
CREATE OR REPLACE VIEW mechanic_details AS
SELECT
    m.mechanicId,
    m.staffId,
    m.mechanicCode,
    m.mechanicName,              -- Now from mechanic table directly
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

## Implementation Script

Run this script to add the mechanicName column:

```bash
cd vehicle-service-backend
node add_mechanicname_column.js
```

## Benefits

✅ **Independent Names** - Mechanic can have different name than staff record
✅ **Direct Updates** - Can change mechanic name without affecting staff
✅ **Flexibility** - Display names vs. official names
✅ **Clearer Data Model** - Mechanic data in mechanic table

## After This Change

### To Change Mechanic Name

```sql
UPDATE mechanic
SET mechanicName = 'New Name'
WHERE mechanicId = ?;
```

### Database Structure

```
mechanic table
┌──────────────────┐
│ mechanicId       │
│ staffId          │
│ mechanicName  ✅ │ ← NEW: Direct name column
│ mechanicCode     │
│ ...              │
└──────────────────┘
```
