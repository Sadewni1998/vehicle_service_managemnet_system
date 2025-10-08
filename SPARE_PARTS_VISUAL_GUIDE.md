# 🎯 VISUAL GUIDE: Spare Parts Assignment Flow

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVICE ADVISOR DASHBOARD                         │
│                          (ServiceAdvisorDashboard.jsx)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User clicks "Assign Spare-parts"
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           ASSIGN SPARE PARTS MODAL                       │
│                                                                          │
│  Available Spare Parts:                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ☐ ENG001 - Engine Oil Filter    Rs. 2,500   [Qty: __]           │  │
│  │ ☐ BRK002 - Brake Pads            Rs. 5,600   [Qty: __]           │  │
│  │ ☐ ELC003 - Car Battery           Rs. 18,000  [Qty: __]           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Selected: 3 parts, Total Qty: 4                                        │
│                                                                          │
│             [ Cancel ]  [ Assign Selected Parts ]  ← CLICK HERE          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Frontend sends API request
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    API: PUT /api/bookings/:id/assign-spare-parts        │
│                       (bookingController.js)                             │
│                                                                          │
│  Request Body:                                                          │
│  {                                                                       │
│    "spareParts": [                                                      │
│      {"partId": 43, "quantity": 2},                                     │
│      {"partId": 44, "quantity": 1},                                     │
│      {"partId": 45, "quantity": 1}                                      │
│    ]                                                                     │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│   VALIDATE SPARE PARTS          │   │   CHECK STOCK AVAILABILITY      │
│                                 │   │                                 │
│  ✓ Parts exist in database      │   │  ✓ Part 43: Need 2, Have 17   │
│  ✓ Parts are active             │   │  ✓ Part 44: Need 1, Have 18   │
│  ✓ Get unit prices              │   │  ✓ Part 45: Need 1, Have 18   │
└─────────────────────────────────┘   └─────────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     FIND OR CREATE JOBCARD                               │
│                                                                          │
│  SELECT jobcardId FROM jobcard WHERE bookingId = 33                     │
│  ✓ Jobcard #1 found (auto-created when booking arrived)                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│               CLEAR EXISTING SPARE PART ASSIGNMENTS                      │
│                                                                          │
│  DELETE FROM jobcardSparePart WHERE jobcardId = 1                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│          ✨ STORE ALL SPARE PARTS IN jobcardSparePart TABLE ✨          │
│                                                                          │
│  For Part 43 (Engine Oil Filter):                                       │
│    unitPrice = 2500.00                                                  │
│    quantity = 2                                                         │
│    totalPrice = 2500.00 × 2 = 5000.00                                   │
│    INSERT INTO jobcardSparePart                                         │
│      (jobcardId, partId, quantity, unitPrice, totalPrice)               │
│    VALUES (1, 43, 2, 2500.00, 5000.00)                                  │
│    ✅ Stored!                                                           │
│                                                                          │
│  For Part 44 (Brake Pads):                                              │
│    unitPrice = 5600.00                                                  │
│    quantity = 1                                                         │
│    totalPrice = 5600.00 × 1 = 5600.00                                   │
│    INSERT INTO jobcardSparePart                                         │
│      (jobcardId, partId, quantity, unitPrice, totalPrice)               │
│    VALUES (1, 44, 1, 5600.00, 5600.00)                                  │
│    ✅ Stored!                                                           │
│                                                                          │
│  For Part 45 (Car Battery):                                             │
│    unitPrice = 18000.00                                                 │
│    quantity = 1                                                         │
│    totalPrice = 18000.00 × 1 = 18000.00                                 │
│    INSERT INTO jobcardSparePart                                         │
│      (jobcardId, partId, quantity, unitPrice, totalPrice)               │
│    VALUES (1, 45, 1, 18000.00, 18000.00)                                │
│    ✅ Stored!                                                           │
│                                                                          │
│  Total Spare Parts Cost: Rs. 28,600.00                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│   UPDATE BOOKING TABLE          │   │   UPDATE STOCK QUANTITIES       │
│                                 │   │                                 │
│  UPDATE booking                 │   │  UPDATE spareparts              │
│  SET assignedSpareParts =       │   │  SET stockQuantity =            │
│    '[{...}, {...}, {...}]'      │   │    stockQuantity - 2            │
│  WHERE bookingId = 33           │   │  WHERE partId = 43              │
│                                 │   │                                 │
│  ✅ Updated!                    │   │  ✅ Part 43: 17 → 15           │
│                                 │   │  ✅ Part 44: 18 → 17           │
│                                 │   │  ✅ Part 45: 18 → 17           │
└─────────────────────────────────┘   └─────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         RETURN SUCCESS RESPONSE                          │
│                                                                          │
│  {                                                                       │
│    "message": "Spare parts assigned successfully...",                   │
│    "assignedSpareParts": [...],                                         │
│    "bookingId": 33,                                                     │
│    "jobcardId": 1,                                                      │
│    "totalCost": 28600.00  ← Total spare parts cost                     │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Frontend receives response
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    UPDATE UI & SHOW SUCCESS MESSAGE                      │
│                                                                          │
│  ✅ "Spare parts assigned successfully!"                                │
│                                                                          │
│  Booking updated in local state                                         │
│  Modal closed                                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database State After Assignment

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            BOOKING TABLE                                 │
├────────┬──────────────┬──────────┬────────────────────────────────────┤
│   ID   │ Vehicle      │  Status  │  assignedSpareParts (JSON)         │
├────────┼──────────────┼──────────┼────────────────────────────────────┤
│   33   │  TG-0067     │  arrived │  [{partId:43,qty:2},               │
│        │              │          │   {partId:44,qty:1},               │
│        │              │          │   {partId:45,qty:1}]               │
└────────┴──────────────┴──────────┴────────────────────────────────────┘
                                    │
                                    │ Links to ↓
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                            JOBCARD TABLE                                 │
├────────┬────────────┬──────────┬────────────┬───────────────────────────┤
│   ID   │ bookingId  │ mechanic │  partCode  │  status                   │
├────────┼────────────┼──────────┼────────────┼───────────────────────────┤
│   1    │     33     │    17    │  ASSIGNED  │  in_progress              │
└────────┴────────────┴──────────┴────────────┴───────────────────────────┘
         │
         │ Has mechanics ↓                     Has spare parts ↓
         │
         ├─────────────────────────┬─────────────────────────────────────┐
         ↓                         ↓                                     ↓
┌──────────────────────┐  ┌──────────────────────────────────────────────┐
│ jobcardMechanic      │  │      jobcardSparePart (NEW TABLE!)           │
├────┬──────┬──────────┤  ├────┬──────┬──────┬────┬──────┬──────────────┤
│ ID │ JC   │ Mechanic │  │ ID │  JC  │ Part │Qty │ Unit │    Total     │
├────┼──────┼──────────┤  ├────┼──────┼──────┼────┼──────┼──────────────┤
│  1 │  1   │    17    │  │  1 │  1   │  43  │ 2  │ 2500 │   5,000.00   │
│  2 │  1   │    18    │  │  2 │  1   │  44  │ 1  │ 5600 │   5,600.00   │
│  3 │  1   │    19    │  │  3 │  1   │  45  │ 1  │18000 │  18,000.00   │
└────┴──────┴──────────┘  └────┴──────┴──────┴────┴──────┴──────────────┘

                          Total: Rs. 28,600.00 ✅
```

---

## 🔍 Query Examples

### Get All Spare Parts for a Jobcard:

```sql
SELECT
    jsp.partId,
    sp.partCode,
    sp.partName,
    jsp.quantity,
    jsp.unitPrice,
    jsp.totalPrice
FROM jobcardSparePart jsp
JOIN spareparts sp ON jsp.partId = sp.partId
WHERE jsp.jobcardId = 1;
```

**Result:**

```
partId | partCode | partName          | quantity | unitPrice | totalPrice
-------|----------|-------------------|----------|-----------|------------
  43   | ENG001   | Engine Oil Filter |    2     | 2,500.00  |  5,000.00
  44   | BRK002   | Brake Pads        |    1     | 5,600.00  |  5,600.00
  45   | ELC003   | Car Battery       |    1     | 18,000.00 | 18,000.00
```

### Get Total Cost for a Jobcard:

```sql
SELECT
    jobcardId,
    SUM(totalPrice) as totalPartsCost,
    COUNT(*) as numberOfParts,
    SUM(quantity) as totalQuantity
FROM jobcardSparePart
WHERE jobcardId = 1
GROUP BY jobcardId;
```

**Result:**

```
jobcardId | totalPartsCost | numberOfParts | totalQuantity
----------|----------------|---------------|---------------
    1     |   28,600.00    |       3       |       4
```

---

## 📋 Verification Checklist

After assignment, you should see:

- [x] **jobcardSparePart table:** 3 new rows
- [x] **Each row has:** jobcardId, partId, quantity, prices, timestamp
- [x] **Total calculated:** Rs. 28,600.00
- [x] **Stock reduced:**
  - Part 43: 17 → 15 (reduced by 2)
  - Part 44: 18 → 17 (reduced by 1)
  - Part 45: 18 → 17 (reduced by 1)
- [x] **Booking updated:** assignedSpareParts JSON populated
- [x] **API returns:** Success message with totalCost

---

## 🎯 Key Points

1. **One Spare Part = One Row** in jobcardSparePart table
2. **Prices Locked** at assignment time (unit price preserved)
3. **Total Auto-Calculated** (quantity × unit price)
4. **Stock Auto-Deducted** from spareparts table
5. **Linked to Jobcard** via foreign key
6. **Timestamps Recorded** for audit trail
7. **Query-Friendly** for reporting and analysis

---

## 🚀 Ready to Use!

The system is now complete and functional. When you click "Assign Selected Parts", all spare part IDs with their quantities and prices will be automatically stored in the database!

---

**Visual Guide Created:** October 8, 2025  
**Status:** ✅ COMPLETE
