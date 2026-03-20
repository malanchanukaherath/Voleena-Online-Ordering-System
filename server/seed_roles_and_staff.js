/**
 * Seed Roles and Test Staff Accounts
 * Run this script to create initial roles and staff accounts for testing
 * 
 * Usage: node server/seed_roles_and_staff.js
 */

const bcrypt = require('bcryptjs');
const { sequelize, Role, Staff } = require('./models');

const roles = [
  { RoleName: 'Admin', Description: 'System Administrator with full access' },
  { RoleName: 'Cashier', Description: 'Cashier staff - manage orders and customers' },
  { RoleName: 'Kitchen', Description: 'Kitchen staff - manage food preparation' },
  { RoleName: 'Delivery', Description: 'Delivery staff - manage deliveries' }
];

const testStaff = [
  {
    Name: 'Admin User',
    Email: 'admin@gmail.com',
    Phone: '0771234567',
    Password: 'Admin@123',
    RoleName: 'Admin'
  },
  {
    Name: 'Cashier User',
    Email: 'cashier@gmail.com',
    Phone: '0771234568',
    Password: 'Cashier@123',
    RoleName: 'Cashier'
  },
  {
    Name: 'Kitchen User',
    Email: 'kitchen@gmail.com',
    Phone: '0771234569',
    Password: 'Kitchen@123',
    RoleName: 'Kitchen'
  },
  {
    Name: 'Delivery User',
    Email: 'delivery@gmail.com',
    Phone: '0771234570',
    Password: 'Delivery@123',
    RoleName: 'Delivery'
  }
];

async function seedRolesAndStaff() {
  try {
    console.log('🌱 Starting seed process...\n');

    // Create roles
    console.log('📋 Creating roles...');
    for (const roleData of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { RoleName: roleData.RoleName },
        defaults: roleData
      });

      if (created) {
        console.log(`✅ Created role: ${roleData.RoleName}`);
      } else {
        console.log(`ℹ️  Role already exists: ${roleData.RoleName}`);
      }
    }

    console.log('\n👥 Creating test staff accounts...');
    for (const staffData of testStaff) {
      // Find role
      const role = await Role.findOne({ where: { RoleName: staffData.RoleName } });
      
      if (!role) {
        console.log(`❌ Role not found: ${staffData.RoleName}`);
        continue;
      }

      // Check if staff already exists
      const existing = await Staff.findOne({ where: { Email: staffData.Email } });
      
      if (existing) {
        console.log(`ℹ️  Staff already exists: ${staffData.Email}`);
        continue;
      }

      // Create staff
      const staff = await Staff.create({
        Name: staffData.Name,
        Email: staffData.Email,
        Phone: staffData.Phone,
        Password: staffData.Password,
        RoleID: role.RoleID,
        IsActive: true
      });

      console.log(`✅ Created staff: ${staffData.Email} (${staffData.RoleName})`);
      console.log(`   Password: ${staffData.Password}`);
    }

    console.log('\n✨ Seed completed successfully!\n');
    console.log('📝 Test Accounts:');
    console.log('─'.repeat(60));
    console.log('Admin:    admin@voleena.com    | Password: Admin@123');
    console.log('Cashier:  cashier@voleena.com  | Password: Cashier@123');
    console.log('Kitchen:  kitchen@voleena.com  | Password: Kitchen@123');
    console.log('Delivery: delivery@voleena.com | Password: Delivery@123');
    console.log('─'.repeat(60));
    console.log('\n⚠️  Remember to change these passwords in production!\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the seed
seedRolesAndStaff();
