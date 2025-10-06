# Receptionist Database Schema

## Staff Table Schema

The `staff` table stores all staff members including receptionists, managers, mechanics, and service advisors.

### Table Structure

```sql
CREATE TABLE staff (
    staffId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('receptionist', 'mechanic', 'manager', 'service_advisor') NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `staffId` | INT AUTO_INCREMENT PRIMARY KEY | Unique identifier for each staff member |
| `name` | VARCHAR(255) NOT NULL | Full name of the staff member |
| `email` | VARCHAR(255) NOT NULL UNIQUE | Email address (used for login) |
| `password` | VARCHAR(255) NOT NULL | Hashed password using bcrypt |
| `role` | ENUM | Staff role: 'receptionist', 'mechanic', 'manager', 'service_advisor' |
| `phone` | VARCHAR(20) | Contact phone number |
| `address` | TEXT | Staff member's address |
| `isActive` | BOOLEAN DEFAULT TRUE | Whether the staff member is active |
| `createdAt` | TIMESTAMP | When the record was created |
| `updatedAt` | TIMESTAMP | When the record was last updated |

### Indexes

```sql
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_active ON staff(isActive);
```

### Sample Data

```sql
INSERT INTO staff (name, email, password, role, phone, address) VALUES 
('Test Receptionist', 'receptionist@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'receptionist', '0112345678', '123 Main Street, Colombo'),
('John Manager', 'manager@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', '0112345679', '456 Manager Lane, Colombo'),
('Sarah Mechanic', 'mechanic@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mechanic', '0112345680', '789 Mechanic Road, Colombo');
```

## Test Credentials

### Receptionist Login
- **Email:** `receptionist@test.com`
- **Password:** `receptionist123`
- **Role:** `receptionist`

### Manager Login
- **Email:** `manager@test.com`
- **Password:** `receptionist123`
- **Role:** `manager`

### Mechanic Login
- **Email:** `mechanic@test.com`
- **Password:** `receptionist123`
- **Role:** `mechanic`

## API Endpoints

### Staff Authentication
- `POST /api/staff/login` - Staff login
- `POST /api/staff/register` - Register new staff (admin only)

### Receptionist Dashboard
- `GET /api/bookings/today` - Get today's bookings
- `PUT /api/bookings/:id/status` - Update booking status
- `GET /api/bookings/stats` - Get booking statistics

## Authentication Flow

1. Receptionist enters email and password
2. System validates credentials against `staff` table
3. If valid, JWT token is generated with staff information
4. Token contains: `staffId`, `email`, `name`, `role`
5. Token is used for subsequent API requests
6. Based on role, user is redirected to appropriate dashboard

## Security Features

- Passwords are hashed using bcrypt with salt rounds of 10
- JWT tokens expire after 8 hours
- Role-based access control
- Email uniqueness constraint
- Active/inactive staff status tracking


