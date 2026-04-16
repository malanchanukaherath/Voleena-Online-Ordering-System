-- =====================================================
-- Voleena Foods - Safe Schema Sync (up to v2.4)
-- Non-destructive, idempotent, Workbench-friendly
-- =====================================================
-- Purpose:
-- 1) Create only missing core tables used by auth/login
-- 2) Apply migration deltas from v2.1, v2.2, v2.3, v2.4
-- 3) Preserve existing correct data and structures
-- =====================================================

SET NAMES utf8mb4;
SET @db := DATABASE();

START TRANSACTION;

-- =====================================================
-- 0) Core auth tables (create only if missing)
-- =====================================================

CREATE TABLE IF NOT EXISTS `role` (
  `role_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uk_role_name` (`role_name`),
  KEY `idx_role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `staff` (
  `staff_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `role_id` INT UNSIGNED NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(15) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `profile_image_url` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `uk_staff_email` (`email`),
  KEY `idx_staff_role` (`role_id`),
  KEY `idx_staff_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer` (
  `customer_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(15) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `profile_image_url` VARCHAR(255) DEFAULT NULL,
  `is_email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `is_phone_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `account_status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `preferred_notification` ENUM('EMAIL', 'SMS', 'BOTH') NOT NULL DEFAULT 'BOTH',
  `internal_notes` TEXT DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `uk_customer_email` (`email`),
  KEY `idx_customer_phone` (`phone`),
  KEY `idx_customer_account_status` (`account_status`),
  KEY `idx_customer_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `address` (
  `address_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` INT UNSIGNED NOT NULL,
  `address_line1` VARCHAR(255) NOT NULL,
  `address_line2` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(100) NOT NULL,
  `postal_code` VARCHAR(10) DEFAULT NULL,
  `district` VARCHAR(100) DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `idx_address_customer` (`customer_id`),
  KEY `idx_address_city` (`city`),
  KEY `idx_address_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add staff.role FK if missing
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'staff'
    AND CONSTRAINT_NAME = 'fk_staff_role'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE `staff` ADD CONSTRAINT `fk_staff_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`) ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add customer.created_by FK if missing
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'customer'
    AND CONSTRAINT_NAME = 'fk_customer_created_by'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE `customer` ADD CONSTRAINT `fk_customer_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'address'
    AND CONSTRAINT_NAME = 'fk_address_customer'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE `address` ADD CONSTRAINT `fk_address_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Seed default roles safely
INSERT INTO `role` (`role_name`, `description`)
SELECT 'Customer', 'Customer role for placing orders'
WHERE NOT EXISTS (SELECT 1 FROM `role` WHERE `role_name` = 'Customer');

INSERT INTO `role` (`role_name`, `description`)
SELECT 'Admin', 'Administrator with full system access'
WHERE NOT EXISTS (SELECT 1 FROM `role` WHERE `role_name` = 'Admin');

INSERT INTO `role` (`role_name`, `description`)
SELECT 'Cashier', 'Cashier for order management'
WHERE NOT EXISTS (SELECT 1 FROM `role` WHERE `role_name` = 'Cashier');

INSERT INTO `role` (`role_name`, `description`)
SELECT 'Kitchen', 'Kitchen staff for order preparation'
WHERE NOT EXISTS (SELECT 1 FROM `role` WHERE `role_name` = 'Kitchen');

INSERT INTO `role` (`role_name`, `description`)
SELECT 'Delivery', 'Delivery staff for order delivery'
WHERE NOT EXISTS (SELECT 1 FROM `role` WHERE `role_name` = 'Delivery');

-- =====================================================
-- 1) v2.1 performance/index migration (safe)
-- =====================================================

