-- Migration: Walk-in order support for cashier operations
-- Version: 2.3
-- Description:
--   1) Ensure order.order_type supports WALK_IN and ONLINE while preserving legacy values
--   2) Seed a reusable guest customer for walk-in orders

START TRANSACTION;

SET @db_name = DATABASE();

-- 1) Ensure order_type column exists and supports ONLINE/DELIVERY/TAKEAWAY/WALK_IN
SET @order_type_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'order'
    AND COLUMN_NAME = 'order_type'
);

SET @needs_order_type_expand = (
  SELECT CASE
    WHEN @order_type_exists = 0 THEN 0
    WHEN LOWER(COLUMN_TYPE) NOT LIKE '%online%' OR LOWER(COLUMN_TYPE) NOT LIKE '%walk_in%' THEN 1
    ELSE 0
  END
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'order'
    AND COLUMN_NAME = 'order_type'
  LIMIT 1
);

SET @sql_order_type = CASE
  WHEN @order_type_exists = 0 THEN
    'ALTER TABLE `order` ADD COLUMN `order_type` ENUM(''ONLINE'', ''DELIVERY'', ''TAKEAWAY'', ''WALK_IN'') NOT NULL DEFAULT ''ONLINE'' AFTER `status`'
  WHEN @needs_order_type_expand = 1 THEN
    'ALTER TABLE `order` MODIFY COLUMN `order_type` ENUM(''ONLINE'', ''DELIVERY'', ''TAKEAWAY'', ''WALK_IN'') NOT NULL'
  ELSE
    'SELECT 1'
END;

PREPARE stmt_order_type FROM @sql_order_type;
EXECUTE stmt_order_type;
DEALLOCATE PREPARE stmt_order_type;

-- 2) Seed reusable guest customer for cashier walk-in orders
-- Customer table requires phone/password, so we keep a fixed internal guest identity.
INSERT INTO `customer` (
  `name`,
  `email`,
  `phone`,
  `password`,
  `is_email_verified`,
  `is_phone_verified`,
  `is_active`,
  `account_status`,
  `preferred_notification`,
  `internal_notes`
)
SELECT
  'Walk-in Customer',
  NULL,
  '7000000000',
  SHA2(CONCAT('walkin-', UUID()), 256),
  0,
  0,
  1,
  'ACTIVE',
  'SMS',
  'System-generated guest profile for cashier walk-in orders'
WHERE NOT EXISTS (
  SELECT 1
  FROM `customer`
  WHERE `name` = 'Walk-in Customer'
    AND `phone` = '7000000000'
);

COMMIT;
