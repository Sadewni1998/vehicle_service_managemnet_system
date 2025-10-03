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
    engineNumber VARCHAR(100),
    vehicleType VARCHAR(100),
    fuelType VARCHAR(50),
    vehicleBrand VARCHAR(100),
    vehicleBrandModel VARCHAR(100),
    manufacturedYear YEAR,
    transmissionType VARCHAR(50),
    oilType VARCHAR(100),
    oilFilterType VARCHAR(100),
    kilometersRun INT,
    bookingDate DATE NOT NULL,
    
    -- We use the JSON data type to store the array of selected services.
    -- This is perfect for handling multiple checkbox selections.
    serviceTypes JSON, 
    
    specialRequests TEXT,
    promoCode VARCHAR(50),
    
    -- It's good practice to have a status for the booking
    status ENUM('Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Optional: If a booking is made by a logged-in user, we can link it
    customerId INT NULL,
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE SET NULL
);