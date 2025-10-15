# Vehicle Service Management System - System Overview

This document gives a concise, descriptive overview of the system: architecture, key features, and where each feature’s implementation lives in the codebase (backend and frontend). Use it to quickly navigate or onboard new contributors.

## Architecture

- Frontend: React + Vite + Tailwind CSS
  - Entry: `src/main.jsx`, `src/App.jsx`
  - Routing/UI pages in `src/pages`, shared components in `src/components`
  - API client with Axios: `src/utils/api.js`
  - Auth state/context: `src/context/AuthContext.jsx`
- Backend: Node.js + Express + MySQL
  - Server entry: `vehicle-service-backend/index.js`
  - Database pool: `vehicle-service-backend/config/db.js`
  - Express routers in `vehicle-service-backend/routes`
  - Controllers in `vehicle-service-backend/controllers`
  - Middleware in `vehicle-service-backend/middleware`
  - DB schema and tooling: `vehicle-service-backend/db_setup.sql`, `vehicle-service-backend/scripts/applySchema.js`

## Authentication and Authorization

- Customer auth (JWT):
  - Routes: `vehicle-service-backend/routes/authRoutes.js`
  - Controller: `vehicle-service-backend/controllers/authController.js`
    - register(req,res)
    - login(req,res)
    - getProfile(req,res)
    - updateProfile(req,res)
    - changePassword(req,res)
    - googleSignIn(req,res)
    - getCustomerStats(req,res)
  - Middleware: `vehicle-service-backend/middleware/authMiddleware.js`
    - ensureAuthenticated — validates JWT and populates `req.user`
    - checkRole([...roles]) — RBAC for staff endpoints
  - Frontend integration:
    - Context: `src/context/AuthContext.jsx` (login/register/logout, staff or customer, token persistence)
    - Google OAuth config: `src/config/googleAuth.js`
    - API bindings: `src/utils/api.js` (authAPI)

## Core Business Features (Backend APIs)

- Bookings

  - Routes: `vehicle-service-backend/routes/bookingRoutes.js`
  - Controller: `vehicle-service-backend/controllers/bookingController.js`
    - createBooking — POST /api/bookings (auth required)
    - updateBooking — PUT /api/bookings/:bookingId (auth required)
    - getAllBookings — GET /api/bookings (staff)
    - getBookingById — GET /api/bookings/:bookingId (auth required)
    - getUserBookings — GET /api/bookings/user (auth required)
    - updateBookingStatus — PUT /api/bookings/:bookingId/status (staff)
    - deleteBooking — DELETE /api/bookings/:bookingId (auth required)
    - getBookingStats — GET /api/bookings/stats (staff)
    - checkBookingAvailability — GET /api/bookings/availability
    - getAvailableTimeSlots — GET /api/bookings/time-slots?date=YYYY-MM-DD
    - getTodayBookings — GET /api/bookings/today (receptionist/service_advisor/manager)
    - getArrivedBookings — GET /api/bookings/arrived (service_advisor/manager)
    - assignMechanicsToBooking — PUT /api/bookings/:bookingId/assign-mechanics (staff)
    - assignSparePartsToBooking — PUT /api/bookings/:bookingId/assign-spare-parts (staff)
    - submitJobcard — PUT /api/bookings/:bookingId/submit-jobcard (staff)
    - updateKilometersRun — PUT /api/bookings/:bookingId/kilometers (staff)

- Vehicles (per-customer vehicle management)

  - Routes: `vehicle-service-backend/routes/vehicleRoutes.js`
  - Controller: `vehicle-service-backend/controllers/vehicleController.js`
    - getUserVehicles — GET /api/vehicles
    - addUserVehicle — POST /api/vehicles
    - getUserVehicleById — GET /api/vehicles/:vehicleId
    - updateUserVehicle — PUT /api/vehicles/:vehicleId
    - deleteUserVehicle — DELETE /api/vehicles/:vehicleId

