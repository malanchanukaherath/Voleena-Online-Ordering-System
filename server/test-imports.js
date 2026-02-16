// Test script to identify the exact error
require('dotenv').config();

console.log('Testing imports...');

try {
    console.log('1. Testing database...');
    const sequelize = require('./config/database');
    console.log('✅ Database loaded');

    console.log('2. Testing rateLimiter...');
    const { apiLimiter } = require('./middleware/rateLimiter');
    console.log('✅ RateLimiter loaded');

    console.log('3. Testing validation...');
    const { sanitizeInput } = require('./middleware/validation');
    console.log('✅ Validation loaded');

    console.log('4. Testing automatedJobs...');
    const automatedJobs = require('./services/automatedJobs');
    console.log('✅ AutomatedJobs loaded');

    console.log('\n✅ All imports successful!');
} catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack:', error.stack);
}
