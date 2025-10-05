-- Create staff table for receptionist and other staff members
USE vehicle_service_db;

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
    staffId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('receptionist', 'mechanic', 'manager', 'service_advisor') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert test receptionist credentials
-- Password is hashed for 'receptionist123'
INSERT INTO staff (name, email, password, role) VALUES 
('Test Receptionist', 'receptionist@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'receptionist'),
('John Manager', 'manager@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager'),
('Sarah Mechanic', 'mechanic@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mechanic');

-- Insert some test bookings for today
INSERT INTO booking (name, phone, vehicleNumber, vehicleType, fuelType, vehicleBrand, vehicleBrandModel, manufacturedYear, transmissionType, kilometersRun, bookingDate, timeSlot, serviceTypes, specialRequests, status) VALUES 
('John Smith', '1234567890', 'ABC-123', 'Sedan', 'Petrol', 'Toyota', 'Camry', 2020, 'Automatic', 50000, CURDATE(), '07:30 AM - 09:00 AM', '["Oil Change", "Brake Service"]', 'Please check air filter', 'pending'),
('Sarah Johnson', '0987654321', 'XYZ-789', 'SUV', 'Diesel', 'Honda', 'CR-V', 2019, 'Manual', 75000, CURDATE(), '09:00 AM - 10:30 AM', '["Engine Tune-up"]', 'Engine making strange noise', 'pending'),
('Mike Davis', '1122334455', 'DEF-456', 'Hatchback', 'Petrol', 'Ford', 'Focus', 2021, 'Automatic', 30000, CURDATE(), '10:30 AM - 12:00 PM', '["Tire Rotation", "Oil Change"]', 'None', 'arrived'),
('Emily Wilson', '5566778899', 'GHI-321', 'Sedan', 'Petrol', 'Nissan', 'Altima', 2018, 'CVT', 90000, CURDATE(), '12:30 PM - 02:00 PM', '["Brake Service"]', 'Brakes squeaking', 'pending'),
('Robert Brown', '9988776655', 'JKL-654', 'SUV', 'Diesel', 'Hyundai', 'Tucson', 2020, 'Automatic', 60000, CURDATE(), '02:00 PM - 03:30 PM', '["Engine Tune-up", "Oil Change"]', 'None', 'cancelled');

-- Show the created staff members
SELECT * FROM staff;

-- Show today's bookings
SELECT * FROM booking WHERE DATE(bookingDate) = CURDATE();
