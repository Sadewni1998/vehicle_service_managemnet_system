-- Vehicle Service Management System Database Setup
-- Updated: October 7, 2025
-- Database optimized with vehicle registration enforcement and service tracking

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `vehicle_service_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `vehicle_service_db`;

-- Table structure for table `customer`
DROP TABLE IF EXISTS `customer`;
CREATE TABLE `customer` (
  `customerId` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `googleId` varchar(255) DEFAULT NULL,
  `provider` varchar(50) NOT NULL DEFAULT 'local',
  PRIMARY KEY (`customerId`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `googleId` (`googleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `customer` (`customerId`, `name`, `email`, `password`, `phone`, `address`, `createdAt`, `googleId`, `provider`) VALUES
(9, 'Mohamed Jaazil', 'jaazilmohamed@gmail.com', NULL, NULL, NULL, '2025-10-05 19:27:13', '108572695670782779719', 'google'),
(10, 'jaazil@gmail.com', 'jaazil@gmail.com', '$2b$10$D1j1tHSg6foF.dPfdGDzke9rjQURXMCgaEwEcbcFk.Zq94Nw0JLEq', '0712345678', 'jk', '2025-10-05 20:21:23', NULL, 'local'),
(11, 'Test User', 'test@example.com', '$2b$10$o84vdPwIZNY0XJ9pp2GLRujEVT83Y8xVuojugDHIUQjCkJhx7WChC', NULL, NULL, '2025-10-05 21:14:49', NULL, 'local'),
(12, 'kj@mail.com', 'kj@mail.com', '$2b$10$nrySnheWjRwBqR2dleJ6Aez8ilfFdRQNLQ7a7u7uolmiml5gSymtS', '0712345678', 'kj@mail.com', '2025-10-05 21:33:38', NULL, 'local');

