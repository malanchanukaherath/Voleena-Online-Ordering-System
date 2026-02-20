-- =====================================================
-- MIGRATION: Fix CASCADE Delete Issues
-- Date: February 20, 2026
-- Purpose: Change feedback table cascade from DELETE to SET NULL
--          to preserve customer data integrity
-- =====================================================

-- Step 1: Drop the existing foreign key constraint on feedback.customer_id
ALTER TABLE `feedback` DROP FOREIGN KEY `fk_feedback_customer`;

-- Step 2: Recreate the foreign key with SET NULL instead of CASCADE
ALTER TABLE `feedback` 
ADD CONSTRAINT `fk_feedback_customer` 
  FOREIGN KEY (`customer_id`) 
  REFERENCES `customer` (`customer_id`) 
  ON DELETE SET NULL;

-- Step 3: Add missing indexes for performance
-- Index on payment transaction_id lookup
CREATE INDEX `idx_payment_transaction_id` ON `payment`(`transaction_id`);

-- Index on payment creation date for reporting
CREATE INDEX `idx_payment_created_at` ON `payment`(`created_at`);

-- Index on feedback creation for reports
CREATE INDEX `idx_feedback_created_at` ON `feedback`(`created_at`);

-- Step 4: Verify the changes
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'feedback' AND REFERENCED_TABLE_NAME IS NOT NULL;

-- =====================================================
-- NOTES FOR BACKUP & ROLLBACK
-- =====================================================
-- If rollback needed, run:
-- ALTER TABLE `feedback` DROP FOREIGN KEY `fk_feedback_customer`;
-- ALTER TABLE `feedback` 
-- ADD CONSTRAINT `fk_feedback_customer` 
--   FOREIGN KEY (`customer_id`) 
--   REFERENCES `customer` (`customer_id`) 
--   ON DELETE CASCADE;
-- =====================================================

