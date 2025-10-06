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
CREATE INDEX idx_staff_active ON staff(isActive);

-- Insert test data for service advisor (password: service_advisor123)
INSERT INTO staff (name, email, password, role) VALUES
('Service Advisor', 'service_advicer@vehicleservice.com', '$2b$10$6NkoMNcWBjifArTW5hfryuJPPLIwfZpaIPbhso7XuU2toEP17wWXe', 'service_advisor');

-- Insert test data for receptionist (password: receptionist123)
INSERT INTO staff (name, email, password, role) VALUES
('Receptionist', 'receptionist@vehicleservice.com', '$2b$10$MOOmKWRYOlT8w.bRO.4lq.MxVPT9wlpaTbLJBFnEORPj9MoA1v3zu
', 'service_advisor');

-- Insert test data for mechanic (password: mechanic123)
INSERT INTO staff (name, email, password, role) VALUES
('Mechanic', 'mechanic@vehicleservice.com', '$2b$10$IDJ6.Z2NGjcCWo6tLJNkZObAapd.oHhhPfm50YEOoBJLkHVp.4cfG
', 'mechanic');

-- Insert test data for manager (password: manager123)
INSERT INTO staff (name, email, password, role) VALUES
('Manager', 'manager@vehicleservice.com', '$2b$10$ZTzF/rTITvOq79Hk.i5U4e9xVMk13Q32IiX7Uo0JrP3L/MlYBx6X.yYC', 'manager');





