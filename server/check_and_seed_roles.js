const db = require('./models');

// CODEMAP: BACKEND_SERVER_CHECK_AND_SEED_ROLES_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const db = require('./models');

// CODEMAP: BACKEND_SERVER_CHECK_AND_SEED_ROLES_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const db = require('./models');

// CODEMAP: BACKEND_SERVER_CHECK_AND_SEED_ROLES_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const db = require('./models');
checkAndSeedRoles();
// CODEMAP: BACKEND_SERVER_CHECK_AND_SEED_ROLES_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const db = require('./models');

// Simple: This checks if the and seed roles is correct.
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
                console.log(`Ã¢Å“â€¦ Created missing role: ${roleName}`);
            } else {
                console.log(`Ã¢â€žÂ¹Ã¯Â¸Â Role already exists: ${roleName}`);
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



