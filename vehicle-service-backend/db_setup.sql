-- Use your existing database
USE vehicle_service_db;

-- This is your existing customer table (no changes needed)
CREATE TABLE IF NOT EXISTS customer (
    customerId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Use your existing database
USE vehicle_service_db;

-- Modify the customer table to support Google Sign-In
ALTER TABLE customer
    -- Make the password nullable, as Google users won't have one in our system
    MODIFY COLUMN password VARCHAR(255) NULL,
    -- Add a column to store the user's unique Google ID
    ADD COLUMN googleId VARCHAR(255) UNIQUE NULL,
    -- Add a column to track the authentication provider ('local' or 'google')
    ADD COLUMN provider VARCHAR(50) NOT NULL DEFAULT 'local';

    

-- NEW vehicle table to store vehicle information
-- This table is linked to the customer via the 'customerId' foreign key.
CREATE TABLE IF NOT EXISTS vehicle (
    vehicleId INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT NOT NULL,
    vehicleNumber VARCHAR(100) NOT NULL UNIQUE,
    brand VARCHAR(100),
    model VARCHAR(100),
    type VARCHAR(100),
    manufactureYear INT,
    fuelType VARCHAR(50),
    transmission VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- This creates the crucial link between a vehicle and its owner.
    -- ON DELETE CASCADE means if a customer is deleted, all their vehicles are automatically deleted too.
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE CASCADE
);

-- New table to store all booking details from the form
CREATE TABLE booking (
    bookingId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicleNumber VARCHAR(100) NOT NULL,
    vehicleType VARCHAR(100),
    fuelType VARCHAR(50),
    vehicleBrand VARCHAR(100),
    vehicleBrandModel VARCHAR(100),
    manufacturedYear YEAR,
    transmissionType VARCHAR(50),
    bookingDate DATE NOT NULL,
    timeSlot VARCHAR(100) NOT NULL,
    
    -- We use the JSON data type to store the array of selected services.
    -- This is perfect for handling multiple checkbox selections.
    serviceTypes JSON, 
    
    specialRequests TEXT,
    
    -- It's good practice to have a status for the booking (use lowercase values)
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'arrived') DEFAULT 'pending',
    
    -- Track when the vehicle arrived
    arrivedTime TIME NULL,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Optional: If a booking is made by a logged-in user, we can link it
    customerId INT NULL,
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE SET NULL,
    
    -- Ensure one time slot per date can only be booked once
    UNIQUE KEY unique_time_slot (bookingDate, timeSlot)
);

