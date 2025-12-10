-- =======================================================
-- USE OR CREATE DATABASE
-- =======================================================
CREATE DATABASE IF NOT EXISTS vehicle_service_db;
USE vehicle_service_db;

-- =======================================================
-- CUSTOMER TABLE (supports Google Sign-In)
-- =======================================================
CREATE TABLE IF NOT EXISTS customer (
    customerId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    googleId VARCHAR(255) UNIQUE NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'local',
    phone VARCHAR(20),
    address TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- VEHICLE TABLE
-- =======================================================
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
    kilometersRun INT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE CASCADE
);

-- =======================================================
-- BOOKING TABLE
-- =======================================================
CREATE TABLE IF NOT EXISTS booking (
    bookingId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicleNumber VARCHAR(100) NOT NULL,
    vehicleType VARCHAR(100),
    fuelType VARCHAR(50),
    vehicleBrand VARCHAR(100),
    vehicleBrandModel VARCHAR(100),
    manufacturedYear INT,
    transmissionType VARCHAR(50),
    kilometersRun INT,
    bookingDate DATE NOT NULL,
    timeSlot VARCHAR(100) NOT NULL,
    serviceTypes JSON,
    specialRequests TEXT,
    status ENUM('pending', 'arrived', 'confirmed', 'in_progress', 'verified', 'completed', 'cancelled') DEFAULT 'pending',
    arrivedTime TIME NULL,
    assignedMechanics JSON NULL,
    assignedSpareParts JSON NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    customerId INT NULL,
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE SET NULL,
    UNIQUE KEY unique_time_slot (bookingDate, timeSlot)
);

-- =======================================================
-- BREAKDOWN REQUEST TABLE
-- =======================================================
CREATE TABLE IF NOT EXISTS breakdown_request (
    requestId INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT NULL,
    vehicleId INT NULL,
    emergencyType VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    problemDescription TEXT,
    additionalInfo TEXT,
    contactName VARCHAR(255) NOT NULL,
    contactPhone VARCHAR(20) NOT NULL,
    vehicleNumber VARCHAR(100) NOT NULL,
    vehicleType VARCHAR(100),
    status ENUM('Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE SET NULL,
    FOREIGN KEY (vehicleId) REFERENCES vehicle(vehicleId) ON DELETE SET NULL
);

-- =======================================================
-- CONTACT SUBMISSIONS TABLE
-- =======================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
    submissionId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- STAFF TABLE
-- =======================================================
CREATE TABLE IF NOT EXISTS staff (
    staffId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('receptionist', 'mechanic', 'manager', 'service_advisor') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_role ON staff(role);

-- TEST STAFF DATA
INSERT INTO staff (name, email, password, role) VALUES
('Service Advisor', 'service_advicer@vehicleservice.com', '$2b$10$6NkoMNcWBjifArTW5hfryuJPPLIwfZpaIPbhso7XuU2toEP17wWXe', 'service_advisor'),
('Receptionist', 'receptionist@vehicleservice.com', '$2b$10$MOOmKWRYOlT8w.bRO.4lq.MxVPT9wlpaTbLJBFnEORPj9MoA1v3zu', 'receptionist'),
('Manager', 'manager@vehicleservice.com', '$2b$10$0emTWCs9TR36WJRnhgKtU.8bvB00iLhgYU373PcYx5S0WaRFUXye2', 'manager'),
('Mechanic', 'mechanic@vehicleservice.com', '$2b$10$NlhlnAzMEEcZn4eZa1wO3uqzZmmSk6xqUZSmIvP60gv2EoKs8pr2K', 'mechanic'),
('Bob Mechanic', 'bob.mechanic@vehicleservice.com', '$2b$10$123456123456123456123456123456123456123456123456123456', 'mechanic');

-- =======================================================
-- MECHANIC TABLE
-- =======================================================
CREATE TABLE IF NOT EXISTS mechanic (
    mechanicId INT AUTO_INCREMENT PRIMARY KEY,
    staffId INT NOT NULL,
    mechanicName VARCHAR(50) NOT NULL,
    mechanicCode VARCHAR(20) NOT NULL UNIQUE,
    specialization VARCHAR(255),
    experienceYears INT DEFAULT 0,
    certifications TEXT,
    availability ENUM('Available', 'Busy', 'On Break', 'Off Duty') DEFAULT 'Available',
    hourlyRate DECIMAL(8, 2),
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staffId) REFERENCES staff(staffId) ON DELETE CASCADE
);

-- TEST MECHANIC DATA
INSERT INTO mechanic (staffId, mechanicCode, mechanicName, specialization, experienceYears, certifications, hourlyRate)
VALUES
(4, 'MEC001', 'Sarah', 'Engine and Transmission', 5, '["ASE Certified","Engine Specialist"]', 2500.00),
(5, 'MEC002', 'Bob Mechanic', 'Electrical Systems', 4, '["Auto Electrician"]', 2300.00);

-- =======================================================
-- SPARE PARTS TABLE
-- =======================================================
CREATE TABLE IF NOT EXISTS spareparts (
    partId INT AUTO_INCREMENT PRIMARY KEY,
    partCode VARCHAR(50) NOT NULL UNIQUE,
    partName VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
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
    stockQuantity INT DEFAULT 0,
    mechanicId INT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mechanicId) REFERENCES mechanic(mechanicId) ON DELETE SET NULL
);

