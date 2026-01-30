const { MenuItem, Category } = require('./models');

async function test() {
    try {
        console.log('Testing MenuItem.findAll...');
        const menuItems = await MenuItem.findAll({
            include: [{
                model: Category,
                as: 'category',
                attributes: ['CategoryID', 'Name']
            }],
            order: [['CreatedAt', 'DESC']]
        });
        console.log('Success! Found', menuItems.length, 'items');
        console.log(JSON.stringify(menuItems, null, 2));
    } catch (error) {
        console.error('Query Failed!');
        console.error('Message:', error.message);
        console.error('SQL:', error.sql);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    }
    process.exit(0);
}

test();
