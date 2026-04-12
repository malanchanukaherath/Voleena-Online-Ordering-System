-- =====================================================
-- Voleena Foods - Safe Full Schema Completion (v2.4)
-- Non-destructive, idempotent, data-preserving
-- =====================================================

SET NAMES utf8mb4;
SET @db := DATABASE();

START TRANSACTION;

-- =====================================================
-- 1) Core role/staff/customer foundation
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

-- Roles seed (idempotent)
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

-- FKs for foundation tables
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'staff' AND CONSTRAINT_NAME = 'fk_staff_role'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE `staff` ADD CONSTRAINT `fk_staff_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db AND TABLE_NAME = 'customer' AND CONSTRAINT_NAME = 'fk_customer_created_by'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE `customer` ADD CONSTRAINT `fk_customer_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2) Menu, category, combos, promotions
-- =====================================================

CREATE TABLE IF NOT EXISTS `category` (
  `category_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_active_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `menu_item` (
  `menu_item_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`menu_item_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_active_available` (`is_active`, `is_available`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `chk_price_positive` CHECK (`price` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `combo_pack` (
  `combo_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `discount_type` ENUM('PERCENTAGE', 'FIXED_PRICE') NOT NULL DEFAULT 'FIXED_PRICE',
  `discount_value` DECIMAL(10, 2) DEFAULT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `schedule_start_date` DATE DEFAULT NULL,
  `schedule_end_date` DATE DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`combo_id`),
  KEY `idx_active_schedule` (`is_active`, `schedule_start_date`, `schedule_end_date`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `chk_combo_dates` CHECK (`schedule_end_date` >= `schedule_start_date`),
  CONSTRAINT `chk_combo_price` CHECK (`price` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `combo_pack_item` (
  `combo_pack_item_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `combo_id` INT UNSIGNED NOT NULL,
  `menu_item_id` INT UNSIGNED NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`combo_pack_item_id`),
  UNIQUE KEY `uk_combo_menu_item` (`combo_id`, `menu_item_id`),
  KEY `idx_menu_item` (`menu_item_id`),
  CONSTRAINT `chk_quantity_positive` CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promotion` (
  `promotion_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `discount_type` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
  `discount_value` DECIMAL(10, 2) NOT NULL,
  `min_order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `max_discount_amount` DECIMAL(10, 2) DEFAULT NULL,
  `valid_from` DATETIME NOT NULL,
  `valid_until` DATETIME NOT NULL,
  `usage_limit` INT DEFAULT NULL,
  `usage_count` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`promotion_id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_active_dates` (`is_active`, `valid_from`, `valid_until`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `chk_promo_dates` CHECK (`valid_until` >= `valid_from`),
  CONSTRAINT `chk_discount_positive` CHECK (`discount_value` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3) Stock and orders
-- =====================================================

CREATE TABLE IF NOT EXISTS `daily_stock` (
  `stock_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `menu_item_id` INT UNSIGNED NOT NULL,
  `stock_date` DATE NOT NULL,
  `opening_quantity` INT NOT NULL DEFAULT 0,
  `sold_quantity` INT NOT NULL DEFAULT 0,
  `adjusted_quantity` INT NOT NULL DEFAULT 0,
  `closing_quantity` INT GENERATED ALWAYS AS ((`opening_quantity` - `sold_quantity`) + `adjusted_quantity`) STORED,
  `version` INT NOT NULL DEFAULT 0,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `last_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stock_id`),
  UNIQUE KEY `uk_item_date` (`menu_item_id`, `stock_date`),
  KEY `idx_stock_date` (`stock_date`),
  KEY `idx_closing_qty` (`closing_quantity`),
  KEY `idx_updated_by` (`updated_by`),
  CONSTRAINT `chk_stock_valid` CHECK (`closing_quantity` >= 0),
  CONSTRAINT `chk_opening_positive` CHECK (`opening_quantity` >= 0),
  CONSTRAINT `chk_sold_positive` CHECK (`sold_quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_movement` (
  `movement_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `menu_item_id` INT UNSIGNED NOT NULL,
  `stock_date` DATE NOT NULL,
  `change_type` ENUM('OPENING', 'SALE', 'ADJUSTMENT', 'RETURN') NOT NULL,
  `quantity_change` INT NOT NULL,
  `reference_id` INT UNSIGNED DEFAULT NULL,
  `reference_type` ENUM('ORDER', 'MANUAL', 'SYSTEM') DEFAULT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`movement_id`),
  KEY `idx_menu_item` (`menu_item_id`),
  KEY `idx_stock_date` (`stock_date`),
  KEY `idx_change_type` (`change_type`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order` (
  `order_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(20) NOT NULL,
  `customer_id` INT UNSIGNED DEFAULT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `promotion_id` INT UNSIGNED DEFAULT NULL,
  `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `delivery_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `final_amount` DECIMAL(10, 2) GENERATED ALWAYS AS (GREATEST((`total_amount` - `discount_amount`) + `delivery_fee`, 0)) STORED,
  `status` ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `order_type` ENUM('ONLINE', 'DELIVERY', 'TAKEAWAY', 'WALK_IN') NOT NULL DEFAULT 'ONLINE',
  `special_instructions` VARCHAR(500) DEFAULT NULL,
  `cancellation_reason` TEXT DEFAULT NULL,
  `cancelled_by` ENUM('CUSTOMER', 'ADMIN', 'CASHIER', 'SYSTEM') DEFAULT NULL,
  `confirmed_at` TIMESTAMP NULL DEFAULT NULL,
  `preparing_at` TIMESTAMP NULL DEFAULT NULL,
  `ready_at` TIMESTAMP NULL DEFAULT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `cancelled_at` TIMESTAMP NULL DEFAULT NULL,
  `confirmed_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `uk_order_number` (`order_number`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_status_type` (`status`, `order_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_promotion` (`promotion_id`),
  KEY `idx_confirmed_by` (`confirmed_by`),
  KEY `idx_updated_by` (`updated_by`),
  CONSTRAINT `chk_total_positive` CHECK (`total_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_item` (
  `order_item_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `menu_item_id` INT UNSIGNED DEFAULT NULL,
  `combo_id` INT UNSIGNED DEFAULT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `subtotal` DECIMAL(10, 2) GENERATED ALWAYS AS (`quantity` * `unit_price`) STORED,
  `item_notes` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_menu_item` (`menu_item_id`),
  KEY `idx_combo` (`combo_id`),
  CONSTRAINT `chk_item_quantity` CHECK (`quantity` > 0),
  CONSTRAINT `chk_unit_price` CHECK (`unit_price` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_status_history` (
  `history_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `old_status` ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') DEFAULT NULL,
  `new_status` ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') NOT NULL,
  `changed_by` INT UNSIGNED DEFAULT NULL,
  `changed_by_type` ENUM('CUSTOMER', 'STAFF', 'SYSTEM') NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_changed_by` (`changed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4) Delivery and payment
-- =====================================================

CREATE TABLE IF NOT EXISTS `delivery` (
  `delivery_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `delivery_staff_id` INT UNSIGNED DEFAULT NULL,
  `address_id` INT UNSIGNED NOT NULL,
  `status` ENUM('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `assigned_at` TIMESTAMP NULL DEFAULT NULL,
  `picked_up_at` TIMESTAMP NULL DEFAULT NULL,
  `delivered_at` TIMESTAMP NULL DEFAULT NULL,
  `estimated_delivery_time` DATETIME DEFAULT NULL,
  `delivery_proof` VARCHAR(255) DEFAULT NULL,
  `delivery_notes` TEXT DEFAULT NULL,
  `failure_reason` TEXT DEFAULT NULL,
  `distance_km` DECIMAL(5, 2) DEFAULT NULL,
  `current_latitude` DECIMAL(10,8) NULL,
  `current_longitude` DECIMAL(11,8) NULL,
  `last_location_update` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`delivery_id`),
  UNIQUE KEY `uk_order` (`order_id`),
  KEY `idx_staff` (`delivery_staff_id`),
  KEY `idx_address` (`address_id`),
  KEY `idx_status` (`status`),
  KEY `idx_assigned_at` (`assigned_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_staff_availability` (
  `availability_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `delivery_staff_id` INT UNSIGNED NOT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `current_order_id` INT UNSIGNED DEFAULT NULL,
  `last_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`availability_id`),
  UNIQUE KEY `uk_staff` (`delivery_staff_id`),
  KEY `idx_available` (`is_available`),
  KEY `idx_current_order` (`current_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment` (
  `payment_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `method` ENUM('CASH', 'CARD', 'ONLINE', 'WALLET') NOT NULL,
  `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `transaction_id` VARCHAR(100) DEFAULT NULL,
  `gateway_status` VARCHAR(50) DEFAULT NULL,
  `paid_at` TIMESTAMP NULL DEFAULT NULL,
  `refunded_at` TIMESTAMP NULL DEFAULT NULL,
  `refund_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uk_transaction_id` (`transaction_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `chk_amount_positive` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5) Security and support tables
-- =====================================================

CREATE TABLE IF NOT EXISTS `otp_verification` (
  `otp_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_type` ENUM('CUSTOMER', 'STAFF') NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL,
  `purpose` ENUM('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN') NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_used` TINYINT(1) NOT NULL DEFAULT 0,
  `attempts` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`otp_id`),
  KEY `idx_user` (`user_type`, `user_id`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_purpose` (`purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_reset` (
  `reset_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_type` ENUM('CUSTOMER', 'STAFF') NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `reset_token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_used` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`reset_id`),
  KEY `idx_token` (`reset_token`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `token_blacklist` (
  `blacklist_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `token_hash` VARCHAR(255) NOT NULL,
  `user_type` ENUM('CUSTOMER', 'STAFF') NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `reason` ENUM('LOGOUT', 'PASSWORD_CHANGE', 'SECURITY', 'ADMIN_REVOKE') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`blacklist_id`),
  UNIQUE KEY `uk_token_hash` (`token_hash`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_user` (`user_type`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `feedback` (
  `feedback_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `rating` INT NOT NULL,
  `comment` VARCHAR(1000) DEFAULT NULL,
  `customer_id` INT UNSIGNED NULL,
  `order_id` INT UNSIGNED DEFAULT NULL,
  `feedback_type` ENUM('ORDER', 'DELIVERY', 'GENERAL') NOT NULL DEFAULT 'ORDER',
  `admin_response` TEXT DEFAULT NULL,
  `responded_at` TIMESTAMP NULL DEFAULT NULL,
  `responded_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feedback_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_rating` (`rating`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_responded_by` (`responded_by`),
  CONSTRAINT `chk_rating_range` CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notification` (
  `notification_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `recipient_type` ENUM('CUSTOMER', 'STAFF') NOT NULL,
  `recipient_id` INT UNSIGNED NOT NULL,
  `notification_type` ENUM('EMAIL', 'SMS', 'PUSH') NOT NULL,
  `subject` VARCHAR(255) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `sent_at` TIMESTAMP NULL DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `related_order_id` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_recipient` (`recipient_type`, `recipient_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_related_order` (`related_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_log` (
  `log_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_type` ENUM('CUSTOMER', 'STAFF', 'SYSTEM') NOT NULL,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) DEFAULT NULL,
  `entity_id` INT UNSIGNED DEFAULT NULL,
  `details` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_user` (`user_type`, `user_id`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`),
  KEY `idx_updated_by` (`updated_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_assignment_log` (
  `assignment_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `assigned_staff_id` INT UNSIGNED NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `active_deliveries` INT DEFAULT 0,
  `completion_time` DECIMAL(10,2) DEFAULT 0,
  `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_staff` (`assigned_staff_id`),
  KEY `idx_assigned_at` (`assigned_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- =====================================================
-- 6) Foreign keys (only if both tables exist)
-- =====================================================

-- helper pattern repeated for predictable idempotency

-- menu_item
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='menu_item' AND CONSTRAINT_NAME='fk_menu_item_category');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='menu_item');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='category');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `menu_item` ADD CONSTRAINT `fk_menu_item_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='menu_item' AND CONSTRAINT_NAME='fk_menu_item_created_by');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `menu_item` ADD CONSTRAINT `fk_menu_item_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- combo tables
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='combo_pack' AND CONSTRAINT_NAME='fk_combo_created_by');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='combo_pack');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `combo_pack` ADD CONSTRAINT `fk_combo_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='combo_pack_item' AND CONSTRAINT_NAME='fk_combo_item_combo');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='combo_pack_item');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='combo_pack');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `combo_pack_item` ADD CONSTRAINT `fk_combo_item_combo` FOREIGN KEY (`combo_id`) REFERENCES `combo_pack` (`combo_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='combo_pack_item' AND CONSTRAINT_NAME='fk_combo_item_menu');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='menu_item');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `combo_pack_item` ADD CONSTRAINT `fk_combo_item_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- promotion
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='promotion' AND CONSTRAINT_NAME='fk_promotion_created_by');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='promotion');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `promotion` ADD CONSTRAINT `fk_promotion_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- stock
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='daily_stock' AND CONSTRAINT_NAME='fk_stock_menu_item');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='daily_stock');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='menu_item');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `daily_stock` ADD CONSTRAINT `fk_stock_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='daily_stock' AND CONSTRAINT_NAME='fk_stock_updated_by');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `daily_stock` ADD CONSTRAINT `fk_stock_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='stock_movement' AND CONSTRAINT_NAME='fk_movement_menu_item');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='stock_movement');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='menu_item');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `stock_movement` ADD CONSTRAINT `fk_movement_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='stock_movement' AND CONSTRAINT_NAME='fk_movement_created_by');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `stock_movement` ADD CONSTRAINT `fk_movement_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- order and related
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='order' AND CONSTRAINT_NAME='fk_order_customer');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='customer');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `order` ADD CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='order' AND CONSTRAINT_NAME='fk_order_promotion');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='promotion');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `order` ADD CONSTRAINT `fk_order_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotion` (`promotion_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='order' AND CONSTRAINT_NAME='fk_order_confirmed_by');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `order` ADD CONSTRAINT `fk_order_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='order' AND CONSTRAINT_NAME='fk_order_updated_by');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `order` ADD CONSTRAINT `fk_order_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='order_item' AND CONSTRAINT_NAME='fk_order_item_order');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_item');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `order_item` ADD CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='order_item' AND CONSTRAINT_NAME='fk_order_item_menu');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='menu_item');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `order_item` ADD CONSTRAINT `fk_order_item_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='order_item' AND CONSTRAINT_NAME='fk_order_item_combo');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='combo_pack');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `order_item` ADD CONSTRAINT `fk_order_item_combo` FOREIGN KEY (`combo_id`) REFERENCES `combo_pack` (`combo_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='order_status_history' AND CONSTRAINT_NAME='fk_history_order');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_status_history');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `order_status_history` ADD CONSTRAINT `fk_history_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='order_status_history' AND CONSTRAINT_NAME='fk_history_changed_by');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `order_status_history` ADD CONSTRAINT `fk_history_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- delivery related
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='delivery' AND CONSTRAINT_NAME='fk_delivery_order');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='delivery');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `delivery` ADD CONSTRAINT `fk_delivery_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='delivery' AND CONSTRAINT_NAME='fk_delivery_staff');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `delivery` ADD CONSTRAINT `fk_delivery_staff` FOREIGN KEY (`delivery_staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='delivery' AND CONSTRAINT_NAME='fk_delivery_address');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='address');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `delivery` ADD CONSTRAINT `fk_delivery_address` FOREIGN KEY (`address_id`) REFERENCES `address` (`address_id`) ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='delivery_staff_availability' AND CONSTRAINT_NAME='fk_availability_staff');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='delivery_staff_availability');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `delivery_staff_availability` ADD CONSTRAINT `fk_availability_staff` FOREIGN KEY (`delivery_staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='delivery_staff_availability' AND CONSTRAINT_NAME='fk_availability_order');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `delivery_staff_availability` ADD CONSTRAINT `fk_availability_order` FOREIGN KEY (`current_order_id`) REFERENCES `order` (`order_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- payment and feedback/notification/settings/migration FKs
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='payment' AND CONSTRAINT_NAME='fk_payment_order');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='payment');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `payment` ADD CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='feedback' AND CONSTRAINT_NAME='fk_feedback_customer');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='feedback');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='customer');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `feedback` ADD CONSTRAINT `fk_feedback_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='feedback' AND CONSTRAINT_NAME='fk_feedback_order');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `feedback` ADD CONSTRAINT `fk_feedback_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='feedback' AND CONSTRAINT_NAME='fk_feedback_responded_by');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `feedback` ADD CONSTRAINT `fk_feedback_responded_by` FOREIGN KEY (`responded_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='notification' AND CONSTRAINT_NAME='fk_notification_order');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='notification');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `notification` ADD CONSTRAINT `fk_notification_order` FOREIGN KEY (`related_order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='system_settings' AND CONSTRAINT_NAME='fk_settings_updated_by');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='system_settings');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `system_settings` ADD CONSTRAINT `fk_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='delivery_assignment_log' AND CONSTRAINT_NAME='fk_assignment_order');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='delivery_assignment_log');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `delivery_assignment_log` ADD CONSTRAINT `fk_assignment_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='delivery_assignment_log' AND CONSTRAINT_NAME='fk_assignment_staff');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='staff');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `delivery_assignment_log` ADD CONSTRAINT `fk_assignment_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='email_verification_token' AND CONSTRAINT_NAME='fk_email_verification_customer');
SET @t1 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='email_verification_token');
SET @t2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=@db AND TABLE_NAME='customer');
SET @sql := IF(@fk_exists=0 AND @t1=1 AND @t2=1, 'ALTER TABLE `email_verification_token` ADD CONSTRAINT `fk_email_verification_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================================================
-- 7) Migration/index deltas and defaults
-- =====================================================