-- TEST SPARE PARTS
INSERT INTO spareparts (partCode, partName, description, category, unitPrice, stockQuantity, mechanicId, imageUrl)
VALUES
('ENG001', 'Engine Oil Filter', 'High-performance oil filter for Toyota models', 'Engine', 2500.00, 50, 1, 'images/parts/oil_filter.jpg'),
('BRK002', 'Brake Pads', 'Front brake pad set for sedans', 'Brakes', 5600.00, 30, 1, 'images/parts/brake_pads.jpg'),
('ELC003', 'Car Battery', '12V 60Ah maintenance-free battery', 'Electrical', 18000.00, 15, 2, 'images/parts/battery.jpg'),
('COO004', 'Radiator Coolant', 'Long-life coolant 1L bottle', 'Cooling', 1500.00, 80, 2, 'images/parts/coolant.jpg'),
('TRM005', 'Transmission Belt', 'Automatic transmission drive belt', 'Transmission', 7500.00, 10, 1, 'images/parts/transmission_belt.jpg');

-- =======================================================
-- MECHANIC DETAILS VIEW
-- =======================================================
CREATE OR REPLACE VIEW mechanic_details AS
SELECT 
    m.mechanicId,
    s.staffId,
    m.mechanicCode,
    m.mechanicName,
    s.email,
    m.specialization,
    m.experienceYears AS experience,
    m.certifications,
    m.availability,
    m.hourlyRate,
    m.isActive,
    m.createdAt,
    m.updatedAt
FROM mechanic m
INNER JOIN staff s ON m.staffId = s.staffId
WHERE m.isActive = TRUE;