-- Table structure for table `vehicle`
DROP TABLE IF EXISTS `vehicle`;
CREATE TABLE `vehicle` (
  `vehicleId` int(11) NOT NULL AUTO_INCREMENT,
  `customerId` int(11) NOT NULL,
  `vehicleNumber` varchar(100) NOT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `manufactureYear` int(11) DEFAULT NULL,
  `fuelType` varchar(50) DEFAULT NULL,
  `transmission` varchar(50) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`vehicleId`),
  UNIQUE KEY `vehicleNumber` (`vehicleNumber`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `vehicle_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`customerId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

<<<<<<< Updated upstream
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
=======
INSERT INTO `vehicle` (`vehicleId`, `customerId`, `vehicleNumber`, `brand`, `model`, `type`, `manufactureYear`, `fuelType`, `transmission`, `createdAt`) VALUES
(11, 10, 'SDR-9875', 'Unknown', 'Unknown', 'Unknown', 2020, 'Unknown', 'Unknown', '2025-10-07 06:59:35'),
(12, 10, 'LIK-7890', 'TOYOTA', 'SUV', 'JEEP', 1990, 'ELECTRIC', 'MANUAL', '2025-10-07 07:33:22');
>>>>>>> Stashed changes

-- Table structure for table `booking`
DROP TABLE IF EXISTS `booking`;
CREATE TABLE `booking` (
  `bookingId` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `vehicleId` int(11) NOT NULL,
  `vehicleNumber` varchar(100) NOT NULL,
  `vehicleType` varchar(100) DEFAULT NULL,
  `fuelType` varchar(50) DEFAULT NULL,
  `vehicleBrand` varchar(100) DEFAULT NULL,
  `vehicleBrandModel` varchar(100) DEFAULT NULL,
  `manufacturedYear` year(4) DEFAULT NULL,
  `transmissionType` varchar(50) DEFAULT NULL,
  `bookingDate` date NOT NULL,
  `timeSlot` varchar(100) NOT NULL,
  `serviceTypes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`serviceTypes`)),
  `specialRequests` text DEFAULT NULL,
  `status` enum('Pending','Confirmed','In Progress','Completed','Cancelled','arrived') DEFAULT 'Pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `customerId` int(11) DEFAULT NULL,
  `approvedBy` int(11) DEFAULT NULL,
  `approvedAt` timestamp NULL DEFAULT NULL,
  `declinedBy` int(11) DEFAULT NULL,
  `declinedAt` timestamp NULL DEFAULT NULL,
  `approvalStatus` enum('Pending','Approved','Declined') DEFAULT 'Pending',
  `declineReason` text DEFAULT NULL,
  `arrivedTime` time DEFAULT NULL,
  PRIMARY KEY (`bookingId`),
  KEY `vehicleId` (`vehicleId`),
  KEY `customerId` (`customerId`),
  KEY `approvedBy` (`approvedBy`),
  KEY `declinedBy` (`declinedBy`),
  KEY `bookingDate` (`bookingDate`),
  CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle` (`vehicleId`) ON DELETE CASCADE,
  CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`customerId`) REFERENCES `customer` (`customerId`) ON DELETE SET NULL,
  CONSTRAINT `booking_ibfk_3` FOREIGN KEY (`approvedBy`) REFERENCES `staff` (`staffId`) ON DELETE SET NULL,
  CONSTRAINT `booking_ibfk_4` FOREIGN KEY (`declinedBy`) REFERENCES `staff` (`staffId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `booking` (`bookingId`, `name`, `phone`, `vehicleId`, `vehicleNumber`, `vehicleType`, `fuelType`, `vehicleBrand`, `vehicleBrandModel`, `manufacturedYear`, `transmissionType`, `bookingDate`, `timeSlot`, `serviceTypes`, `specialRequests`, `status`, `createdAt`, `updatedAt`, `customerId`, `approvedBy`, `approvedAt`, `declinedBy`, `declinedAt`, `approvalStatus`, `declineReason`, `arrivedTime`) VALUES
(36, 'jaazil@gmail.com', '0712345678', 11, 'SDR-9875', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07', '02:00 PM - 04:00 PM', '["fullservice"]', '', 'Pending', '2025-10-07 06:59:35', '2025-10-07 06:59:35', 10, NULL, NULL, NULL, NULL, 'Pending', NULL, NULL),
(37, 'jaazil@gmail.com', '0712345678', 12, 'LIK-7890', 'JEEP', 'ELECTRIC', 'TOYOTA', 'SUV', 1990, 'MANUAL', '2025-10-07', '04:00 PM - 06:00 PM', '["wash","diagnostic"]', '', 'Pending', '2025-10-07 07:34:39', '2025-10-07 07:34:39', 10, NULL, NULL, NULL, NULL, 'Pending', NULL, NULL);

-- Table structure for table `staff`
DROP TABLE IF EXISTS `staff`;
CREATE TABLE `staff` (
  `staffId` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('receptionist','mechanic','manager','service_advisor') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`staffId`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `staff` (`staffId`, `name`, `email`, `password`, `role`, `createdAt`, `updatedAt`) VALUES
(4, 'Chinthaka Herath', 'service_advicer@vehicleservice.com', '$2b$10$6NkoMNcWBjifArTW5hfryuJPPLIwfZpaIPbhso7XuU2toEP17wWXe', 'service_advisor', '2025-10-06 06:22:27', '2025-10-06 06:30:10'),
(6, 'Receptionist', 'receptionist@vehicleservice.com', '$2b$10$MOOmKWRYOlT8w.bRO.4lq.MxVPT9wlpaTbLJBFnEORPj9MoA1v3zu', 'receptionist', '2025-10-06 06:51:01', '2025-10-06 07:33:37'),
(7, 'Mechanic', 'mechanic@vehicleservice.com', '$2b$10$NlhlnAzMEEcZn4eZa1wO3uqzZmmSk6xqUZSmIvP60gv2EoKs8pr2K', 'mechanic', '2025-10-06 06:51:01', '2025-10-06 07:26:47'),
(8, 'Manager', 'manager@vehicleservice.com', '$2b$10$0emTWCs9TR36WJRnhgKtU.8bvB00iLhgYU373PcYx5S0WaRFUXye2', 'manager', '2025-10-06 06:51:01', '2025-10-06 07:38:58');

-- Table structure for table `mechanic`
DROP TABLE IF EXISTS `mechanic`;
CREATE TABLE `mechanic` (
  `mechanicId` int(11) NOT NULL AUTO_INCREMENT,
  `staffId` int(11) NOT NULL,
  `mechanicCode` varchar(20) NOT NULL,
  `specialization` varchar(255) DEFAULT NULL,
  `experienceYears` int(11) DEFAULT 0,
  `certifications` text DEFAULT NULL,
  `availability` enum('Available','Busy','On Break','Off Duty') DEFAULT 'Available',
  `hourlyRate` decimal(8,2) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`mechanicId`),
  UNIQUE KEY `mechanicCode` (`mechanicCode`),
  KEY `staffId` (`staffId`),
  KEY `specialization` (`specialization`),
  KEY `availability` (`availability`),
  KEY `isActive` (`isActive`),
  CONSTRAINT `mechanic_ibfk_1` FOREIGN KEY (`staffId`) REFERENCES `staff` (`staffId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `mechanic` (`mechanicId`, `staffId`, `mechanicCode`, `specialization`, `experienceYears`, `certifications`, `availability`, `hourlyRate`, `isActive`, `createdAt`, `updatedAt`) VALUES
(2, 7, 'MEC002', 'General Automotive Repair', 3, 'Basic Automotive Certificate', 'Available', '35.00', 1, '2025-10-06 11:30:36', '2025-10-06 11:30:36');

-- Table structure for table `jobcard`
DROP TABLE IF EXISTS `jobcard`;
CREATE TABLE `jobcard` (
  `jobcardId` int(11) NOT NULL AUTO_INCREMENT,
  `mechanicId` int(11) NOT NULL,
  `bookingId` int(11) NOT NULL,
  `status` enum('Open','In Progress','Ready for Review','Completed','Canceled') DEFAULT 'Open',
  `serviceDetails` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`serviceDetails`)),
  `assignedDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `startedAt` timestamp NULL DEFAULT NULL,
  `completedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`jobcardId`),
  KEY `mechanicId` (`mechanicId`),
  KEY `bookingId` (`bookingId`),
  CONSTRAINT `jobcard_ibfk_1` FOREIGN KEY (`mechanicId`) REFERENCES `mechanic` (`mechanicId`) ON DELETE CASCADE,
  CONSTRAINT `jobcard_ibfk_2` FOREIGN KEY (`bookingId`) REFERENCES `booking` (`bookingId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `spareparts`
DROP TABLE IF EXISTS `spareparts`;
CREATE TABLE `spareparts` (
  `partId` int(11) NOT NULL AUTO_INCREMENT,
  `partCode` varchar(50) NOT NULL,
  `partName` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` enum('Engine','Electrical','Body','Suspension','Brakes','Cooling','Transmission','Interior','Exterior','Accessories') NOT NULL,
  `unitPrice` decimal(10,2) NOT NULL,
  `imageUrl` varchar(500) DEFAULT NULL,
  `stockQuantity` int(11) DEFAULT 0,
  `mechanicId` int(11) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`partId`),
  UNIQUE KEY `partCode` (`partCode`),
  KEY `category` (`category`),
  KEY `mechanicId` (`mechanicId`),
  KEY `isActive` (`isActive`),
  CONSTRAINT `spareparts_ibfk_1` FOREIGN KEY (`mechanicId`) REFERENCES `mechanic` (`mechanicId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `spareparts` (`partId`, `partCode`, `partName`, `description`, `category`, `unitPrice`, `imageUrl`, `stockQuantity`, `mechanicId`, `isActive`, `createdAt`, `updatedAt`) VALUES
(1, 'ENG001', 'Oil Filter', 'High-quality oil filter for regular maintenance', 'Engine', '25.99', '/img/parts/oil-filter.jpg', 50, 1, 1, '2025-10-06 11:23:21', '2025-10-06 11:46:03'),
(2, 'ENG002', 'Air Filter', 'Air filter for improved engine performance', 'Engine', '35.50', '/img/parts/air-filter.jpg', 30, 1, 1, '2025-10-06 11:23:21', '2025-10-06 11:46:03'),
(3, 'ENG003', 'Spark Plug Set', 'Set of 4 spark plugs for gasoline engines', 'Engine', '89.99', '/img/parts/spark-plugs.jpg', 25, 1, 1, '2025-10-06 11:23:21', '2025-10-06 11:46:03'),
(4, 'ENG004', 'Engine Oil', 'Premium synthetic engine oil 5W-30', 'Engine', '45.00', '/img/parts/engine-oil.jpg', 60, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(5, 'BRK001', 'Brake Pads', 'High-performance ceramic brake pads', 'Brakes', '75.50', '/img/parts/brake-pads.jpg', 40, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(6, 'BRK002', 'Brake Discs', 'Ventilated brake discs for improved cooling', 'Brakes', '120.00', '/img/parts/brake-discs.jpg', 20, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(7, 'ELE001', 'Car Battery', '12V maintenance-free car battery', 'Electrical', '85.00', '/img/parts/car-battery.jpg', 15, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(8, 'ELE002', 'Headlight Bulb', 'LED headlight bulb H7', 'Electrical', '25.00', '/img/parts/headlight-bulb.jpg', 35, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(9, 'SUS001', 'Shock Absorber', 'Front shock absorber for sedans', 'Suspension', '95.00', '/img/parts/shock-absorber.jpg', 25, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(10, 'SUS002', 'Coil Spring', 'Heavy-duty coil spring', 'Suspension', '65.00', '/img/parts/coil-spring.jpg', 30, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(11, 'TRN001', 'Transmission Filter', 'Automatic transmission filter', 'Transmission', '35.00', '/img/parts/transmission-filter.jpg', 20, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(12, 'TRN002', 'Transmission Fluid', 'ATF transmission fluid 1L', 'Transmission', '15.50', '/img/parts/transmission-fluid.jpg', 45, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(13, 'COL001', 'Radiator', 'Aluminum radiator for cooling system', 'Cooling', '180.00', '/img/parts/radiator.jpg', 10, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(14, 'COL002', 'Coolant', 'Engine coolant 5L', 'Cooling', '20.00', '/img/parts/coolant.jpg', 40, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(15, 'BOD001', 'Door Handle', 'Exterior door handle - right side', 'Body', '45.00', '/img/parts/door-handle.jpg', 15, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(16, 'BOD002', 'Side Mirror', 'Power-adjustable side mirror', 'Body', '85.00', '/img/parts/side-mirror.jpg', 12, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(17, 'INT001', 'Floor Mats', 'All-weather rubber floor mats set', 'Interior', '35.00', '/img/parts/floor-mats.jpg', 25, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(18, 'INT002', 'Seat Covers', 'Premium leather seat covers', 'Interior', '120.00', '/img/parts/seat-covers.jpg', 8, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(19, 'EXT001', 'Tire 205/55R16', 'All-season tire 205/55R16', 'Exterior', '75.00', '/img/parts/tire.jpg', 30, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(20, 'EXT002', 'Wiper Blades', 'Premium wiper blades set', 'Exterior', '25.00', '/img/parts/wiper-blades.jpg', 35, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(21, 'EXT003', 'Car Wax', 'Premium car wax for paint protection', 'Exterior', '18.00', '/img/parts/car-wax.jpg', 50, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(22, 'ACC001', 'Tool Kit', 'Basic automotive tool kit', 'Accessories', '49.99', '/img/parts/tool-kit.jpg', 40, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21'),
(23, 'ACC002', 'Phone Mount', 'Dashboard phone mount', 'Accessories', '24.99', '/img/parts/phone-mount.jpg', 50, NULL, 1, '2025-10-06 11:23:21', '2025-10-06 11:23:21');

-- Table structure for table `breakdown_request`
DROP TABLE IF EXISTS `breakdown_request`;
CREATE TABLE `breakdown_request` (
  `requestId` int(11) NOT NULL AUTO_INCREMENT,
  `customerId` int(11) DEFAULT NULL,
  `vehicleId` int(11) DEFAULT NULL,
  `emergencyType` varchar(255) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `problemDescription` text DEFAULT NULL,
  `additionalInfo` text DEFAULT NULL,
  `status` enum('Pending','Approved','In Progress','Completed','Cancelled') DEFAULT 'Pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `contactName` varchar(255) DEFAULT NULL,
  `contactPhone` varchar(20) DEFAULT NULL,
  `vehicleNumber` varchar(100) DEFAULT NULL,
  `vehicleType` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`requestId`),
  KEY `customerId` (`customerId`),
  KEY `vehicleId` (`vehicleId`),
  CONSTRAINT `breakdown_request_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`customerId`) ON DELETE SET NULL,
  CONSTRAINT `breakdown_request_ibfk_2` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle` (`vehicleId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `breakdown_request` (`requestId`, `customerId`, `vehicleId`, `emergencyType`, `latitude`, `longitude`, `problemDescription`, `additionalInfo`, `status`, `createdAt`, `updatedAt`, `contactName`, `contactPhone`, `vehicleNumber`, `vehicleType`) VALUES
