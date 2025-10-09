# Mechanics: Login + Details

This backend stores each mechanic in TWO places:

- `staff` table: the login account (email/password + role)
- `mechanic` table: mechanic profile/details (code, specialization, availability, etc.) linked by `staffId`

## Create a mechanic (one-shot)

Use the staff registration endpoint with `role: "mechanic"`. It will automatically create the mechanic details in a single transaction.

POST /api/staff/register

Example body:
{
"name": "Jane Doe",
"email": "jane.doe@shop.com",
"password": "StrongP@ssw0rd",
"role": "mechanic",
"mechanicDetails": {
"mechanicName": "Jane Doe",
"specialization": "Electrical Systems",
"experienceYears": 5,
"certifications": "[\"ASE Certified\"]",
"availability": "Available",
"hourlyRate": 2500
}
}

Response includes the new `staffId` and the created `mechanic` record.

## Create mechanic details for an existing mechanic staff

If you already created the staff login separately with role `mechanic`, you can create the mechanic profile/details by linking the staff ID:

POST /api/mechanics

Example body:
{
"staffId": 42,
"specialization": "Engine and Transmission",
"experienceYears": 7,
"certifications": "[\"ASE Master Technician\"]",
"availability": "Available",
"hourlyRate": 2800
}

This generates a unique `mechanicCode` (e.g., MEC001) and stores the record in `mechanic`, visible via the `mechanic_details` view.

## Fetch mechanics

- GET /api/mechanics // list mechanics
- GET /api/mechanics/available // only available
- GET /api/mechanics/:id // by mechanicId
- GET /api/mechanics/staff/:staffId

## Notes

- Availability must be one of: `Available`, `Busy`, `On Break`, `Off Duty`.
- `mechanic_details` view joins `mechanic` + `staff` for convenient reads.
- Deleting a mechanic via DELETE /api/mechanics/:id performs a soft delete (`isActive = false`). The staff login remains intact.
