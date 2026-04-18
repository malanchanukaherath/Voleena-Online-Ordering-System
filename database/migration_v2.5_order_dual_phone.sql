-- =====================================================
-- v2.5 Safe migration: dual customer phone snapshots on orders
-- =====================================================
-- Purpose:
-- 1) contact_phone: phone entered at checkout for this order
-- 2) verified_profile_phone: customer's verified profile phone at order time

SET @db := DATABASE();
START TRANSACTION;

-- Add contact_phone if it does not exist
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'order'
    AND COLUMN_NAME = 'contact_phone'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `order` ADD COLUMN `contact_phone` VARCHAR(20) NULL AFTER `customer_id`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add verified_profile_phone if it does not exist
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'order'
    AND COLUMN_NAME = 'verified_profile_phone'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `order` ADD COLUMN `verified_profile_phone` VARCHAR(20) NULL AFTER `contact_phone`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;
