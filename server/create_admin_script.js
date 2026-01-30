const { Staff, Role, sequelize } = require('./models');

async function createAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Database connection accepted.');

        // 1. Ensure Admin Role Exists
        let adminRole = await Role.findOne({ where: { RoleName: 'Admin' } });
        if (!adminRole) {
            console.log('Admin role not found. Creating it...');
            adminRole = await Role.create({
                RoleName: 'Admin',
                Description: 'Administrator with full access',
                Permissions: { all: true }
            });
            console.log('Admin role created.');
        } else {
            console.log('Admin role exists.');
        }

        // 2. Check if Admin User Exists
        const email = 'admin@gmail.com';
        const existingAdmin = await Staff.findOne({ where: { Email: email } });

        if (existingAdmin) {
            console.log(`User with email ${email} already exists.`);
        } else {
            console.log(`Creating user ${email}...`);
            // Password hashing is handled by the Staff model's beforeCreate hook
            const newAdmin = await Staff.create({
                Name: 'System Admin',
                Email: email,
                Phone: '0000000000', // Dummy phone number
                Password: 'Admin@123',
                RoleID: adminRole.RoleID,
                IsActive: true
            });
            console.log(`Admin user created successfully! ID: ${newAdmin.StaffID}`);
        }

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await sequelize.close();
    }
}

createAdmin();
