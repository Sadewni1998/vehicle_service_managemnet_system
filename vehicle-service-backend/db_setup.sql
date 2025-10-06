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

    

-- *NEW* vehicle table to store vehicle information
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
    kilometersRun INT,
    bookingDate DATE NOT NULL,
    timeSlot VARCHAR(100) NOT NULL,
    
    -- We use the JSON data type to store the array of selected services.
    -- This is perfect for handling multiple checkbox selections.
    serviceTypes JSON, 
    
    specialRequests TEXT,
    
    -- It's good practice to have a status for the booking
    status ENUM('Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    
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
    customerId INT NOT NULL,
    vehicleId INT NOT NULL,
    
    -- Fields from your form
    emergencyType VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,  -- For storing location coordinates
    longitude DECIMAL(11, 8) NOT NULL, -- For storing location coordinates
    problemDescription TEXT,
    additionalInfo TEXT,
    
    -- Status to track the request progress
    status ENUM('Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    
    -- Timestamps for tracking
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys to link with other tables
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE CASCADE,
    FOREIGN KEY (vehicleId) REFERENCES vehicle(vehicleId) ON DELETE CASCADE
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
('Manager', 'manager@vehicleservice.com', '$2b$10$ZTzF/rTITvOq79Hk.i5U4e9xVMk13Q32IiX7Uo0JrP3L/MlYBx6X.yYC', 'manager');

-- Insert test data for mechanic (password: mechanic123)
INSERT INTO staff (name, email, password, role) VALUES
<<<<<<< Updated upstream
('Mechanic', 'mechanic@vehicleservice.com', '$2b$10$NlhlnAzMEEcZn4eZa1wO3uqzZmmSk6xqUZSmIvP60gv2EoKs8pr2K', 'mechanic');
 
=======
('Mechanic', 'mechanic@vehicleservice.com', '$2b$10$NlhlnAzMEEcZn4eZa1wO3uqzZmmSk6xqUZSmIvP60gv2EoKs8pr2K
', 'mechanic');

-- Create mechanic table for specialized mechanic information
CREATE TABLE IF NOT EXISTS mechanic (
    mechanicId INT AUTO_INCREMENT PRIMARY KEY,
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
    jobcardId INT AUTO_INCREMENT PRIMARY KEY,
    mechanicId INT NOT NULL,
    bookingId INT NOT NULL,
    
    -- Job card status with all requested statuses
    status ENUM('Open', 'In Progress', 'Ready for Review', 'Completed', 'Canceled') DEFAULT 'Open',
    
    -- Service details from booking.serviceTypes field
    serviceDetails JSON NOT NULL, -- Stores the services to be performed from booking.serviceTypes
    
    -- Additional job card fields
    assignedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    startedAt TIMESTAMP NULL,
    completedAt TIMESTAMP NULL,
    -- Timestamps for tracking
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (mechanicId) REFERENCES mechanic(mechanicId) ON DELETE RESTRICT,
    FOREIGN KEY (bookingId) REFERENCES booking(bookingId) ON DELETE CASCADE
);
>>>>>>> Stashed changes
