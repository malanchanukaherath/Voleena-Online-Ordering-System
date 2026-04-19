/**
 * Seed roles and known login accounts for a fresh deployment.
 *
 * Usage: node server/seed_roles_and_staff.js
 */

const { sequelize, Role, Staff, Customer } = require('./models');

const roles = [
  { RoleName: 'Customer', Description: 'Customer role for placing orders' },
  { RoleName: 'Admin', Description: 'System Administrator with full access' },
  { RoleName: 'Cashier', Description: 'Cashier staff - manage orders and customers' },
  { RoleName: 'Kitchen', Description: 'Kitchen staff - manage food preparation' },
  { RoleName: 'Delivery', Description: 'Delivery staff - manage deliveries' }
];

const staffAccounts = [
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

const customerAccounts = [
  {
    Name: 'Sanjani',
    Email: 'sanjani@gmail.com',
    Phone: '0771234571',
    Password: 'Sanjani@123'
  }
];

// Simple: This handles upsert roles logic.
async function upsertRoles() {
  console.log('Creating roles...');

  for (const roleData of roles) {
    const [, created] = await Role.findOrCreate({
      where: { RoleName: roleData.RoleName },
      defaults: roleData
    });

    console.log(`${created ? 'Created' : 'Exists'} role: ${roleData.RoleName}`);
  }
}

// Simple: This handles upsert staff accounts logic.
async function upsertStaffAccounts() {
  console.log('\nCreating staff accounts...');

  for (const staffData of staffAccounts) {
    const role = await Role.findOne({ where: { RoleName: staffData.RoleName } });

    if (!role) {
      throw new Error(`Role not found: ${staffData.RoleName}`);
    }

    const [staff, created] = await Staff.findOrCreate({
      where: { Email: staffData.Email },
      defaults: {
        Name: staffData.Name,
        Email: staffData.Email,
        Phone: staffData.Phone,
        Password: staffData.Password,
        RoleID: role.RoleID,
        IsActive: true
      }
    });

    if (!created) {
      await staff.update({
        Name: staffData.Name,
        Phone: staffData.Phone,
        Password: staffData.Password,
        RoleID: role.RoleID,
        IsActive: true
      });
    }

    if (staffData.RoleName === 'Delivery') {
      await sequelize.query(
        `INSERT INTO delivery_staff_availability (delivery_staff_id, is_available, last_updated)
         VALUES (:staffId, 1, NOW())
         ON DUPLICATE KEY UPDATE is_available = VALUES(is_available), last_updated = NOW()`,
        { replacements: { staffId: staff.StaffID } }
      );
    }

    console.log(`${created ? 'Created' : 'Updated'} staff: ${staffData.Email} (${staffData.RoleName})`);
  }
}

// Simple: This handles upsert customer accounts logic.
async function upsertCustomerAccounts() {
  console.log('\nCreating customer accounts...');

  for (const customerData of customerAccounts) {
    const [customer, created] = await Customer.findOrCreate({
      where: { Email: customerData.Email },
      defaults: {
        Name: customerData.Name,
        Email: customerData.Email,
        Phone: customerData.Phone,
        Password: customerData.Password,
        IsEmailVerified: true,
        IsPhoneVerified: true,
        IsActive: true,
        AccountStatus: 'ACTIVE',
        PreferredNotification: 'BOTH'
      }
    });

    if (!created) {
      await customer.update({
        Name: customerData.Name,
        Phone: customerData.Phone,
        Password: customerData.Password,
        IsEmailVerified: true,
        IsPhoneVerified: true,
        IsActive: true,
        AccountStatus: 'ACTIVE',
        PreferredNotification: 'BOTH'
      });
    }

    console.log(`${created ? 'Created' : 'Updated'} customer: ${customerData.Email}`);
  }
}

// Simple: This handles seed roles and accounts logic.
async function seedRolesAndAccounts() {
  try {
    console.log('Starting account seed...\n');
    await upsertRoles();
    await upsertStaffAccounts();
    await upsertCustomerAccounts();

    console.log('\nSeed completed successfully.');
    console.log('Accounts:');
    console.log('Admin:    admin@gmail.com    | Password: Admin@123');
    console.log('Cashier:  cashier@gmail.com  | Password: Cashier@123');
    console.log('Kitchen:  kitchen@gmail.com  | Password: Kitchen@123');
    console.log('Delivery: delivery@gmail.com | Password: Delivery@123');
    console.log('Customer: sanjani@gmail.com  | Password: Sanjani@123');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedRolesAndAccounts();
