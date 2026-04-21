process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// Keep test defaults aligned with runtime security validation rules.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'TestJwtSecret!2026#ForCI@Secure$Key%';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'RefreshJwtSecret!2026#ForCI@Secure$Key%';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_SYNC = 'false';
process.env.BASE_DELIVERY_FEE = process.env.BASE_DELIVERY_FEE || '100';



