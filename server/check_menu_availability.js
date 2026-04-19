/**
 * Check Menu Item Availability
 * This script checks which menu items have IsActive or IsAvailable set to false
 * and provides SQL to fix them.
 */

const { MenuItem, sequelize } = require('./models');

// Code Review: Function checkMenuAvailability in server\check_menu_availability.js. Used in: server/check_menu_availability.js.
async function checkMenuAvailability() {
    try {
        console.log('Checking menu item availability...\n');

        // Find all menu items
        const allItems = await MenuItem.findAll({
            attributes: ['MenuItemID', 'Name', 'IsActive', 'IsAvailable', 'Price'],
            order: [['MenuItemID', 'ASC']]
        });

        console.log(`Total menu items: ${allItems.length}\n`);

        // Find unavailable items
        const unavailableItems = allItems.filter(item => !item.IsActive || !item.IsAvailable);

        if (unavailableItems.length === 0) {
            console.log('✓ All menu items are active and available!\n');
        } else {
            console.log(`⚠ Found ${unavailableItems.length} unavailable menu items:\n`);

            unavailableItems.forEach(item => {
                console.log(`  • ID ${item.MenuItemID}: ${item.Name}`);
                console.log(`    - IsActive: ${item.IsActive}`);
                console.log(`    - IsAvailable: ${item.IsAvailable}`);
                console.log('');
            });

            // Generate SQL to fix
            console.log('\nSQL to fix (enable all menu items):');
            console.log('----------------------------------------');
            unavailableItems.forEach(item => {
                console.log(`UPDATE menu_items SET is_active = true, is_available = true WHERE menu_item_id = ${item.MenuItemID}; -- ${item.Name}`);
            });
            console.log('----------------------------------------\n');
        }

        // Check specific menu item 2 from the error
        const menuItem2 = allItems.find(item => item.MenuItemID === 2);
        if (menuItem2) {
            console.log('Menu Item 2 Status:');
            console.log(`  Name: ${menuItem2.Name}`);
            console.log(`  Price: LKR ${menuItem2.Price}`);
            console.log(`  IsActive: ${menuItem2.IsActive}`);
            console.log(`  IsAvailable: ${menuItem2.IsAvailable}`);

            if (!menuItem2.IsActive || !menuItem2.IsAvailable) {
                console.log('\n  ⚠ This is causing the "Menu item 2 is not available" error!');
                console.log(`\n  Fix with: UPDATE menu_items SET is_active = true, is_available = true WHERE menu_item_id = 2;`);
            } else {
                console.log('\n  ✓ This menu item is available');
            }
        } else {
            console.log('⚠ Menu Item 2 does not exist in the database!');
        }

        await sequelize.close();
    } catch (error) {
        console.error('Error checking menu availability:', error);
        process.exit(1);
    }
}

checkMenuAvailability();