-- =======================================================
-- JOBCARD TABLES
-- =======================================================
CREATE TABLE IF NOT EXISTS jobcard (
    jobcardId INT AUTO_INCREMENT PRIMARY KEY,
    bookingId INT NOT NULL,
    status ENUM('open', 'in_progress', 'ready_for_review', 'completed', 'canceled') DEFAULT 'open',
    serviceDetails JSON NOT NULL,
    assignedMechanicIds JSON NULL,
    assignedSparePartIds JSON NULL,
    assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completedAt TIMESTAMP NULL,
    FOREIGN KEY (bookingId) REFERENCES booking(bookingId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobcardMechanic (
    jobcardMechanicId INT AUTO_INCREMENT PRIMARY KEY,
    jobcardId INT NOT NULL,
    mechanicId INT NOT NULL,
    assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completedAt TIMESTAMP NULL,
    notes TEXT NULL,
    FOREIGN KEY (jobcardId) REFERENCES jobcard(jobcardId) ON DELETE CASCADE,
    FOREIGN KEY (mechanicId) REFERENCES mechanic(mechanicId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobcardSparePart (
    jobcardSparePartId INT AUTO_INCREMENT PRIMARY KEY,
    jobcardId INT NOT NULL,
    partId INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unitPrice DECIMAL(10, 2) NOT NULL,
    totalPrice DECIMAL(10, 2) NOT NULL,
    assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usedAt TIMESTAMP NULL,
    FOREIGN KEY (jobcardId) REFERENCES jobcard(jobcardId) ON DELETE CASCADE,
    FOREIGN KEY (partId) REFERENCES spareparts(partId) ON DELETE RESTRICT,
    INDEX idx_jobcard_id (jobcardId),
    INDEX idx_part_id (partId)
);

-- =======================================================
-- SERVICES TABLE
-- =======================================================
CREATE TABLE IF NOT EXISTS services (
    serviceId INT AUTO_INCREMENT PRIMARY KEY,
    serviceName VARCHAR(255) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL
);

-- INSERT SERVICE DATA
INSERT INTO services (serviceName, price) VALUES
('Full Service', 15000.00),
('Engine Servicing', 8000.00),
('Transmission Service', 12000.00),
('Oil & Filter Service', 4500.00),
('Body Wash', 1500.00),
('Diagnostic Test', 3000.00),
('Wheel Alignment', 3500.00),
('Vacuum Cleaning', 1200.00);

-- =======================================================
-- E-SHOP TABLE
-- =======================================================
CREATE TABLE IF NOT EXISTS eshop (
    itemId INT AUTO_INCREMENT PRIMARY KEY,
    itemCode VARCHAR(50) NOT NULL UNIQUE,
    itemName VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    discountPercentage DECIMAL(5, 2) DEFAULT 0.00,
    itemImage VARCHAR(500),
    itemBrand ENUM('Toyota', 'Honda', 'Suzuki', 'Ford', 'Mazda', 'Isuzu', 'Subaru') NOT NULL,
    itemType ENUM('Engine Parts', 'Break Parts', 'Suspension', 'Electrical', 'Body Parts', 'Filters', 'Fluids') NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =======================================================
-- INVOICES TABLE
-- =======================================================
CREATE TABLE IF NOT EXISTS invoices (
    invoiceId INT AUTO_INCREMENT PRIMARY KEY,
    invoiceNumber VARCHAR(100) NOT NULL UNIQUE,
    bookingId INT NOT NULL,
    customerId INT NOT NULL,
    invoiceDate DATE NOT NULL,
    currency VARCHAR(10) DEFAULT 'LKR',
    totalAmount DECIMAL(10, 2) NOT NULL,
    laborCost DECIMAL(10, 2) DEFAULT 0,
    partsCost DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    status ENUM('generated', 'finalized') DEFAULT 'generated',
    invoiceData JSON NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bookingId) REFERENCES booking(bookingId) ON DELETE CASCADE,
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE CASCADE
);

-- =======================================================
-- TEST E-SHOP DATA
-- =======================================================
INSERT INTO eshop (itemCode, itemName, description, price, quantity, discountPercentage, itemImage, itemBrand, itemType)
VALUES
('TOY-ENG-001', 'Toyota Engine Oil Filter', 'High-quality oil filter for Toyota vehicles', 2500.00, 50, 5.00, 'images/eshop/toyota_oil_filter.jpg', 'Toyota', 'Filters'),
('HON-BRK-002', 'Honda Brake Pads Set', 'Premium brake pads for Honda models', 4500.00, 30, 0.00, 'images/eshop/honda_brake_pads.jpg', 'Honda', 'Break Parts'),
('SUZ-FLT-003', 'Suzuki Air Filter', 'OEM air filter for Suzuki engines', 1200.00, 40, 10.00, 'images/eshop/suzuki_air_filter.jpg', 'Suzuki', 'Filters'),
('FOR-ENG-004', 'Ford Engine Mount', 'Heavy-duty engine mount for Ford trucks', 8500.00, 15, 0.00, 'images/eshop/ford_engine_mount.jpg', 'Ford', 'Engine Parts'),
('MAZ-SUS-005', 'Mazda Suspension Strut', 'Front suspension strut for Mazda sedans', 12000.00, 20, 15.00, 'images/eshop/mazda_strut.jpg', 'Mazda', 'Suspension'),
('ISU-ELE-006', 'Isuzu Alternator', 'High-output alternator for Isuzu diesel engines', 18000.00, 10, 0.00, 'images/eshop/isuzu_alternator.jpg', 'Isuzu', 'Electrical'),
('SUB-ENG-007', 'Subaru Timing Belt', 'OEM timing belt for Subaru boxer engines', 3500.00, 25, 5.00, 'images/eshop/subaru_timing_belt.jpg', 'Subaru', 'Engine Parts');

-- =======================================================
-- TEST BOOKINGS
-- =======================================================
INSERT INTO booking (
    name, phone, vehicleNumber, vehicleType, fuelType,
    vehicleBrand, vehicleBrandModel, manufacturedYear, transmissionType, 
    kilometersRun, bookingDate, timeSlot, serviceTypes,
    specialRequests, customerId, status, arrivedTime
) VALUES 
('John Smith', '0771234567', 'ABC-123', 'Sedan', 'Petrol', 'Toyota', 'Camry', 2020, 'Automatic', 45000, CURDATE(), '07:30-09:30', JSON_ARRAY('Oil Change', 'Brake Inspection'), 'Please check the air conditioning system', NULL, 'pending', NULL),
('Sarah Johnson', '0777654321', 'XYZ-789', 'SUV', 'Petrol', 'Honda', 'CR-V', 2019, 'Automatic', 52000, CURDATE(), '09:30-11:30', JSON_ARRAY('Engine Service', 'Tire Rotation'), 'Check for any unusual noises', NULL, 'pending', NULL),
('Michael Chen', '0775555555', 'DEF-456', 'Hatchback', 'Petrol', 'Nissan', 'Micra', 2021, 'Manual', 28000, CURDATE(), '12:00-14:00', JSON_ARRAY('Regular Service', 'Battery Check'), 'Replace air filter', NULL, 'arrived', '07:45'),
('Emily Davis', '0778888888', 'GHI-321', 'Sedan', 'Petrol', 'BMW', '3 Series', 2018, 'Automatic', 65000, CURDATE(), '14:00-16:00', JSON_ARRAY('Premium Service', 'Transmission Check'), 'Full diagnostic check', NULL, 'pending', NULL),
('Robert Wilson', '0779999999', 'JKL-654', 'Pickup', 'Diesel', 'Ford', 'Ranger', 2017, 'Manual', 78000, CURDATE(), '16:00-18:00', JSON_ARRAY('Engine Overhaul', 'Clutch Replacement'), 'Customer cancelled due to emergency', NULL, 'cancelled', NULL);

-- =======================================================
-- SERVICES TABLE
-- =======================================================
CREATE TABLE IF NOT EXISTS services (
    serviceId INT AUTO_INCREMENT PRIMARY KEY,
    serviceName VARCHAR(255) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL
);

-- INSERT SERVICE DATA
INSERT IGNORE INTO services (serviceName, price) VALUES
('Full Service', 15000.00),
('Engine Servicing', 8000.00),
('Transmission Service', 12000.00),
('Oil & Filter Service', 4500.00),
('Body Wash', 1500.00),
('Diagnostic Test', 3000.00),
('Wheel Alignment', 3500.00),
('Vacuum Cleaning', 1200.00);