const db = require('./models');

async function seed() {
    try {
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });
        await db.sequelize.sync({ force: true });
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
        console.log('Database synced');

        const categories = [
            { Name: 'Burgers', Description: 'Juicy burgers', IsActive: true },
            { Name: 'Rice', Description: 'Rice and Curry', IsActive: true },
            { Name: 'Pizza', Description: 'Italian Pizza', IsActive: true },
            { Name: 'Pasta', Description: 'Creamy Pasta', IsActive: true },
            { Name: 'Drinks', Description: 'Refreshing Drinks', IsActive: true },
            { Name: 'Desserts', Description: 'Sweet Desserts', IsActive: true },
            { Name: 'Combo Packs', Description: 'Special Combos', IsActive: true }
        ];

        for (const cat of categories) {
            const [category, created] = await db.Category.findOrCreate({
                where: { Name: cat.Name },
                defaults: cat
            });
            console.log(`Category ${cat.Name} ${created ? 'created' : 'already exists'}`);
        }

        // Get category IDs
        const burgerCat = await db.Category.findOne({ where: { Name: 'Burgers' } });
        const riceCat = await db.Category.findOne({ where: { Name: 'Rice' } });
        const pizzaCat = await db.Category.findOne({ where: { Name: 'Pizza' } });
        const pastaCat = await db.Category.findOne({ where: { Name: 'Pasta' } });
        const drinkCat = await db.Category.findOne({ where: { Name: 'Drinks' } });

        const menuItems = [
            {
                Name: 'Chicken Burger',
                Description: 'Crispy chicken patty with fresh vegetables',
                Price: 450.00,
                CategoryID: burgerCat.CategoryID,
                StockQuantity: 12,
                IsActive: true,
                Image_URL: null
            },
            {
                Name: 'Rice & Curry',
                Description: 'Traditional Sri Lankan rice with curry',
                Price: 350.00,
                CategoryID: riceCat.CategoryID,
                StockQuantity: 3,
                IsActive: true,
                Image_URL: null
            },
            {
                Name: 'Margherita Pizza',
                Description: 'Classic pizza with mozzarella and basil',
                Price: 850.00,
                CategoryID: pizzaCat.CategoryID,
                StockQuantity: 0,
                IsActive: false,
                Image_URL: null
            },
            {
                Name: 'Pasta Carbonara',
                Description: 'Creamy pasta with bacon and parmesan',
                Price: 650.00,
                CategoryID: pastaCat.CategoryID,
                StockQuantity: 8,
                IsActive: true,
                Image_URL: null
            },
            {
                Name: 'Iced Coffee',
                Description: 'Refreshing cold coffee',
                Price: 250.00,
                CategoryID: drinkCat.CategoryID,
                StockQuantity: 0,
                IsActive: false,
                Image_URL: null
            }
        ];

        for (const item of menuItems) {
            const [menuItem, created] = await db.MenuItem.findOrCreate({
                where: { Name: item.Name },
                defaults: item
            });
            console.log(`MenuItem ${item.Name} ${created ? 'created' : 'already exists'}`);
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