- Jobcards (work orders linking bookings, mechanics, and parts)

  - Routes: `vehicle-service-backend/routes/jobcardRoutes.js`
    - assign mechanics to jobcard — PUT /api/jobcards/:jobcardId/assign-mechanics (staff)
    - list mechanic jobcards — GET /api/jobcards/mechanic/:mechanicId
    - list ready-for-review — GET /api/jobcards/ready-for-review (service_advisor)
    - get jobcard by id — GET /api/jobcards/:jobcardId
    - update status — PUT /api/jobcards/:jobcardId/status (staff)
    - mechanic notes — PUT /api/jobcards/:jobcardId/mechanics/:mechanicId/notes (mechanic)
    - mechanic mark complete — PUT /api/jobcards/:jobcardId/mechanics/:mechanicId/complete (mechanic)
    - approve jobcard — PUT /api/jobcards/:jobcardId/approve (service_advisor)

- Mechanics directory and availability

  - Routes: `vehicle-service-backend/routes/mechanicRoutes.js`
    - list mechanics (filterable/paginated) — GET /api/mechanics
    - available mechanics — GET /api/mechanics/available
    - get mechanic by id — GET /api/mechanics/:id
    - get by staff id — GET /api/mechanics/staff/:staffId
    - create mechanic (from staff) — POST /api/mechanics
    - update mechanic — PUT /api/mechanics/:id
    - update mechanic availability — PUT /api/mechanics/:id/availability
    - delete mechanic (soft) — DELETE /api/mechanics/:id
    - list specializations — GET /api/mechanics/specializations/list

- Spare parts inventory

  - Routes: `vehicle-service-backend/routes/sparepartsRoutes.js`
    - list parts (filterable/paginated) — GET /api/spareparts
    - categories — GET /api/spareparts/categories
    - get by id — GET /api/spareparts/:id
    - create — POST /api/spareparts
    - update — PUT /api/spareparts/:id
    - delete (soft) — DELETE /api/spareparts/:id
    - update stock — PUT /api/spareparts/:id/stock
    - parts by mechanic — GET /api/spareparts/mechanic/:mechanicId
    - assign mechanic — PUT /api/spareparts/:id/assign-mechanic

- Staff (receptionist, mechanic, service_advisor)

  - Routes: `vehicle-service-backend/routes/staffRoutes.js`
  - Controller: `vehicle-service-backend/controllers/staffController.js`
    - registerStaff — POST /api/staff/register
    - loginStaff — POST /api/staff/login
    - getAllStaff — GET /api/staff
    - checkRoleAvailability — GET /api/staff/role-availability/:role
    - getStaffStats — GET /api/staff/stats

- Invoices (PDF generation; requires jobcard verification)

  - Routes: `vehicle-service-backend/routes/invoiceRoutes.js`
  - Controller: `vehicle-service-backend/controllers/invoiceController.js`
    - generateInvoice — GET /api/invoices/:bookingId/generate (manager)
    - finalizeInvoice — POST /api/invoices/:bookingId/finalize (manager)

- Contact form

  - Routes: `vehicle-service-backend/routes/contactRoutes.js`
  - Controller: `vehicle-service-backend/controllers/contactController.js`
    - submitContactForm — POST /api/contact

- Breakdown (Roadside assistance requests)
  - Routes: `vehicle-service-backend/routes/breakdownRoutes.js`
  - Controller: `vehicle-service-backend/controllers/breakdownController.js`
    - createBreakdownRequest — POST /api/breakdown/request (public)
    - getMyBreakdownRequests — GET /api/breakdown/my-requests (customer)
    - getAllBreakdownRequests — GET /api/breakdown (staff)
    - getBreakdownRequestById — GET /api/breakdown/:id (staff)
    - updateBreakdownRequestStatus — PUT /api/breakdown/:id/status (staff)
    - getBreakdownStats — GET /api/breakdown/stats (staff)

## Frontend Feature Map (Pages/Components)

