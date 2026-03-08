-- Fix Menu Item Availability
-- This script enables all menu items that are currently unavailable

-- Enable menu items by ID (safe update mode compatible)
UPDATE menu_item 
SET is_active = true, is_available = true 
WHERE menu_item_id IN (1, 2);

-- Verify the fix
SELECT menu_item_id, name, is_active, is_available 
FROM menu_item 
ORDER BY menu_item_id;
