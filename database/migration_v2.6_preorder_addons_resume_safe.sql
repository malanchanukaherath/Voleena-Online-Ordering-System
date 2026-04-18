-- =====================================================
-- v2.6 Resume-safe migration: preorder + add-on schema
-- =====================================================
-- This script is idempotent and safe to re-run.
-- It assumes backup tables may already exist and only applies missing schema changes.

SET @db := DATABASE();

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_apply_v26_preorder_addons $$
CREATE PROCEDURE sp_apply_v26_preorder_addons()
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_col_type LONGTEXT;

  -- -----------------------------------------------------
  -- 1) Add missing preorder columns on `order`
  -- -----------------------------------------------------
  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND COLUMN_NAME = 'is_preorder';
  IF v_exists = 0 THEN
    ALTER TABLE `order`
      ADD COLUMN `is_preorder` TINYINT(1) NOT NULL DEFAULT 0 AFTER `order_type`;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND COLUMN_NAME = 'scheduled_datetime';
  IF v_exists = 0 THEN
    ALTER TABLE `order`
      ADD COLUMN `scheduled_datetime` DATETIME NULL AFTER `is_preorder`;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND COLUMN_NAME = 'approval_status';
  IF v_exists = 0 THEN
    ALTER TABLE `order`
      ADD COLUMN `approval_status` ENUM('NOT_REQUIRED','PENDING','APPROVED','REJECTED')
      COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NOT_REQUIRED' AFTER `scheduled_datetime`;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND COLUMN_NAME = 'approval_notes';
  IF v_exists = 0 THEN
    ALTER TABLE `order`
      ADD COLUMN `approval_notes` TEXT COLLATE utf8mb4_unicode_ci NULL AFTER `approval_status`;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND COLUMN_NAME = 'approved_by';
  IF v_exists = 0 THEN
    ALTER TABLE `order`
      ADD COLUMN `approved_by` INT UNSIGNED NULL AFTER `approval_notes`;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND COLUMN_NAME = 'approved_at';
  IF v_exists = 0 THEN
    ALTER TABLE `order`
      ADD COLUMN `approved_at` TIMESTAMP NULL DEFAULT NULL AFTER `approved_by`;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND COLUMN_NAME = 'rejected_reason';
  IF v_exists = 0 THEN
    ALTER TABLE `order`
      ADD COLUMN `rejected_reason` VARCHAR(500) COLLATE utf8mb4_unicode_ci NULL AFTER `approved_at`;
  END IF;

  -- -----------------------------------------------------
  -- 2) Expand order status enum for preorder lifecycle
  -- -----------------------------------------------------
  SELECT COLUMN_TYPE INTO v_col_type
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND COLUMN_NAME = 'status';

  IF v_col_type IS NOT NULL
     AND (v_col_type NOT LIKE '%PREORDER_PENDING%'
          OR v_col_type NOT LIKE '%PREORDER_CONFIRMED%') THEN
    ALTER TABLE `order`
      MODIFY COLUMN `status` ENUM(
        'PENDING',
        'PREORDER_PENDING',
        'PREORDER_CONFIRMED',
        'CONFIRMED',
        'PREPARING',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED'
      ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING';
  END IF;

  -- Keep history enums aligned with order.status
  SELECT COLUMN_TYPE INTO v_col_type
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_status_history' AND COLUMN_NAME = 'old_status';

  IF v_col_type IS NOT NULL
     AND (v_col_type NOT LIKE '%PREORDER_PENDING%'
          OR v_col_type NOT LIKE '%PREORDER_CONFIRMED%') THEN
    ALTER TABLE `order_status_history`
      MODIFY COLUMN `old_status` ENUM(
        'PENDING',
        'PREORDER_PENDING',
        'PREORDER_CONFIRMED',
        'CONFIRMED',
        'PREPARING',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED'
      ) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  END IF;

  SELECT COLUMN_TYPE INTO v_col_type
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_status_history' AND COLUMN_NAME = 'new_status';

  IF v_col_type IS NOT NULL
     AND (v_col_type NOT LIKE '%PREORDER_PENDING%'
          OR v_col_type NOT LIKE '%PREORDER_CONFIRMED%') THEN
    ALTER TABLE `order_status_history`
      MODIFY COLUMN `new_status` ENUM(
        'PENDING',
        'PREORDER_PENDING',
        'PREORDER_CONFIRMED',
        'CONFIRMED',
        'PREPARING',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED'
      ) COLLATE utf8mb4_unicode_ci NOT NULL;
  END IF;

  -- -----------------------------------------------------
  -- 3) Add missing preorder FK and indexes
  -- -----------------------------------------------------
  SELECT COUNT(*) INTO v_exists
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'order'
    AND CONSTRAINT_NAME = 'fk_order_approved_by'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY';

  IF v_exists = 0 THEN
    ALTER TABLE `order`
      ADD CONSTRAINT `fk_order_approved_by`
      FOREIGN KEY (`approved_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND INDEX_NAME = 'idx_order_preorder_queue';

  IF v_exists = 0 THEN
    ALTER TABLE `order`
      ADD INDEX `idx_order_preorder_queue` (`is_preorder`, `approval_status`, `scheduled_datetime`, `status`);
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order' AND INDEX_NAME = 'idx_order_scheduled_datetime';

  IF v_exists = 0 THEN
    ALTER TABLE `order`
      ADD INDEX `idx_order_scheduled_datetime` (`scheduled_datetime`);
  END IF;

  -- -----------------------------------------------------
  -- 4) Create preorder approval audit table
  -- -----------------------------------------------------
  CREATE TABLE IF NOT EXISTS `preorder_approval_log` (
    `preorder_approval_log_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` INT UNSIGNED NOT NULL,
    `old_approval_status` ENUM('NOT_REQUIRED','PENDING','APPROVED','REJECTED')
      COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `new_approval_status` ENUM('NOT_REQUIRED','PENDING','APPROVED','REJECTED')
      COLLATE utf8mb4_unicode_ci NOT NULL,
    `action_by` INT UNSIGNED DEFAULT NULL,
    `action_by_type` ENUM('STAFF','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STAFF',
    `notes` VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`preorder_approval_log_id`),
    KEY `idx_preorder_log_order_created` (`order_id`, `created_at`),
    KEY `idx_preorder_log_actor_created` (`action_by`, `created_at`),
    CONSTRAINT `fk_preorder_log_order`
      FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_preorder_log_actor`
      FOREIGN KEY (`action_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- -----------------------------------------------------
  -- 5) Create add-on catalog and mapping tables
  -- -----------------------------------------------------
  CREATE TABLE IF NOT EXISTS `addon_option` (
    `addon_option_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `name` VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `price_delta` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
    `is_active` TINYINT(1) NOT NULL DEFAULT '1',
    `affects_live_stock` TINYINT(1) NOT NULL DEFAULT '0',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`addon_option_id`),
    UNIQUE KEY `uk_addon_option_code` (`code`),
    KEY `idx_addon_option_active` (`is_active`),
    CONSTRAINT `chk_addon_price_non_negative` CHECK ((`price_delta` >= 0))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS `menu_item_addon_option` (
    `menu_item_addon_option_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `menu_item_id` INT UNSIGNED NOT NULL,
    `addon_option_id` INT UNSIGNED NOT NULL,
    `is_required` TINYINT(1) NOT NULL DEFAULT '0',
    `max_qty` TINYINT UNSIGNED NOT NULL DEFAULT '1',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`menu_item_addon_option_id`),
    UNIQUE KEY `uk_menu_item_addon_option` (`menu_item_id`, `addon_option_id`),
    KEY `idx_menu_item_addon_option_addon` (`addon_option_id`),
    CONSTRAINT `fk_menu_item_addon_option_menu_item`
      FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_menu_item_addon_option_addon`
      FOREIGN KEY (`addon_option_id`) REFERENCES `addon_option` (`addon_option_id`) ON DELETE CASCADE,
    CONSTRAINT `chk_menu_item_addon_max_qty_positive` CHECK ((`max_qty` > 0))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS `order_item_addon` (
    `order_item_addon_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_item_id` INT UNSIGNED NOT NULL,
    `addon_option_id` INT UNSIGNED NOT NULL,
    `quantity` INT UNSIGNED NOT NULL DEFAULT '1',
    `unit_price` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
    `line_total` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
    `addon_name_snapshot` VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`order_item_addon_id`),
    UNIQUE KEY `uk_order_item_addon` (`order_item_id`, `addon_option_id`),
    KEY `idx_order_item_addon_addon` (`addon_option_id`),
    CONSTRAINT `fk_order_item_addon_order_item`
      FOREIGN KEY (`order_item_id`) REFERENCES `order_item` (`order_item_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_order_item_addon_addon`
      FOREIGN KEY (`addon_option_id`) REFERENCES `addon_option` (`addon_option_id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_order_item_addon_qty_positive` CHECK ((`quantity` > 0)),
    CONSTRAINT `chk_order_item_addon_prices_non_negative` CHECK ((`unit_price` >= 0 AND `line_total` >= 0))
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- -----------------------------------------------------
  -- 6) Preorder queue view (safe to re-run)
  -- -----------------------------------------------------
  CREATE OR REPLACE VIEW `vw_preorder_pending_queue` AS
  SELECT
    o.`order_id`,
    o.`order_number`,
    o.`customer_id`,
    c.`name` AS `customer_name`,
    c.`phone` AS `customer_phone`,
    o.`contact_phone`,
    o.`status`,
    o.`approval_status`,
    o.`scheduled_datetime`,
    o.`created_at`
  FROM `order` o
  LEFT JOIN `customer` c ON c.`customer_id` = o.`customer_id`
  WHERE o.`is_preorder` = 1
    AND o.`approval_status` = 'PENDING'
  ORDER BY
    (o.`scheduled_datetime` IS NULL),
    o.`scheduled_datetime`,
    o.`created_at`;

  -- -----------------------------------------------------
  -- 7) Minimal safe normalization/backfill
  -- -----------------------------------------------------
  UPDATE `order`
  SET `approval_status` = CASE
      WHEN `is_preorder` = 1 THEN 'PENDING'
      ELSE 'NOT_REQUIRED'
    END
  WHERE `approval_status` IS NULL;

  UPDATE `order`
  SET `status` = 'PREORDER_PENDING'
  WHERE `is_preorder` = 1
    AND `approval_status` = 'PENDING'
    AND `status` = 'PENDING';

END $$

CALL sp_apply_v26_preorder_addons() $$
DROP PROCEDURE IF EXISTS sp_apply_v26_preorder_addons $$

DELIMITER ;