-- payment indexes
SET @tbl_exists := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'payment');
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'payment' AND INDEX_NAME = 'idx_payment_transaction_id');
SET @sql := IF(@tbl_exists = 1 AND @idx_exists = 0, 'CREATE INDEX `idx_payment_transaction_id` ON `payment` (`transaction_id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'payment' AND INDEX_NAME = 'idx_payment_created_at');
SET @sql := IF(@tbl_exists = 1 AND @idx_exists = 0, 'CREATE INDEX `idx_payment_created_at` ON `payment` (`created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- order indexes
SET @tbl_exists := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order');
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND INDEX_NAME = 'idx_order_status_created');
SET @sql := IF(@tbl_exists = 1 AND @idx_exists = 0, 'CREATE INDEX `idx_order_status_created` ON `order` (`status`, `created_at` DESC)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- delivery indexes
SET @tbl_exists := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'delivery');
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'delivery' AND INDEX_NAME = 'idx_delivery_staff_status');
SET @sql := IF(@tbl_exists = 1 AND @idx_exists = 0, 'CREATE INDEX `idx_delivery_staff_status` ON `delivery` (`delivery_staff_id`, `status`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- daily_stock indexes
SET @tbl_exists := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'daily_stock');
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'daily_stock' AND INDEX_NAME = 'idx_stock_menu_date');
SET @sql := IF(@tbl_exists = 1 AND @idx_exists = 0, 'CREATE INDEX `idx_stock_menu_date` ON `daily_stock` (`menu_item_id`, `stock_date`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- delivery_assignment_log table
CREATE TABLE IF NOT EXISTS `delivery_assignment_log` (
  `assignment_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `assigned_staff_id` INT UNSIGNED NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `active_deliveries` INT DEFAULT 0,
  `completion_time` DECIMAL(10, 2) DEFAULT 0,
  `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_staff` (`assigned_staff_id`),
  KEY `idx_assigned_at` (`assigned_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'delivery_assignment_log'
    AND CONSTRAINT_NAME = 'fk_assignment_order'
);
SET @order_tbl_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'order'
);
SET @sql := IF(
  @fk_exists = 0 AND @order_tbl_exists = 1,
  'ALTER TABLE `delivery_assignment_log` ADD CONSTRAINT `fk_assignment_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'delivery_assignment_log'
    AND CONSTRAINT_NAME = 'fk_assignment_staff'
);
SET @staff_tbl_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'staff'
);
SET @sql := IF(
  @fk_exists = 0 AND @staff_tbl_exists = 1,
  'ALTER TABLE `delivery_assignment_log` ADD CONSTRAINT `fk_assignment_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- password_reset.is_used hardening
SET @tbl_exists := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'password_reset');
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'password_reset' AND COLUMN_NAME = 'is_used');
SET @sql := IF(@tbl_exists = 1 AND @col_exists = 1, 'ALTER TABLE `password_reset` MODIFY COLUMN `is_used` TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2) v2.2 live delivery location migration (safe)
-- =====================================================

SET @tbl_exists := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'delivery');

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'delivery' AND COLUMN_NAME = 'current_latitude');
SET @sql := IF(@tbl_exists = 1 AND @col_exists = 0, 'ALTER TABLE `delivery` ADD COLUMN `current_latitude` DECIMAL(10,8) NULL COMMENT ''Current latitude of delivery rider''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'delivery' AND COLUMN_NAME = 'current_longitude');
SET @sql := IF(@tbl_exists = 1 AND @col_exists = 0, 'ALTER TABLE `delivery` ADD COLUMN `current_longitude` DECIMAL(11,8) NULL COMMENT ''Current longitude of delivery rider''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'delivery' AND COLUMN_NAME = 'last_location_update');
SET @sql := IF(@tbl_exists = 1 AND @col_exists = 0, 'ALTER TABLE `delivery` ADD COLUMN `last_location_update` DATETIME NULL COMMENT ''Last time location was updated''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'delivery' AND INDEX_NAME = 'idx_delivery_location_update');
SET @sql := IF(@tbl_exists = 1 AND @idx_exists = 0, 'CREATE INDEX `idx_delivery_location_update` ON `delivery` (`last_location_update` DESC)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================================================
-- 3) v2.3 walk-in orders migration (safe)
-- =====================================================

SET @tbl_exists := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order');
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND COLUMN_NAME = 'order_type');

SET @needs_expand := (
  SELECT CASE
    WHEN @tbl_exists = 0 THEN 0
    WHEN @col_exists = 0 THEN 0
    WHEN LOWER(COLUMN_TYPE) NOT LIKE '%online%' OR LOWER(COLUMN_TYPE) NOT LIKE '%walk_in%' THEN 1
    ELSE 0
  END
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'order'
    AND COLUMN_NAME = 'order_type'
  LIMIT 1
);

SET @sql := CASE
  WHEN @tbl_exists = 1 AND @col_exists = 0 THEN
    'ALTER TABLE `order` ADD COLUMN `order_type` ENUM(''ONLINE'', ''DELIVERY'', ''TAKEAWAY'', ''WALK_IN'') NOT NULL DEFAULT ''ONLINE'' AFTER `status`'
  WHEN @tbl_exists = 1 AND @needs_expand = 1 THEN
    'ALTER TABLE `order` MODIFY COLUMN `order_type` ENUM(''ONLINE'', ''DELIVERY'', ''TAKEAWAY'', ''WALK_IN'') NOT NULL'
  ELSE
    'SELECT 1'
END;
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Seed reusable walk-in customer
INSERT INTO `customer` (
  `name`, `email`, `phone`, `password`,
  `is_email_verified`, `is_phone_verified`, `is_active`,
  `account_status`, `preferred_notification`, `internal_notes`
)
SELECT
  'Walk-in Customer',
  NULL,
  '7000000000',
  SHA2(CONCAT('walkin-', UUID()), 256),
  0, 0, 1,
  'ACTIVE',
  'SMS',
  'System-generated guest profile for cashier walk-in orders'
WHERE NOT EXISTS (
  SELECT 1 FROM `customer` WHERE `name` = 'Walk-in Customer' AND `phone` = '7000000000'
);

-- =====================================================
-- 4) v2.4 email verification migration (safe)
-- =====================================================

CREATE TABLE IF NOT EXISTS `email_verification_token` (
  `email_verification_token_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email_verification_token_id`),
  UNIQUE KEY `uk_email_verification_token_hash` (`token_hash`),
  KEY `idx_email_verification_customer` (`customer_id`, `used_at`, `created_at`),
  KEY `idx_email_verification_expiry` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'email_verification_token'
    AND CONSTRAINT_NAME = 'fk_email_verification_customer'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE `email_verification_token` ADD CONSTRAINT `fk_email_verification_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================================================
-- 5) Cascade fix migration (safe)
-- feedback.customer_id should be ON DELETE SET NULL
-- =====================================================

SET @tbl_exists := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'feedback');
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'feedback' AND COLUMN_NAME = 'customer_id');

SET @sql := IF(@tbl_exists = 1 AND @col_exists = 1, 'ALTER TABLE `feedback` MODIFY COLUMN `customer_id` INT UNSIGNED NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_name := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'feedback'
    AND COLUMN_NAME = 'customer_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @sql := IF(@tbl_exists = 1 AND @fk_name IS NOT NULL, CONCAT('ALTER TABLE `feedback` DROP FOREIGN KEY `', @fk_name, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'feedback'
    AND CONSTRAINT_NAME = 'fk_feedback_customer'
);
SET @sql := IF(
  @tbl_exists = 1 AND @fk_exists = 0,
  'ALTER TABLE `feedback` ADD CONSTRAINT `fk_feedback_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'feedback' AND INDEX_NAME = 'idx_feedback_created_at');
SET @sql := IF(@tbl_exists = 1 AND @idx_exists = 0, 'CREATE INDEX `idx_feedback_created_at` ON `feedback`(`created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================================================
-- 6) In-app notifications migration (safe)
-- =====================================================

CREATE TABLE IF NOT EXISTS `app_notification` (
  `app_notification_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `recipient_type` ENUM('CUSTOMER','STAFF') NOT NULL,
  `recipient_id` INT UNSIGNED NOT NULL,
  `recipient_role` ENUM('CUSTOMER','ADMIN','CASHIER','KITCHEN','DELIVERY','STAFF') DEFAULT NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `payload_json` JSON DEFAULT NULL,
  `priority` ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `read_at` DATETIME DEFAULT NULL,
  `related_order_id` INT UNSIGNED DEFAULT NULL,
  `dedupe_key` VARCHAR(191) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`app_notification_id`),
  UNIQUE KEY `uk_app_notif_dedupe_key` (`dedupe_key`),
  KEY `idx_app_notif_recipient_unread_created` (`recipient_type`, `recipient_id`, `is_read`, `created_at`),
  KEY `idx_app_notif_role_unread_created` (`recipient_role`, `is_read`, `created_at`),
  KEY `idx_app_notif_related_order_created` (`related_order_id`, `created_at`),
  KEY `idx_app_notif_event_created` (`event_type`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @tbl_exists := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'app_notification');
SET @order_tbl_exists := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order');
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'app_notification'
    AND CONSTRAINT_NAME = 'fk_app_notif_order'
);
SET @sql := IF(
  @tbl_exists = 1 AND @order_tbl_exists = 1 AND @fk_exists = 0,
  'ALTER TABLE `app_notification` ADD CONSTRAINT `fk_app_notif_order` FOREIGN KEY (`related_order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

COMMIT;

-- =====================================================
-- 7) Verification queries
-- =====================================================

SELECT 'customer table exists' AS check_name, COUNT(*) AS ok
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer';

SELECT 'staff table exists' AS check_name, COUNT(*) AS ok
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff';

SELECT 'role table exists' AS check_name, COUNT(*) AS ok
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role';

SELECT 'app_notification table exists' AS check_name, COUNT(*) AS ok
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_notification';

SELECT role_name FROM role ORDER BY role_name;
