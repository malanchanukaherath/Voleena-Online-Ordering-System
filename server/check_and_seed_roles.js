const db = require('./models');

// Code Review: Function checkAndSeedRoles in server\check_and_seed_roles.js. Used in: server/check_and_seed_roles.js.
async function checkAndSeedRoles() {
    try {
        await db.sequelize.authenticate();
        console.log('Database connected.');

        const requiredRoles = ['Admin', 'Cashier', 'Kitchen', 'Delivery'];

        console.log('Checking roles...');

        for (const roleName of requiredRoles) {
            const [role, created] = await db.Role.findOrCreate({
                where: { RoleName: roleName },
                defaults: {
                    RoleName: roleName,
                    Description: `${roleName} role`
                }
            });

            if (created) {
                console.log(`✅ Created missing role: ${roleName}`);
            } else {
                console.log(`ℹ️ Role already exists: ${roleName}`);
            }
        }

        console.log('Role check complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error checking roles:', error);
        process.exit(1);
    }
}

checkAndSeedRoles();
