-- ============================================================
-- ORDERFLOW - SECURE TEST USER SEED DATA
-- ============================================================
-- Purpose: Create test users for authentication and RBAC testing
-- Security: All passwords are bcrypt-hashed (10 rounds)
-- Plain password for all users: Test@123
-- ============================================================

USE orderflow_db;

-- Ensure Customer role exists
INSERT IGNORE INTO Role (RoleName, Description) VALUES
('Customer', 'Customer account with order placement privileges');

-- ============================================================
-- TEST USERS - STAFF (Admin, Cashier, Kitchen, Delivery)
-- ============================================================

-- Admin Staff
INSERT INTO Staff (Name, RoleID, Email, Phone, Password, IsActive, HireDate)
VALUES (
    'Admin Test User',
    (SELECT RoleID FROM Role WHERE RoleName = 'Admin'),
    'admin@test.com',
    '0771111111',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhQy',
    TRUE,
    CURDATE()
)
ON DUPLICATE KEY UPDATE Email = 'admin@test.com';

-- Cashier Staff
INSERT INTO Staff (Name, RoleID, Email, Phone, Password, IsActive, HireDate)
VALUES (
    'Cashier Test User',
    (SELECT RoleID FROM Role WHERE RoleName = 'Cashier'),
    'cashier@test.com',
    '0772222222',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhQy',
    TRUE,
    CURDATE()
)
ON DUPLICATE KEY UPDATE Email = 'cashier@test.com';

-- Kitchen Staff
INSERT INTO Staff (Name, RoleID, Email, Phone, Password, IsActive, HireDate)
VALUES (
    'Kitchen Test User',
    (SELECT RoleID FROM Role WHERE RoleName = 'Kitchen'),
    'kitchen@test.com',
    '0773333333',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhQy',
    TRUE,
    CURDATE()
)
ON DUPLICATE KEY UPDATE Email = 'kitchen@test.com';

-- Delivery Staff
INSERT INTO Staff (Name, RoleID, Email, Phone, Password, IsActive, HireDate)
VALUES (
    'Delivery Test User',
    (SELECT RoleID FROM Role WHERE RoleName = 'Delivery'),
    'delivery@test.com',
    '0774444444',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhQy',
    TRUE,
    CURDATE()
)
ON DUPLICATE KEY UPDATE Email = 'delivery@test.com';

-- ============================================================
-- TEST USERS - CUSTOMER
-- ============================================================

INSERT INTO Customer (Name, Email, Phone, Password, AccountStatus, IsEmailVerified, IsPhoneVerified)
VALUES (
    'Customer Test User',
    'customer@test.com',
    '0775555555',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhQy',
    'ACTIVE',
    TRUE,
    TRUE
)
ON DUPLICATE KEY UPDATE Email = 'customer@test.com';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify all test users were created
SELECT 'STAFF USERS' as Type;
SELECT s.StaffID, s.Name, s.Email, r.RoleName, s.IsActive
FROM Staff s
JOIN Role r ON s.RoleID = r.RoleID
WHERE s.Email LIKE '%@test.com'
ORDER BY r.RoleName;

SELECT 'CUSTOMER USERS' as Type;
SELECT CustomerID, Name, Email, AccountStatus, IsEmailVerified
FROM Customer
WHERE Email LIKE '%@test.com';

-- ============================================================
-- LOGIN CREDENTIALS FOR TESTING
-- ============================================================
-- Email: admin@test.com      | Password: Test@123 | Role: Admin
-- Email: cashier@test.com    | Password: Test@123 | Role: Cashier
-- Email: kitchen@test.com    | Password: Test@123 | Role: Kitchen
-- Email: delivery@test.com   | Password: Test@123 | Role: Delivery
-- Email: customer@test.com   | Password: Test@123 | Role: Customer
-- ============================================================
