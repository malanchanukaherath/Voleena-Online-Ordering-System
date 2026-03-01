-- =====================================================
-- Voleena Foods - Database Migration v2.1
-- Date: March 1, 2026
-- Description: Performance optimization - Add missing indexes
--              and new logging tables
-- =====================================================

-- =====================================================
-- 1. ADD MISSING INDEXES FOR PERFORMANCE
-- =====================================================

-- Payment indexes for webhook lookups and filtering
ALTER TABLE `payment`
ADD INDEX `idx_payment_transaction_id` (`transaction_id`) COMMENT 'For webhook transaction lookups',
ADD INDEX `idx_payment_created_at` (`created_at`) COMMENT 'For payment history filtering';

-- Order indexes for dashboard queries
ALTER TABLE `order`
ADD INDEX `idx_order_status_created` (`status`, `created_at` DESC) COMMENT 'For dashboard order filtering';

-- Delivery indexes for staff assignment queries
ALTER TABLE `delivery`
ADD INDEX `idx_delivery_staff_status` (`delivery_staff_id`, `status`) COMMENT 'For available deliveries per staff';

-- Stock indexes
ALTER TABLE `daily_stock`
ADD INDEX `idx_stock_menu_date` (`menu_item_id`, `stock_date`) COMMENT 'For daily stock lookups';

-- =====================================================
-- 2. CREATE DELIVERY ASSIGNMENT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS `delivery_assignment_log` (
  `assignment_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `assigned_staff_id` INT UNSIGNED NOT NULL,
  `reason` VARCHAR(255) NOT NULL COMMENT 'Assignment decision reason',
  `active_deliveries` INT DEFAULT 0 COMMENT 'Available deliveries at assignment time',
  `completion_time` DECIMAL(10, 2) DEFAULT 0 COMMENT 'Average completion time',
  `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_staff` (`assigned_staff_id`),
  KEY `idx_assigned_at` (`assigned_at`),
  CONSTRAINT `fk_assignment_order` FOREIGN KEY (`order_id`) 
    REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignment_staff` FOREIGN KEY (`assigned_staff_id`) 
    REFERENCES `staff` (`staff_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit log for delivery auto-assignment decisions';

-- =====================================================
-- 3. VERIFY CRITICAL CONSTRAINTS
-- =====================================================

-- Verify that password_reset tokens have is_used field
-- This should already exist, but confirming
ALTER TABLE `password_reset` 
MODIFY COLUMN `is_used` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Prevents token reuse';

-- =====================================================
-- 4. PERFORMANCE VERIFICATION
-- =====================================================

-- Check new indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_NAME IN ('payment', 'order', 'delivery', 'daily_stock')
  AND TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, INDEX_NAME;

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================
-- Apply this migration with:
--
-- mysql -u user -p database < migrations/v2.1_performance_optimization.sql
--
-- Or execute in MySQL client:
-- SOURCE /path/to/migrations/v2.1_performance_optimization.sql;
--
-- Verify with:
-- SHOW INDEXES FROM payment;
-- SHOW INDEXES FROM order;
-- SHOW INDEXES FROM delivery;
-- SHOW INDEXES FROM daily_stock;
-- =====================================================