- Public pages: `src/pages`

  - Home — `Home.jsx`
  - About — `About.jsx`
  - Services — `Services.jsx`
  - Contact — `Contact.jsx` (uses contactAPI.submit)
  - Register — `Register.jsx` (customer registration incl. vehicle(s))
  - Login — `Login.jsx` (customer or staff via `AuthContext`)
  - Booking — `Booking.jsx` (creates booking; fetches availability/time-slots; loads user vehicles via vehicleAPI)
  - Request — `Request.jsx` (breakdown service request)

- Dashboards: `src/pages`

  - CustomerDashboard — `CustomerDashboard.jsx` (user bookings overview)
  - ReceptionistDashboard — `ReceptionistDashboard.jsx`
    - Today’s bookings list; mark arrived; edit kilometers
    - API: receptionistAPI.getTodayBookings, updateBookingStatus, updateKilometers
  - ServiceAdvisorDashboard — `ServiceAdvisorDashboard.jsx`
    - View arrived bookings; assign mechanics and spare parts
    - Submit jobcard, review ready-for-review, approve jobcards
    - APIs: serviceAdvisorAPI._, mechanicsAPI._, sparePartsAPI.\*
  - MechanicDashboard — `MechanicDashboard.jsx`
    - View assigned jobcards; update notes; mark completion
    - APIs: jobcardAPI.\*, mechanicsAPI.getByStaffId
  - ManagementDashboard — `ManagementDashboard.jsx` (overall stats; manager actions)
  - Admin — `Admin.jsx` (staff/admin flows)

- Shared UI components: `src/components`

  - Navbar — `Navbar.jsx`
  - Footer — `Footer.jsx`
  - Vehicle debug/test components — `VehicleDebugger.jsx`, `VehicleSelectionTest.jsx`, `SimpleVehicleTest.jsx`

- Auth and API utilities
  - Auth context/provider — `src/context/AuthContext.jsx`
  - API client and endpoints — `src/utils/api.js`
    - authAPI, bookingsAPI, vehicleAPI, mechanicsAPI, jobcardAPI, receptionistAPI, serviceAdvisorAPI, sparePartsAPI, staffAPI, customerAPI, breakdownAPI, invoiceAPI

## Data and Database

- Connection pool: `vehicle-service-backend/config/db.js`
- Schema and setup: `vehicle-service-backend/db_setup.sql`
- Apply schema script: `vehicle-service-backend/scripts/applySchema.js`
  - Reads `.env` for DB_HOST/DB_USER/DB_PASSWORD/DB_NAME
  - Idempotent execution; safe to rerun

## Environment and Config

- Backend expects `.env` in `vehicle-service-backend/` with:
  - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
  - JWT_SECRET
  - GOOGLE_CLIENT_ID (for Google Sign-In verification)
- Frontend config:
  - `VITE_API_URL` (optional override for API base URL)
  - Google client config in `src/config/googleAuth.js`

## Build/Run Tasks

- Frontend
  - Build: VS Code Task “Build front-end” → `npm run build`
  - Lint: VS Code Task “Lint front-end” → `npm run lint`
- Backend
  - Apply DB schema: VS Code Task “Apply DB schema (optional)” → `node vehicle-service-backend/scripts/applySchema.js`

## Notes and Flow Highlights

- Booking flow: Customer selects vehicle and time slot → POST /bookings → Receptionist marks arrived → Jobcard auto-created → Service Advisor assigns mechanics/parts → Mechanics complete tasks → Jobcard becomes ready_for_review → Service Advisor approves (booking becomes verified) → Manager generates invoice.
- Role enforcement: checkRole middleware guards staff-only routes. Customer vs Staff identity is carried in JWT and surfaced in `AuthContext`.
- Consistent JSON storage for arrays (serviceTypes, assignedMechanicIds, assignedSparePartIds) with helper parsing in controllers.

---

If anything is missing or you want a more detailed API reference (parameters, response shapes), we can extend this document with examples per endpoint.
