-- Script to add itemCode column to existing eshop table
-- Run this after updating the db_setup.sql file

USE vehicle_service_db;

-- Add itemCode column to existing eshop table
ALTER TABLE eshop ADD COLUMN itemCode VARCHAR(50) NOT NULL UNIQUE AFTER itemId;

-- Update existing records with itemCodes
UPDATE eshop SET itemCode = 'TOY-ENG-001' WHERE itemName = 'Toyota Engine Oil Filter';
UPDATE eshop SET itemCode = 'HON-BRK-002' WHERE itemName = 'Honda Brake Pads Set';
UPDATE eshop SET itemCode = 'SUZ-FLT-003' WHERE itemName = 'Suzuki Air Filter';
UPDATE eshop SET itemCode = 'FOR-ENG-004' WHERE itemName = 'Ford Engine Mount';
UPDATE eshop SET itemCode = 'MAZ-SUS-005' WHERE itemName = 'Mazda Suspension Strut';
UPDATE eshop SET itemCode = 'ISU-ELE-006' WHERE itemName = 'Isuzu Alternator';
UPDATE eshop SET itemCode = 'SUB-ENG-007' WHERE itemName = 'Subaru Timing Belt';

SELECT 'itemCode column added and populated successfully' AS status;