-- Migration: Add live location tracking to Delivery
-- Version: 2.2
-- Description: Add columns to track rider real-time location for hybrid delivery tracking

-- Add location columns to delivery table
ALTER TABLE delivery
ADD COLUMN current_latitude DECIMAL(10, 8) NULL COMMENT 'Current latitude of delivery rider',
ADD COLUMN current_longitude DECIMAL(11, 8) NULL COMMENT 'Current longitude of delivery rider',
ADD COLUMN last_location_update DATETIME NULL COMMENT 'Last time location was updated';

-- Create index for faster location queries
CREATE INDEX idx_delivery_location_update ON delivery(last_location_update DESC);

-- Add comment to delivery table
ALTER TABLE delivery COMMENT='Deliveries with real-time location tracking support';

-- Backfill existing deliveries with null values (already set as NULL in column definition)
-- No action needed, new columns will be NULL by default

COMMIT;
