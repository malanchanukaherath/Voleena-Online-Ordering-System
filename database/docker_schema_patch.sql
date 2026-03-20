-- Docker schema compatibility patch (idempotent)
-- Ensures tables required by runtime queries exist even if prior schema scripts are partial.

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
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_default` (`customer_id`, `is_default`),
  CONSTRAINT `fk_address_customer` FOREIGN KEY (`customer_id`)
    REFERENCES `customer` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
