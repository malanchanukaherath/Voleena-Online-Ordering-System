const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

app.use(express.json());
app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, 'Assets')));

const db = require('./models');
const { requireAuth, requireRole } = require('./middleware/auth');

// Import routes
const authRouter = require('./routes/Auth');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cashierRoutes = require('./routes/cashierRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const menuItemsRouter = require('./routes/menuItems');
const comboPacksRouter = require('./routes/comboPacks');
const categoriesRouter = require('./routes/categories');
const ordersRouter = require('./routes/orders');
const stockRouter = require('./routes/stock');
const staffRoutes = require('./routes/staff');
const customersRouter = require('./routes/customers');

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'voleena-api' });
});

// Authentication routes (new)
app.use('/api/auth', authRoutes);

// Role-based dashboard routes
app.use('/api/admin', adminRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/delivery', deliveryRoutes);

// Legacy auth route (keep for backward compatibility)
app.use('/auth', authRouter);

// Existing routes
app.use('/api/menu-items', menuItemsRouter);
app.use('/api/combo-packs', comboPacksRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/stock', stockRouter);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customersRouter);

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available: [
      '/auth/login',
      '/auth/register',
      '/auth/me',
      '/api/menu-items',
      '/api/combo-packs',
      '/api/categories',
      '/health'
    ]
  });
});

db.sequelize.sync({ alter: false }).then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🍔 Voleena API Server');
    console.log('='.repeat(60));
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🔗 Base URL: http://localhost:${PORT}`);
    console.log('\n📋 Available Endpoints:');
    console.log('   POST   /auth/login');
    console.log('   POST   /auth/register');
    console.log('   GET    /auth/me');
    console.log('   GET    /api/menu-items');
    console.log('   POST   /api/menu-items');
    console.log('   GET    /api/combo-packs/active');
    console.log('   POST   /api/combo-packs');
    console.log('   GET    /api/categories');
    console.log('   GET    /health');
    console.log('='.repeat(60));
  });
}).catch(err => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});

