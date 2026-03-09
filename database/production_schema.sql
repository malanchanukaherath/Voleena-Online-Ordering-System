-- =====================================================
-- Voleena Foods - Production Database Schema
-- =====================================================
-- Version: 2.0
-- Date: 2026-02-16
-- Description: Production-ready schema with security hardening,
--              proper indexing, and complete business logic support
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. ROLE & AUTHENTICATION
-- =====================================================

DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
  `role_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uk_role_name` (`role_name`),
  KEY `idx_role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO `role` (`role_name`, `description`) VALUES
('Customer', 'Customer role for placing orders'),
('Admin', 'Administrator with full system access'),
('Cashier', 'Cashier for order management'),
('Kitchen', 'Kitchen staff for order preparation'),
('Delivery', 'Delivery staff for order delivery');

-- =====================================================
-- 2. CUSTOMER MANAGEMENT
-- =====================================================

DROP TABLE IF EXISTS `customer`;
CREATE TABLE `customer` (
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
  `created_by` INT UNSIGNED DEFAULT NULL COMMENT 'Staff ID who created this customer (for manual registration)',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_phone` (`phone`),
  KEY `idx_account_status` (`account_status`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_customer_created_by` FOREIGN KEY (`created_by`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `address`;
CREATE TABLE `address` (
  `address_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` INT UNSIGNED NOT NULL,
  `address_line1` VARCHAR(255) NOT NULL,
  `address_line2` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(100) NOT NULL,
  `postal_code` VARCHAR(10) DEFAULT NULL,
  `district` VARCHAR(100) DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_default` (`customer_id`, `is_default`),
  CONSTRAINT `fk_address_customer` FOREIGN KEY (`customer_id`) 
    REFERENCES `customer` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. STAFF MANAGEMENT
-- =====================================================

DROP TABLE IF EXISTS `staff`;
CREATE TABLE `staff` (
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
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_role` (`role_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `fk_staff_role` FOREIGN KEY (`role_id`) 
    REFERENCES `role` (`role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. MENU & CATEGORY
-- =====================================================

DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
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

DROP TABLE IF EXISTS `menu_item`;
CREATE TABLE `menu_item` (
  `menu_item_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Auto-disabled when stock is zero',
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`menu_item_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_active_available` (`is_active`, `is_available`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_menu_item_category` FOREIGN KEY (`category_id`) 
    REFERENCES `category` (`category_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_menu_item_created_by` FOREIGN KEY (`created_by`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_price_positive` CHECK (`price` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. COMBO PACKS & PROMOTIONS
-- =====================================================

DROP TABLE IF EXISTS `combo_pack`;
CREATE TABLE `combo_pack` (
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
  CONSTRAINT `fk_combo_created_by` FOREIGN KEY (`created_by`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_combo_dates` CHECK (`schedule_end_date` >= `schedule_start_date`),
  CONSTRAINT `chk_combo_price` CHECK (`price` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `combo_pack_item`;
CREATE TABLE `combo_pack_item` (
  `combo_pack_item_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `combo_id` INT UNSIGNED NOT NULL,
  `menu_item_id` INT UNSIGNED NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`combo_pack_item_id`),
  UNIQUE KEY `uk_combo_menu_item` (`combo_id`, `menu_item_id`),
  KEY `idx_menu_item` (`menu_item_id`),
  CONSTRAINT `fk_combo_item_combo` FOREIGN KEY (`combo_id`) 
    REFERENCES `combo_pack` (`combo_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_combo_item_menu` FOREIGN KEY (`menu_item_id`) 
    REFERENCES `menu_item` (`menu_item_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_quantity_positive` CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `promotion`;
CREATE TABLE `promotion` (
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
  CONSTRAINT `fk_promotion_created_by` FOREIGN KEY (`created_by`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_promo_dates` CHECK (`valid_until` >= `valid_from`),
  CONSTRAINT `chk_discount_positive` CHECK (`discount_value` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. STOCK MANAGEMENT
-- =====================================================

DROP TABLE IF EXISTS `daily_stock`;
CREATE TABLE `daily_stock` (
  `stock_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `menu_item_id` INT UNSIGNED NOT NULL,
  `stock_date` DATE NOT NULL,
  `opening_quantity` INT NOT NULL DEFAULT 0,
  `sold_quantity` INT NOT NULL DEFAULT 0,
  `adjusted_quantity` INT NOT NULL DEFAULT 0,
  `closing_quantity` INT GENERATED ALWAYS AS ((`opening_quantity` - `sold_quantity`) + `adjusted_quantity`) STORED,
  `version` INT NOT NULL DEFAULT 0 COMMENT 'Optimistic locking version',
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `last_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stock_id`),
  UNIQUE KEY `uk_item_date` (`menu_item_id`, `stock_date`),
  KEY `idx_stock_date` (`stock_date`),
  KEY `idx_closing_qty` (`closing_quantity`),
  KEY `idx_updated_by` (`updated_by`),
  CONSTRAINT `fk_stock_menu_item` FOREIGN KEY (`menu_item_id`) 
    REFERENCES `menu_item` (`menu_item_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stock_updated_by` FOREIGN KEY (`updated_by`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_stock_valid` CHECK (`closing_quantity` >= 0),
  CONSTRAINT `chk_opening_positive` CHECK (`opening_quantity` >= 0),
  CONSTRAINT `chk_sold_positive` CHECK (`sold_quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stock_movement`;
CREATE TABLE `stock_movement` (
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
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_movement_menu_item` FOREIGN KEY (`menu_item_id`) 
    REFERENCES `menu_item` (`menu_item_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_movement_created_by` FOREIGN KEY (`created_by`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. ORDER MANAGEMENT
-- =====================================================

DROP TABLE IF EXISTS `order`;
CREATE TABLE `order` (
  `order_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(20) NOT NULL,
  `customer_id` INT UNSIGNED DEFAULT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `promotion_id` INT UNSIGNED DEFAULT NULL,
  `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `delivery_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `final_amount` DECIMAL(10, 2) GENERATED ALWAYS AS (GREATEST((`total_amount` - `discount_amount`) + `delivery_fee`, 0)) STORED,
  `status` ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `order_type` ENUM('DELIVERY', 'TAKEAWAY') NOT NULL,
  `special_instructions` VARCHAR(500) DEFAULT NULL,
  `cancellation_reason` TEXT DEFAULT NULL,
  `cancelled_by` ENUM('CUSTOMER', 'ADMIN', 'CASHIER', 'SYSTEM') DEFAULT NULL,
  `confirmed_at` TIMESTAMP NULL DEFAULT NULL,
  `preparing_at` TIMESTAMP NULL DEFAULT NULL,
  `ready_at` TIMESTAMP NULL DEFAULT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `cancelled_at` TIMESTAMP NULL DEFAULT NULL,
  `confirmed_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL COMMENT 'Last staff who updated this order',
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
  CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) 
    REFERENCES `customer` (`customer_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_promotion` FOREIGN KEY (`promotion_id`) 
    REFERENCES `promotion` (`promotion_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_confirmed_by` FOREIGN KEY (`confirmed_by`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_updated_by` FOREIGN KEY (`updated_by`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_total_positive` CHECK (`total_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `order_item`;
CREATE TABLE `order_item` (
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
  CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) 
    REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_item_menu` FOREIGN KEY (`menu_item_id`) 
    REFERENCES `menu_item` (`menu_item_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_item_combo` FOREIGN KEY (`combo_id`) 
    REFERENCES `combo_pack` (`combo_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_item_quantity` CHECK (`quantity` > 0),
  CONSTRAINT `chk_unit_price` CHECK (`unit_price` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `order_status_history`;
CREATE TABLE `order_status_history` (
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
  KEY `idx_changed_by` (`changed_by`),
  CONSTRAINT `fk_history_order` FOREIGN KEY (`order_id`) 
    REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_changed_by` FOREIGN KEY (`changed_by`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. DELIVERY MANAGEMENT
-- =====================================================

DROP TABLE IF EXISTS `delivery`;
CREATE TABLE `delivery` (
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
  `distance_km` DECIMAL(5, 2) DEFAULT NULL COMMENT 'Calculated distance in kilometers',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`delivery_id`),
  UNIQUE KEY `uk_order` (`order_id`),
  KEY `idx_staff` (`delivery_staff_id`),
  KEY `idx_address` (`address_id`),
  KEY `idx_status` (`status`),
  KEY `idx_assigned_at` (`assigned_at`),
  CONSTRAINT `fk_delivery_order` FOREIGN KEY (`order_id`) 
    REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_delivery_staff` FOREIGN KEY (`delivery_staff_id`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_delivery_address` FOREIGN KEY (`address_id`) 
    REFERENCES `address` (`address_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `delivery_staff_availability`;
CREATE TABLE `delivery_staff_availability` (
  `availability_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `delivery_staff_id` INT UNSIGNED NOT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `current_order_id` INT UNSIGNED DEFAULT NULL,
  `last_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`availability_id`),
  UNIQUE KEY `uk_staff` (`delivery_staff_id`),
  KEY `idx_available` (`is_available`),
  KEY `idx_current_order` (`current_order_id`),
  CONSTRAINT `fk_availability_staff` FOREIGN KEY (`delivery_staff_id`) 
    REFERENCES `staff` (`staff_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_availability_order` FOREIGN KEY (`current_order_id`) 
    REFERENCES `order` (`order_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. PAYMENT MANAGEMENT
-- =====================================================

DROP TABLE IF EXISTS `payment`;
CREATE TABLE `payment` (
  `payment_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `method` ENUM('CASH', 'CARD', 'ONLINE', 'WALLET') NOT NULL,
  `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `transaction_id` VARCHAR(100) DEFAULT NULL,
  `gateway_status` VARCHAR(50) DEFAULT NULL COMMENT 'Payment gateway status code',
  `paid_at` TIMESTAMP NULL DEFAULT NULL,
  `refunded_at` TIMESTAMP NULL DEFAULT NULL,
  `refund_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uk_transaction_id` (`transaction_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) 
    REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_amount_positive` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. AUTHENTICATION & SECURITY
-- =====================================================

DROP TABLE IF EXISTS `otp_verification`;
CREATE TABLE `otp_verification` (
  `otp_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_type` ENUM('CUSTOMER', 'STAFF') NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed OTP for security',
  `purpose` ENUM('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN') NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_used` TINYINT(1) NOT NULL DEFAULT 0,
  `attempts` INT NOT NULL DEFAULT 0 COMMENT 'Failed verification attempts',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`otp_id`),
  KEY `idx_user` (`user_type`, `user_id`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_purpose` (`purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `password_reset`;
CREATE TABLE `password_reset` (
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

DROP TABLE IF EXISTS `token_blacklist`;
CREATE TABLE `token_blacklist` (
  `blacklist_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `token_hash` VARCHAR(255) NOT NULL COMMENT 'SHA256 hash of JWT token',
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

-- =====================================================
-- 11. FEEDBACK & NOTIFICATIONS
-- =====================================================

DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
  `feedback_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `rating` INT NOT NULL,
  `comment` VARCHAR(1000) DEFAULT NULL,
  `customer_id` INT UNSIGNED NOT NULL,
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
  CONSTRAINT `fk_feedback_customer` FOREIGN KEY (`customer_id`) 
    REFERENCES `customer` (`customer_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_order` FOREIGN KEY (`order_id`) 
    REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_responded_by` FOREIGN KEY (`responded_by`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_rating_range` CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification` (
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
  KEY `idx_related_order` (`related_order_id`),
  CONSTRAINT `fk_notification_order` FOREIGN KEY (`related_order_id`) 
    REFERENCES `order` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. AUDIT & LOGGING
-- =====================================================

DROP TABLE IF EXISTS `activity_log`;
CREATE TABLE `activity_log` (
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

-- =====================================================
-- 13. SYSTEM SETTINGS
-- =====================================================

DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `setting_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`),
  KEY `idx_updated_by` (`updated_by`),
  CONSTRAINT `fk_settings_updated_by` FOREIGN KEY (`updated_by`) 
    REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('max_delivery_distance_km', '15', 'Maximum delivery distance in kilometers'),
('restaurant_latitude', '7.0000000', 'Restaurant location latitude'),
('restaurant_longitude', '80.0000000', 'Restaurant location longitude'),
('order_auto_cancel_minutes', '30', 'Auto-cancel unconfirmed orders after minutes'),
('session_timeout_minutes', '30', 'User session timeout in minutes'),
('min_order_amount', '500', 'Minimum order amount in LKR'),
('delivery_fee', '150', 'Standard delivery fee in LKR'),
('tax_percentage', '0', 'Tax percentage on orders'),
('otp_expiry_minutes', '10', 'OTP expiry time in minutes'),
('max_otp_attempts', '3', 'Maximum OTP verification attempts');

-- =====================================================
-- 14. INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_order_customer_status ON `order` (`customer_id`, `status`, `created_at`);
CREATE INDEX idx_order_status_type_created ON `order` (`status`, `order_type`, `created_at`);
CREATE INDEX idx_stock_item_date ON `daily_stock` (`menu_item_id`, `stock_date`, `closing_quantity`);
CREATE INDEX idx_delivery_staff_status ON `delivery` (`delivery_staff_id`, `status`, `assigned_at`);

-- =====================================================
-- 15. TRIGGERS FOR AUTO-DISABLE MENU ITEMS
-- =====================================================

DELIMITER $$

CREATE TRIGGER `trg_auto_disable_menu_item`
AFTER UPDATE ON `daily_stock`
FOR EACH ROW
BEGIN
  IF NEW.closing_quantity = 0 AND OLD.closing_quantity > 0 THEN
    UPDATE `menu_item` 
    SET `is_available` = 0 
    WHERE `menu_item_id` = NEW.menu_item_id;
  ELSEIF NEW.closing_quantity > 0 AND OLD.closing_quantity = 0 THEN
    UPDATE `menu_item` 
    SET `is_available` = 1 
    WHERE `menu_item_id` = NEW.menu_item_id;
  END IF;
END$$

DELIMITER ;

-- =====================================================
-- 16. VIEWS FOR REPORTING
-- =====================================================

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
  SUM(CASE WHEN order_type = 'TAKEAWAY' THEN 1 ELSE 0 END) AS takeaway_orders
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
LEFT JOIN `daily_stock` ds ON mi.menu_item_id = ds.menu_item_id 
  AND ds.stock_date = CURDATE();

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
