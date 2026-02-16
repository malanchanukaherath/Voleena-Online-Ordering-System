const bcrypt = require('bcryptjs');
const { sequelize } = require('./models');

const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
const adminPhone = process.env.ADMIN_PHONE || '0000000000';
const adminName = process.env.ADMIN_NAME || 'System Admin';

async function createAdminRaw() {
  try {
    await sequelize.authenticate();
    console.log('Database connection accepted.');

    const [roles] = await sequelize.query(
      "SELECT role_id FROM role WHERE role_name = 'Admin' LIMIT 1"
    );

    let roleId = roles?.[0]?.role_id;

    if (!roleId) {
      const [result] = await sequelize.query(
        "INSERT INTO role (role_name, description) VALUES ('Admin', 'Administrator with full access')"
      );

      roleId = result?.insertId;
      console.log('Admin role created.');
    } else {
      console.log('Admin role exists.');
    }

    const [existing] = await sequelize.query(
      'SELECT staff_id FROM staff WHERE email = ? LIMIT 1',
      { replacements: [adminEmail] }
    );

    if (existing?.length) {
      console.log(`User with email ${adminEmail} already exists.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await sequelize.query(
      `INSERT INTO staff (name, role_id, email, phone, password, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      {
        replacements: [adminName, roleId, adminEmail, adminPhone, hashedPassword]
      }
    );

    console.log('Admin user created successfully.');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await sequelize.close();
  }
}

createAdminRaw();