-- New table to store breakdown service requests
CREATE TABLE breakdown_request (
    requestId INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT NULL,  -- Made nullable for guest requests
    vehicleId INT NULL,   -- Made nullable for guest requests
    
    -- Fields from your form
    emergencyType VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,  -- For storing location coordinates
    longitude DECIMAL(11, 8) NOT NULL, -- For storing location coordinates
    problemDescription TEXT,
    additionalInfo TEXT,
    
    -- Contact information for breakdown requests
    contactName VARCHAR(255) NOT NULL,
    contactPhone VARCHAR(20) NOT NULL,
    vehicleNumber VARCHAR(100) NOT NULL,
    vehicleType VARCHAR(100),
    
    -- Status to track the request progress
    status ENUM('Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    
    -- Timestamps for tracking
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys to link with other tables (made nullable for guest requests)
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE SET NULL,
    FOREIGN KEY (vehicleId) REFERENCES vehicle(vehicleId) ON DELETE SET NULL
);

-- Use your existing database
USE vehicle_service_db;

-- New table to store messages from the contact form
CREATE TABLE contact_submissions (
    submissionId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    
    -- A flag to help staff track which messages have been read
    isRead BOOLEAN DEFAULT FALSE,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receptionist Staff Table Schema
-- This table stores all staff members including receptionists

USE vehicle_service_db;

-- Staff table for all staff members (receptionist, manager, mechanic, etc.)
CREATE TABLE staff (
    staffId INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('receptionist', 'mechanic', 'manager', 'service_advisor') NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (staffId),
    UNIQUE KEY email (email)
);

-- Add indexes for better performance
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_role ON staff(role);

-- Insert test data for service advisor (password: service_advisor123)
INSERT INTO staff (name, email, password, role) VALUES
('Service Advisor', 'service_advicer@vehicleservice.com', '$2b$10$6NkoMNcWBjifArTW5hfryuJPPLIwfZpaIPbhso7XuU2toEP17wWXe', 'service_advisor');

-- Insert test data for receptionist (password: receptionist123)
INSERT INTO staff (name, email, password, role) VALUES
('Receptionist', 'receptionist@vehicleservice.com', '$2b$10$MOOmKWRYOlT8w.bRO.4lq.MxVPT9wlpaTbLJBFnEORPj9MoA1v3zu', 'receptionist');

-- Insert test data for manager (password: manager123)
INSERT INTO staff (name, email, password, role) VALUES
('Manager', 'manager@vehicleservice.com', '$2b$10$0emTWCs9TR36WJRnhgKtU.8bvB00iLhgYU373PcYx5S0WaRFUXye2', 'manager');

-- Insert test data for mechanic (password: mechanic123)
INSERT INTO staff (name, email, password, role) VALUES
('Mechanic', 'mechanic@vehicleservice.com', '$2b$10$NlhlnAzMEEcZn4eZa1wO3uqzZmmSk6xqUZSmIvP60gv2EoKs8pr2K', 'mechanic');

-- Create mechanic table for specialized mechanic information
CREATE TABLE IF NOT EXISTS mechanic (
    mechanicId INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    staffId INT NOT NULL,
    mechanicCode VARCHAR(20) NOT NULL UNIQUE, -- Unique code like MEC001, MEC002, etc.
    specialization VARCHAR(255), -- What the mechanic specializes in
    experienceYears INT DEFAULT 0,
    certifications TEXT, -- JSON or comma-separated list of certifications
    availability ENUM('Available', 'Busy', 'On Break', 'Off Duty') DEFAULT 'Available',
    hourlyRate DECIMAL(8, 2), -- Hourly rate for the mechanic
    isActive BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint to staff table
    FOREIGN KEY (staffId) REFERENCES staff(staffId) ON DELETE CASCADE
);

-- Create the spare parts table (after mechanic table is created)
CREATE TABLE IF NOT EXISTS spareparts (
    partId INT AUTO_INCREMENT PRIMARY KEY,
    partCode VARCHAR(50) NOT NULL UNIQUE,
    partName VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM(
        'Engine', 
        'Electrical', 
        'Body', 
        'Suspension', 
        'Brakes', 
        'Cooling', 
        'Transmission', 
        'Interior', 
        'Exterior', 
        'Accessories'
    ) NOT NULL,
    unitPrice DECIMAL(10, 2) NOT NULL,
    imageUrl VARCHAR(500),
    
    -- Additional useful fields for inventory management
    stockQuantity INT DEFAULT 0,
    mechanicId INT NULL, -- Reference to mechanic responsible for this part
    isActive BOOLEAN DEFAULT TRUE,
    
    -- Timestamps for tracking
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint to mechanic table (added directly in CREATE TABLE)
    FOREIGN KEY (mechanicId) REFERENCES mechanic(mechanicId) ON DELETE SET NULL
);

-- Create jobcard table for tracking service work assignments
CREATE TABLE IF NOT EXISTS jobcard (
    jobcardId INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    mechanicId INT NOT NULL,
    bookingId INT NOT NULL,
    partCode VARCHAR(100) NOT NULL,
    
    -- Job card status with all requested statuses
    status ENUM('open', 'in_progress', 'ready_for_review', 'completed', 'canceled') DEFAULT 'open',
    
    -- Service details from booking.serviceTypes field
    serviceDetails JSON NOT NULL, -- Stores the services to be performed from booking.serviceTypes
    
    -- Additional job card fields
    assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completedAt TIMESTAMP NULL,
    
    -- Foreign key constraints
    FOREIGN KEY (mechanicId) REFERENCES mechanic(mechanicId) ON DELETE RESTRICT,
    FOREIGN KEY (bookingId) REFERENCES booking(bookingId) ON DELETE CASCADE
);

-- Create jobcardMechanic table for track completed job
CREATE TABLE IF NOT EXISTS jobcardMechanic (
    jobcardMechanicId INT NOT NULL AUTO_INCREMENT,
    jobcardId INT NOT NULL,
    mechanicId INT NOT NULL,
    assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completedAt TIMESTAMP NULL,
    PRIMARY KEY (jobcardMechanicId),
    FOREIGN KEY (jobcardId) REFERENCES jobcard(jobcardId) ON DELETE CASCADE,
    FOREIGN KEY (mechanicId) REFERENCES mechanic(mechanicId) ON DELETE CASCADE
);

-- Insert test bookings for today's dat
-- Note: Replace CURDATE() with actual date if needed for testing
INSERT INTO booking (
    name, phone, vehicleNumber, vehicleType, fuelType,
    vehicleBrand, vehicleBrandModel, manufacturedYear, transmissionType,
    bookingDate, timeSlot, serviceTypes,
    specialRequests, customerId, status, arrivedTime
) VALUES 
(
    'John Smith', '0771234567', 'ABC-123', 'Sedan', 'Petrol',
    'Toyota', 'Camry', 2020, 'Automatic',
    CURDATE(), '07:30-09:30', '["Oil Change", "Brake Inspection"]',
    'Please check the air conditioning system', NULL, 'pending', NULL
),
(
    'Sarah Johnson', '0777654321', 'XYZ-789', 'SUV', 'Petrol',
    'Honda', 'CR-V', 2019, 'Automatic',
    CURDATE(), '09:30-11:30', '["Engine Service", "Tire Rotation"]',
    'Check for any unusual noises', NULL, 'pending', NULL
),
(
    'Michael Chen', '0775555555', 'DEF-456', 'Hatchback', 'Petrol',
    'Nissan', 'Micra', 2021, 'Manual',
    CURDATE(), '12:00-14:00', '["Regular Service", "Battery Check"]',
    'Replace air filter', NULL, 'arrived', '07:45'
),
(
    'Emily Davis', '0778888888', 'GHI-321', 'Sedan', 'Petrol',
    'BMW', '3 Series', 2018, 'Automatic',
    CURDATE(), '14:00-16:00', '["Premium Service", "Transmission Check"]',
    'Full diagnostic check', NULL, 'pending', NULL
),
(
    'Robert Wilson', '0779999999', 'JKL-654', 'Pickup', 'Diesel',
    'Ford', 'Ranger', 2017, 'Manual',
    CURDATE(), '16:00-18:00', '["Engine Overhaul", "Clutch Replacement"]',
    'Customer cancelled due to emergency', NULL, 'cancelled', NULL
);

hi jaazil!