-- v2.1 + base performance indexes
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='payment' AND INDEX_NAME='idx_payment_transaction_id');
SET @sql := IF(@idx_exists=0, 'CREATE INDEX `idx_payment_transaction_id` ON `payment` (`transaction_id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='payment' AND INDEX_NAME='idx_payment_created_at');
SET @sql := IF(@idx_exists=0, 'CREATE INDEX `idx_payment_created_at` ON `payment` (`created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order' AND INDEX_NAME='idx_order_status_created');
SET @sql := IF(@idx_exists=0, 'CREATE INDEX `idx_order_status_created` ON `order` (`status`, `created_at` DESC)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order' AND INDEX_NAME='idx_order_customer_status');
SET @sql := IF(@idx_exists=0, 'CREATE INDEX `idx_order_customer_status` ON `order` (`customer_id`, `status`, `created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order' AND INDEX_NAME='idx_order_status_type_created');
SET @sql := IF(@idx_exists=0, 'CREATE INDEX `idx_order_status_type_created` ON `order` (`status`, `order_type`, `created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='daily_stock' AND INDEX_NAME='idx_stock_item_date');
SET @sql := IF(@idx_exists=0, 'CREATE INDEX `idx_stock_item_date` ON `daily_stock` (`menu_item_id`, `stock_date`, `closing_quantity`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='daily_stock' AND INDEX_NAME='idx_stock_menu_date');
SET @sql := IF(@idx_exists=0, 'CREATE INDEX `idx_stock_menu_date` ON `daily_stock` (`menu_item_id`, `stock_date`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='delivery' AND INDEX_NAME='idx_delivery_staff_status');
SET @sql := IF(@idx_exists=0, 'CREATE INDEX `idx_delivery_staff_status` ON `delivery` (`delivery_staff_id`, `status`, `assigned_at`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='delivery' AND INDEX_NAME='idx_delivery_location_update');
SET @sql := IF(@idx_exists=0, 'CREATE INDEX `idx_delivery_location_update` ON `delivery` (`last_location_update` DESC)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='feedback' AND INDEX_NAME='idx_feedback_created_at');
SET @sql := IF(@idx_exists=0, 'CREATE INDEX `idx_feedback_created_at` ON `feedback` (`created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- v2.3 walk-in guest customer seed
INSERT INTO `customer` (
  `name`, `email`, `phone`, `password`, `is_email_verified`, `is_phone_verified`, `is_active`, `account_status`, `preferred_notification`, `internal_notes`
)
SELECT
  'Walk-in Customer', NULL, '7000000000', SHA2(CONCAT('walkin-', UUID()), 256), 0, 0, 1, 'ACTIVE', 'SMS',
  'System-generated guest profile for cashier walk-in orders'
WHERE NOT EXISTS (
  SELECT 1 FROM `customer` WHERE `name`='Walk-in Customer' AND `phone`='7000000000'
);

-- default system settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
SELECT 'max_delivery_distance_km', '15', 'Maximum delivery distance in kilometers'
WHERE NOT EXISTS (SELECT 1 FROM `system_settings` WHERE `setting_key`='max_delivery_distance_km');
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
SELECT 'restaurant_latitude', '7.0000000', 'Restaurant location latitude'
WHERE NOT EXISTS (SELECT 1 FROM `system_settings` WHERE `setting_key`='restaurant_latitude');
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
SELECT 'restaurant_longitude', '80.0000000', 'Restaurant location longitude'
WHERE NOT EXISTS (SELECT 1 FROM `system_settings` WHERE `setting_key`='restaurant_longitude');
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
SELECT 'order_auto_cancel_minutes', '30', 'Auto-cancel unconfirmed orders after minutes'
WHERE NOT EXISTS (SELECT 1 FROM `system_settings` WHERE `setting_key`='order_auto_cancel_minutes');
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
SELECT 'session_timeout_minutes', '30', 'User session timeout in minutes'
WHERE NOT EXISTS (SELECT 1 FROM `system_settings` WHERE `setting_key`='session_timeout_minutes');
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
SELECT 'min_order_amount', '500', 'Minimum order amount in LKR'
WHERE NOT EXISTS (SELECT 1 FROM `system_settings` WHERE `setting_key`='min_order_amount');
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
SELECT 'delivery_fee', '150', 'Standard delivery fee in LKR'
WHERE NOT EXISTS (SELECT 1 FROM `system_settings` WHERE `setting_key`='delivery_fee');
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
SELECT 'tax_percentage', '0', 'Tax percentage on orders'
WHERE NOT EXISTS (SELECT 1 FROM `system_settings` WHERE `setting_key`='tax_percentage');
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
SELECT 'otp_expiry_minutes', '10', 'OTP expiry time in minutes'
WHERE NOT EXISTS (SELECT 1 FROM `system_settings` WHERE `setting_key`='otp_expiry_minutes');
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
SELECT 'max_otp_attempts', '3', 'Maximum OTP verification attempts'
WHERE NOT EXISTS (SELECT 1 FROM `system_settings` WHERE `setting_key`='max_otp_attempts');

-- =====================================================
-- 8) In-app notifications table (safe)
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

-- =====================================================
-- 9) Trigger and views
-- =====================================================

DROP TRIGGER IF EXISTS `trg_auto_disable_menu_item`;

DELIMITER $$
CREATE TRIGGER `trg_auto_disable_menu_item`
AFTER UPDATE ON `daily_stock`
FOR EACH ROW
BEGIN
  IF NEW.closing_quantity = 0 AND OLD.closing_quantity > 0 THEN
    UPDATE `menu_item` SET `is_available` = 0 WHERE `menu_item_id` = NEW.menu_item_id;
  ELSEIF NEW.closing_quantity > 0 AND OLD.closing_quantity = 0 THEN
    UPDATE `menu_item` SET `is_available` = 1 WHERE `menu_item_id` = NEW.menu_item_id;
  END IF;
END$$
DELIMITER ;

-- Views: attempt creation after tables exist
CREATE OR REPLACE VIEW `v_active_orders` AS
SELECT 
  o.order_id,
  o.order_number,
  o.customer_id,
  c.name AS customer_name,
  c.phone AS customer_phone,
  o.status,
  o.order_type,
  o.final_amount,
  o.created_at,
  d.delivery_staff_id,
  s.name AS delivery_staff_name
FROM `order` o
LEFT JOIN `customer` c ON o.customer_id = c.customer_id
LEFT JOIN `delivery` d ON o.order_id = d.order_id
LEFT JOIN `staff` s ON d.delivery_staff_id = s.staff_id
WHERE o.status NOT IN ('DELIVERED', 'CANCELLED');

CREATE OR REPLACE VIEW `v_daily_sales` AS
SELECT 
  DATE(created_at) AS sale_date,
  COUNT(*) AS total_orders,
  SUM(final_amount) AS total_revenue,
  AVG(final_amount) AS avg_order_value,
  SUM(CASE WHEN order_type = 'DELIVERY' THEN 1 ELSE 0 END) AS delivery_orders,
  SUM(CASE WHEN order_type = 'TAKEAWAY' OR order_type = 'WALK_IN' OR order_type = 'ONLINE' THEN 1 ELSE 0 END) AS non_delivery_orders
FROM `order`
WHERE status = 'DELIVERED'
GROUP BY DATE(created_at);

CREATE OR REPLACE VIEW `v_menu_availability` AS
SELECT 
  mi.menu_item_id,
  mi.name,
  mi.price,
  c.name AS category_name,
  mi.is_active,
  mi.is_available,
  COALESCE(ds.closing_quantity, 0) AS current_stock
FROM `menu_item` mi
LEFT JOIN `category` c ON mi.category_id = c.category_id
LEFT JOIN `daily_stock` ds ON mi.menu_item_id = ds.menu_item_id AND ds.stock_date = CURDATE();

COMMIT;

-- =====================================================
-- 10) Verification
-- =====================================================

SELECT 'menu_item exists' AS check_name, COUNT(*) AS ok
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_item';

SELECT 'combo_pack exists' AS check_name, COUNT(*) AS ok
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'combo_pack';

SELECT 'order exists' AS check_name, COUNT(*) AS ok
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order';

SELECT 'app_notification exists' AS check_name, COUNT(*) AS ok
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_notification';
