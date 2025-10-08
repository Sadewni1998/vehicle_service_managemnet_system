# 📊 VISUAL FLOW: Submit Job to Mechanic Dashboard

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     SERVICE ADVISOR DASHBOARD                             │
│                          (Assign Jobs Tab)                                │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                    Step 1: Click "Assign Mechanics"
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      ASSIGN MECHANICS MODAL                               │
│                                                                           │
│  ☑ Rana (MEC-001) - Engine Specialist                                   │
│  ☑ Veera (MEC-002) - Brake Expert                                       │
│  ☐ Heeri (MEC-003) - Electrical                                         │
│                                                                           │
│                     [Assign Mechanics Button]                            │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ↓ Saves to Database
┌──────────────────────────────────────────────────────────────────────────┐
│                    jobcardMechanic TABLE                                  │
│  ┌────┬──────────┬────────────┬─────────────────────────────────────┐  │
│  │ ID │ Jobcard  │ Mechanic   │ Assigned At                         │  │
│  ├────┼──────────┼────────────┼─────────────────────────────────────┤  │
│  │  1 │    1     │    17      │ 2025-10-08 10:30:00                 │  │
│  │  2 │    1     │    18      │ 2025-10-08 10:30:00                 │  │
│  └────┴──────────┴────────────┴─────────────────────────────────────┘  │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                    Step 2: Click "Assign Spare-parts"
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    ASSIGN SPARE PARTS MODAL                               │
│                                                                           │
│  ☑ Engine Oil Filter (ENG001)    Qty: [2]  Rs. 2,500 each              │
│  ☑ Brake Pads (BRK002)           Qty: [1]  Rs. 5,600 each              │
│  ☐ Car Battery (ELC003)          Qty: [_]  Rs. 18,000 each             │
│                                                                           │
│                  [Assign Selected Parts Button]                          │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ↓ Saves to Database
┌──────────────────────────────────────────────────────────────────────────┐
│                   jobcardSparePart TABLE                                  │
│  ┌────┬──────────┬────────┬─────┬──────────┬─────────────────────┐     │
│  │ ID │ Jobcard  │ Part   │ Qty │ Unit     │ Total               │     │
│  ├────┼──────────┼────────┼─────┼──────────┼─────────────────────┤     │
│  │  1 │    1     │   43   │  2  │ 2,500.00 │ 5,000.00            │     │
│  │  2 │    1     │   44   │  1  │ 5,600.00 │ 5,600.00            │     │
│  └────┴──────────┴────────┴─────┴──────────┴─────────────────────┘     │
│                                                                           │
│  Total Parts Cost: Rs. 10,600.00                                        │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                  Step 3: Click "SUBMIT JOB" Button ✨
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                   handleSubmitJob() Function                              │
│                                                                           │
│  1. Check mechanics assigned ✅                                          │
│  2. Check spare parts assigned ✅                                        │
│  3. Call API: updateBookingStatus(bookingId, "in_progress")             │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ↓ API Call
┌──────────────────────────────────────────────────────────────────────────┐
│               PUT /api/bookings/:id/status                                │
│                  { status: "in_progress" }                                │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ↓ Backend Processing
┌──────────────────────────────────────────────────────────────────────────┐
│            bookingController.updateBookingStatus()                        │
│                                                                           │
│  1. Update booking:                                                      │
│     UPDATE booking SET status = 'in_progress' WHERE bookingId = 33       │
│                                                                           │
│  2. Update jobcard: ✨                                                   │
│     UPDATE jobcard                                                       │
│     SET status = 'in_progress', partCode = 'ASSIGNED'                    │
│     WHERE bookingId = 33                                                 │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ↓ Database Updated
┌──────────────────────────────────────────────────────────────────────────┐
│                         DATABASE STATE                                    │
│                                                                           │
│  booking TABLE:                                                          │
│  ┌────────────┬─────────────┬────────────────────────────────────┐     │
│  │ bookingId  │ status      │ vehicleNumber                       │     │
│  ├────────────┼─────────────┼────────────────────────────────────┤     │
│  │    33      │ in_progress │ TG-0067                             │     │
│  └────────────┴─────────────┴────────────────────────────────────┘     │
│                                                                           │
│  jobcard TABLE:                                                          │
│  ┌────────────┬────────────┬─────────────┬──────────────────────┐      │
│  │ jobcardId  │ bookingId  │ status      │ partCode             │      │
│  ├────────────┼────────────┼─────────────┼──────────────────────┤      │
│  │     1      │    33      │ in_progress │ ASSIGNED             │      │
│  └────────────┴────────────┴─────────────┴──────────────────────┘      │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 │ Now Visible To ↓
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                         MECHANIC DASHBOARD                                │
│                          (Job Cards Tab)                                  │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                    Mechanic Logs In (Rana - MEC-001)
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│               useEffect(() => { ... }, [user])                            │
│                                                                           │
│  if (user && user.mechanicId) {                                          │
│    const response = await jobcardAPI.getMechanicJobcards(user.mechanicId)│
│    setJobcards(response.data.data)                                       │
│  }                                                                        │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ↓ API Call
┌──────────────────────────────────────────────────────────────────────────┐
│          GET /api/jobcards/mechanic/17                                    │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ↓ Database Query
┌──────────────────────────────────────────────────────────────────────────┐
│                    jobcardRoutes.js Handler                               │
│                                                                           │
│  SELECT DISTINCT                                                         │
│    j.jobcardId, j.bookingId, j.status,                                  │
│    b.vehicleNumber, b.customerName, b.serviceTypes                      │
│  FROM jobcard j                                                          │
│  JOIN booking b ON j.bookingId = b.bookingId                            │
│  LEFT JOIN jobcardMechanic jm ON j.jobcardId = jm.jobcardId            │
│  WHERE j.mechanicId = 17 OR jm.mechanicId = 17                          │
│                                                                           │
│  + Get assigned mechanics (jobcardMechanic)                              │
│  + Get assigned spare parts (jobcardSparePart)                           │
│  + Calculate total parts cost                                            │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ↓ Returns Data
┌──────────────────────────────────────────────────────────────────────────┐
│                         API RESPONSE                                      │
│                                                                           │
│  {                                                                        │
│    "success": true,                                                      │
│    "count": 1,                                                           │
│    "data": [{                                                            │
│      "jobcardId": 1,                                                     │
│      "bookingId": 33,                                                    │
│      "status": "in_progress",                                            │
│      "vehicleNumber": "TG-0067",                                         │
│      "vehicleBrand": "Toyota",                                           │
│      "customerName": "John Doe",                                         │
│      "serviceTypes": ["Oil Change", "Brake Service"],                   │
│      "assignedMechanics": [                                              │
│        { "mechanicId": 17, "mechanicName": "Rana", ... },               │
│        { "mechanicId": 18, "mechanicName": "Veera", ... }               │
│      ],                                                                  │
│      "assignedSpareParts": [                                             │
│        { "partId": 43, "partName": "Engine Oil Filter", ... },          │
│        { "partId": 44, "partName": "Brake Pads", ... }                  │
│      ],                                                                  │
│      "totalPartsCost": 10600.00                                          │
│    }]                                                                    │
│  }                                                                        │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ↓ UI Renders
┌──────────────────────────────────────────────────────────────────────────┐
│                    MECHANIC SEES JOBCARD! ✅                             │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Job Card #1                              [IN PROGRESS]          │    │
│  │ Booking #33 • TG-0067                     Oct 8, 2025          │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │ 🚗 Vehicle            👤 Customer                              │    │
│  │ Toyota Prius 2020      John Doe                                │    │
│  │ Sedan                  0771234567                              │    │
│  │                                                                 │    │
│  │ Services Required:                                             │    │
│  │ [🔧 Oil Change] [🔧 Brake Service]                            │    │
│  │                                                                 │    │
│  │ Assigned Mechanics:                                            │    │
│  │ [👤 Rana (MEC-001)] [👤 Veera (MEC-002)]                      │    │
│  │                                                                 │    │
│  │ Spare Parts:                                                   │    │
│  │ ┌─────────────────────────────────────────────────────────┐   │    │
│  │ │ 📦 Engine Oil Filter (ENG001)  Qty: 2  Rs. 5,000.00   │   │    │
│  │ │ 📦 Brake Pads (BRK002)         Qty: 1  Rs. 5,600.00   │   │    │
│  │ ├─────────────────────────────────────────────────────────┤   │    │
│  │ │ Total Parts Cost:                      Rs. 10,600.00   │   │    │
│  │ └─────────────────────────────────────────────────────────┘   │    │
│  │                                                                 │    │
│  │ [Mark In Progress]          [Mark Complete]                   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ✅ JOBCARD IS NOW VISIBLE TO MECHANIC!                                 │
│  ✅ All details displayed                                                │
│  ✅ Can update status                                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Status Update Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Mechanic clicks "Mark Complete" button                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓ handleUpdateStatus(jobcardId, 'completed')
┌──────────────────────────────────────────────────────────────┐
│  PUT /api/jobcards/1/status                                  │
│  { status: 'completed' }                                     │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓ Backend Update
┌──────────────────────────────────────────────────────────────┐
│  UPDATE jobcard                                              │
│  SET status = 'completed', completedAt = NOW()               │
│  WHERE jobcardId = 1                                         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓ UI Update
┌──────────────────────────────────────────────────────────────┐
│  [COMPLETED ✓]     Status badge turns green                 │
│  Buttons become disabled                                     │
│  ✅ Job marked as complete!                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Summary

```
Service Advisor Action → Database Update → Mechanic View

SUBMIT JOB
    ↓
booking.status = 'in_progress'
jobcard.status = 'in_progress'
    ↓
GET /api/jobcards/mechanic/:id
    ↓
MECHANIC SEES JOBCARD IN DASHBOARD ✅
```

---

## 🎯 Key Integration Points

| Point                 | What Happens                             | Result               |
| --------------------- | ---------------------------------------- | -------------------- |
| 1. Assign Mechanics   | Data saved to `jobcardMechanic`          | Team tracking ✅     |
| 2. Assign Spare Parts | Data saved to `jobcardSparePart`         | Parts tracking ✅    |
| 3. **Submit Job**     | Booking & Jobcard status → `in_progress` | **Visibility ON** ✅ |
| 4. Mechanic Login     | Fetch jobcards via API                   | Display jobs ✅      |
| 5. Status Update      | Update database, refresh UI              | Status tracking ✅   |

---

**This visual flow shows the complete journey from Service Advisor clicking "Submit Job" to Mechanic seeing the jobcard in their dashboard!**
