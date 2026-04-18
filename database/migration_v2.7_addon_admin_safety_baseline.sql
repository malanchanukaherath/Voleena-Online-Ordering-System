-- =====================================================
-- v2.7 Add-on Admin Safety Baseline (additive only)
-- =====================================================
-- Purpose:
-- 1) Keep current system behavior intact.
-- 2) Prepare DB for admin-managed add-on catalog (category-like management).
-- 3) Apply only additive, idempotent changes.
--
-- Safety characteristics:
-- - No DROP TABLE / DROP COLUMN / RENAME COLUMN.
-- - No destructive updates.
-- - Uses information_schema checks before each change.
-- - Safe to re-run.
--
-- Target: MySQL 8.x

SET @db := DATABASE();

-- Optional: fail fast if no DB selected
SELECT IF(@db IS NULL OR CHAR_LENGTH(@db) = 0, 'ERROR: No database selected', CONCAT('Applying on DB: ', @db)) AS migration_target;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_apply_v27_addon_admin_safety_baseline $$
CREATE PROCEDURE sp_apply_v27_addon_admin_safety_baseline()
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_table_exists INT DEFAULT 0;

  -- -----------------------------------------------------
  -- 0) Ensure base add-on tables exist (from v2.6 design)
  -- -----------------------------------------------------
  CREATE TABLE IF NOT EXISTS `addon_option` (
    `addon_option_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `name` VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `price_delta` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
    `default_max_qty` TINYINT UNSIGNED NOT NULL DEFAULT '1',
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
  -- 1) Add admin-management columns to addon_option
  -- -----------------------------------------------------
  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'addon_option' AND COLUMN_NAME = 'display_order';
  IF v_exists = 0 THEN
    ALTER TABLE `addon_option`
      ADD COLUMN `display_order` INT NOT NULL DEFAULT 0;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'addon_option' AND COLUMN_NAME = 'addon_group';
  IF v_exists = 0 THEN
    ALTER TABLE `addon_option`
      ADD COLUMN `addon_group` VARCHAR(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'addon_option' AND COLUMN_NAME = 'default_max_qty';
  IF v_exists = 0 THEN
    ALTER TABLE `addon_option`
      ADD COLUMN `default_max_qty` TINYINT UNSIGNED NOT NULL DEFAULT 1;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'addon_option' AND COLUMN_NAME = 'created_by';
  IF v_exists = 0 THEN
    ALTER TABLE `addon_option`
      ADD COLUMN `created_by` INT UNSIGNED DEFAULT NULL;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'addon_option' AND COLUMN_NAME = 'updated_by';
  IF v_exists = 0 THEN
    ALTER TABLE `addon_option`
      ADD COLUMN `updated_by` INT UNSIGNED DEFAULT NULL;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.STATISTICS
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'addon_option' AND INDEX_NAME = 'idx_addon_group_active_order';
  IF v_exists = 0 THEN
    ALTER TABLE `addon_option`
      ADD INDEX `idx_addon_group_active_order` (`addon_group`, `is_active`, `display_order`, `addon_option_id`);
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.STATISTICS
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'addon_option' AND INDEX_NAME = 'idx_addon_name';
  IF v_exists = 0 THEN
    ALTER TABLE `addon_option`
      ADD INDEX `idx_addon_name` (`name`);
  END IF;

  -- Add FK to staff only if staff table exists and FK absent.
  SELECT COUNT(*) INTO v_table_exists
  FROM information_schema.TABLES
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'staff';

  IF v_table_exists > 0 THEN
    SELECT COUNT(*) INTO v_exists
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE BINARY CONSTRAINT_SCHEMA = BINARY @db
      AND TABLE_NAME = 'addon_option'
      AND CONSTRAINT_NAME = 'fk_addon_option_created_by';
    IF v_exists = 0 THEN
      ALTER TABLE `addon_option`
        ADD CONSTRAINT `fk_addon_option_created_by`
        FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL;
    END IF;

    SELECT COUNT(*) INTO v_exists
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE BINARY CONSTRAINT_SCHEMA = BINARY @db
      AND TABLE_NAME = 'addon_option'
      AND CONSTRAINT_NAME = 'fk_addon_option_updated_by';
    IF v_exists = 0 THEN
      ALTER TABLE `addon_option`
        ADD CONSTRAINT `fk_addon_option_updated_by`
        FOREIGN KEY (`updated_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL;
    END IF;
  END IF;

  -- -----------------------------------------------------
  -- 2) Add admin-UX columns to menu_item_addon_option
  -- -----------------------------------------------------
  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'menu_item_addon_option' AND COLUMN_NAME = 'display_order';
  IF v_exists = 0 THEN
    ALTER TABLE `menu_item_addon_option`
      ADD COLUMN `display_order` INT NOT NULL DEFAULT 0;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.COLUMNS
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'menu_item_addon_option' AND COLUMN_NAME = 'is_default';
  IF v_exists = 0 THEN
    ALTER TABLE `menu_item_addon_option`
      ADD COLUMN `is_default` TINYINT(1) NOT NULL DEFAULT 0;
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM information_schema.STATISTICS
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'menu_item_addon_option' AND INDEX_NAME = 'idx_menu_item_addon_order';
  IF v_exists = 0 THEN
    ALTER TABLE `menu_item_addon_option`
      ADD INDEX `idx_menu_item_addon_order` (`menu_item_id`, `display_order`, `addon_option_id`);
  END IF;

  -- -----------------------------------------------------
  -- 3) Add audit table for admin add-on changes
  -- -----------------------------------------------------
  CREATE TABLE IF NOT EXISTS `addon_option_audit` (
    `addon_option_audit_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `addon_option_id` INT UNSIGNED NOT NULL,
    `action` ENUM('CREATE','UPDATE','ACTIVATE','DEACTIVATE','ASSIGN','UNASSIGN') COLLATE utf8mb4_unicode_ci NOT NULL,
    `changed_by` INT UNSIGNED DEFAULT NULL,
    `context_type` ENUM('CATALOG','MENU_ITEM') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CATALOG',
    `context_id` INT UNSIGNED DEFAULT NULL,
    `change_summary` VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `payload_json` JSON DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`addon_option_audit_id`),
    KEY `idx_addon_audit_option_created` (`addon_option_id`, `created_at`),
    KEY `idx_addon_audit_actor_created` (`changed_by`, `created_at`),
    KEY `idx_addon_audit_context_created` (`context_type`, `context_id`, `created_at`),
    CONSTRAINT `fk_addon_audit_option`
      FOREIGN KEY (`addon_option_id`) REFERENCES `addon_option` (`addon_option_id`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- Add audit actor FK only if staff exists and FK is absent.
  SELECT COUNT(*) INTO v_table_exists
  FROM information_schema.TABLES
  WHERE BINARY TABLE_SCHEMA = BINARY @db AND TABLE_NAME = 'staff';

  IF v_table_exists > 0 THEN
    SELECT COUNT(*) INTO v_exists
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE BINARY CONSTRAINT_SCHEMA = BINARY @db
      AND TABLE_NAME = 'addon_option_audit'
      AND CONSTRAINT_NAME = 'fk_addon_audit_actor';
    IF v_exists = 0 THEN
      ALTER TABLE `addon_option_audit`
        ADD CONSTRAINT `fk_addon_audit_actor`
        FOREIGN KEY (`changed_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL;
    END IF;
  END IF;

  -- -----------------------------------------------------
  -- 4) Read-model view for admin/customer APIs
  -- -----------------------------------------------------
  CREATE OR REPLACE VIEW `vw_menu_item_addon_catalog` AS
  SELECT
    miao.`menu_item_addon_option_id`,
    miao.`menu_item_id`,
    miao.`addon_option_id`,
    ao.`code`,
    ao.`name`,
    ao.`description`,
    ao.`addon_group`,
    ao.`price_delta`,
    ao.`is_active`,
    miao.`is_required`,
    miao.`max_qty`,
    miao.`is_default`,
    miao.`display_order`
  FROM `menu_item_addon_option` miao
  INNER JOIN `addon_option` ao ON ao.`addon_option_id` = miao.`addon_option_id`;

  -- -----------------------------------------------------
  -- 5) Non-destructive normalization (safe defaults)
  -- -----------------------------------------------------
  UPDATE `addon_option`
  SET `display_order` = 0
  WHERE `display_order` IS NULL;

  UPDATE `addon_option`
  SET `default_max_qty` = 1
  WHERE `default_max_qty` IS NULL OR `default_max_qty` < 1;

  UPDATE `menu_item_addon_option`
  SET `display_order` = 0
  WHERE `display_order` IS NULL;

END $$

CALL sp_apply_v27_addon_admin_safety_baseline() $$
DROP PROCEDURE IF EXISTS sp_apply_v27_addon_admin_safety_baseline $$

DELIMITER ;

-- =====================================================
-- Post-checks (read-only)
-- =====================================================
SELECT 'addon_option rows' AS metric, COUNT(*) AS value FROM `addon_option`
UNION ALL
SELECT 'menu_item_addon_option rows', COUNT(*) FROM `menu_item_addon_option`
UNION ALL
SELECT 'order_item_addon rows', COUNT(*) FROM `order_item_addon`
UNION ALL
SELECT 'addon_option_audit rows', COUNT(*) FROM `addon_option_audit`;

SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE BINARY TABLE_SCHEMA = BINARY DATABASE()
  AND TABLE_NAME = 'addon_option'
  AND COLUMN_NAME IN ('display_order','addon_group','default_max_qty','created_by','updated_by')
ORDER BY ORDINAL_POSITION;