(6, NULL, NULL, 'overheating', 6.35070480, 81.00919540, 'hui', 'iuh', 'Pending', '2025-10-06 09:47:19', '2025-10-06 09:47:19', 'testing', '0712345678', '45678', 'mini car/ kei car'),
(7, NULL, NULL, 'engine failure', 1.31425560, 103.70930990, 'njn', '', 'Pending', '2025-10-06 12:50:16', '2025-10-06 12:50:16', 'mjm jaazil', '0712345678', 'tg-0016', 'suv'),
(8, NULL, NULL, 'other', 1.31425560, 103.70930990, 'hiii', '', 'Pending', '2025-10-06 12:57:40', '2025-10-06 12:57:40', 'kallan', '0712345678', '45678', 'van'),
(9, NULL, NULL, 'other', 6.35070480, 81.00919540, 'ji', 'hy', 'Pending', '2025-10-06 16:00:38', '2025-10-06 16:00:38', 'mjm jaazil', '0712345678', 'tg-0016', 'wagon'),
(10, NULL, NULL, 'transmission issue', 6.35070480, 81.00919540, 'tire', '', 'Pending', '2025-10-06 17:08:55', '2025-10-06 17:08:55', 'uththari', '0712345678', 'e66666', 'mini car/ kei car'),
(11, NULL, NULL, 'flat tire', 6.35070480, 81.00919540, 'rhyth', '', 'Pending', '2025-10-06 18:17:20', '2025-10-06 18:17:20', 'gggg', '0712345678', 'tg-0016', 'sedan');

-- Table structure for table `contact_submissions`
DROP TABLE IF EXISTS `contact_submissions`;
CREATE TABLE `contact_submissions` (
  `submissionId` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `isRead` tinyint(1) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`submissionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `contact_submissions` (`submissionId`, `name`, `email`, `subject`, `message`, `isRead`, `createdAt`) VALUES
(3, 'mjm jaazil', 'mjm@gmail.com', 'hi', 'hiii', 0, '2025-10-06 09:46:21'),
(4, 'hi', 'mjm@gmail.com', 'nkj', 'nlkn', 0, '2025-10-06 12:50:36');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;