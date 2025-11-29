-- =======================================================
-- E-SHOP ORDERS TABLE
-- =======================================================
USE vehicle_service_db;

CREATE TABLE IF NOT EXISTS eshop_orders (
    orderId INT AUTO_INCREMENT PRIMARY KEY,
    orderNumber VARCHAR(100) NOT NULL UNIQUE,
    customerId INT NOT NULL,
    items JSON NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    paymentMethod ENUM('paypal', 'visa', 'mastercard') NOT NULL,
    billingAddress JSON NULL,
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE CASCADE,
    INDEX idx_customer_id (customerId),
    INDEX idx_order_number (orderNumber),
    INDEX idx_status (status)
);

