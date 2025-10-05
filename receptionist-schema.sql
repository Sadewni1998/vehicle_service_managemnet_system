-- Receptionist Staff Table Schema
-- This table stores all staff members including receptionists

USE vehicle_service_db;

-- Staff table for all staff members (receptionist, manager, mechanic, etc.)
CREATE TABLE IF NOT EXISTS staff (
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

-- Add indexes for better performance
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_active ON staff(isActive);

-- Sample receptionist data
INSERT INTO staff (name, email, password, role, phone, address) VALUES 
('Test Receptionist', 'receptionist@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'receptionist', '0112345678', '123 Main Street, Colombo'),
('John Manager', 'manager@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', '0112345679', '456 Manager Lane, Colombo'),
('Sarah Mechanic', 'mechanic@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mechanic', '0112345680', '789 Mechanic Road, Colombo');

-- Show the table structure
DESCRIBE staff;

-- Show sample data
SELECT * FROM staff;
