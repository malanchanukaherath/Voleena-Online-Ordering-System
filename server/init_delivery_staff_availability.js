/**
 * Initialize Delivery Staff Availability
 * 
 * This script ensures all delivery staff have availability records.
 * Run this after creating delivery staff accounts.
 * 
 * Usage: node server/init_delivery_staff_availability.js
 */

const { sequelize, Staff, Role } = require('./models');

// Code Review: Function initializeDeliveryStaffAvailability in server\init_delivery_staff_availability.js. Used in: server/init_delivery_staff_availability.js.
async function initializeDeliveryStaffAvailability() {
    try {
        console.log('🚚 Initializing delivery staff availability...\n');

        // Find Delivery role
        const deliveryRole = await Role.findOne({
            where: { RoleName: 'Delivery' }
        });

        if (!deliveryRole) {
            console.log('❌ Delivery role not found. Please run seed_roles_and_staff.js first.');
            process.exit(1);
        }

        // Find all delivery staff
        const deliveryStaff = await Staff.findAll({
            where: {
                RoleID: deliveryRole.RoleID,
                IsActive: true
            }
        });

        if (deliveryStaff.length === 0) {
            console.log('⚠️  No active delivery staff found.');
            console.log('   Please create delivery staff accounts first.');
            process.exit(0);
        }

        console.log(`📋 Found ${deliveryStaff.length} delivery staff member(s)\n`);

        // Initialize availability for each staff
        for (const staff of deliveryStaff) {
            const [result] = await sequelize.query(
                `INSERT INTO delivery_staff_availability 
         (delivery_staff_id, is_available, last_updated)
         VALUES (?, 1, NOW())
         ON DUPLICATE KEY UPDATE 
         is_available = 1, 
         last_updated = NOW()`,
                {
                    replacements: [staff.StaffID],
                    type: sequelize.QueryTypes.INSERT
                }
            );

            console.log(`✅ Initialized availability for: ${staff.Name} (ID: ${staff.StaffID})`);
            console.log(`   Email: ${staff.Email}`);
            console.log(`   Status: Available\n`);
        }

        // Display current availability status
        console.log('\n📊 Current Availability Status:');
        const availabilityStatus = await sequelize.query(
            `SELECT 
        s.staff_id,
        s.name,
        s.email,
        dsa.is_available,
        dsa.current_order_id,
        dsa.last_updated
       FROM staff s
       JOIN role r ON s.role_id = r.role_id
       LEFT JOIN delivery_staff_availability dsa ON s.staff_id = dsa.delivery_staff_id
       WHERE r.role_name = 'Delivery' AND s.is_active = 1
       ORDER BY s.name`,
            { type: sequelize.QueryTypes.SELECT }
        );

        console.table(availabilityStatus.map(row => ({
            ID: row.staff_id,
            Name: row.name,
            Email: row.email,
            Available: row.is_available ? '✅ Yes' : '❌ No',
            'Current Order': row.current_order_id || '-',
            'Last Updated': row.last_updated ? new Date(row.last_updated).toLocaleString() : '-'
        })));

        console.log('\n✨ Initialization completed successfully!');
        console.log('\n💡 Tips:');
        console.log('   • Delivery staff can toggle availability via the dashboard');
        console.log('   • Auto-assignment will only assign to available staff');
        console.log('   • Staff become unavailable when assigned an order\n');

    } catch (error) {
        console.error('❌ Error initializing delivery staff availability:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run if called directly
if (require.main === module) {
    initializeDeliveryStaffAvailability();
}

module.exports = { initializeDeliveryStaffAvailability };
