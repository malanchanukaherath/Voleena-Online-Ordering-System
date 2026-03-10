-- =====================================================
-- Voleena Foods - Database Migration v2.4
-- Date: 2026-03-10
-- Description: Customer email verification token table
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
  KEY `idx_email_verification_expiry` (`expires_at`),
  CONSTRAINT `fk_email_verification_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
