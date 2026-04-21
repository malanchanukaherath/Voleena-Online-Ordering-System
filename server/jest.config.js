// CODEMAP: BACKEND_SERVER_JEST_CONFIG_JS
// PURPOSE: Configure Jest test runtime for the backend test suite.
// SEARCH_HINT: Update testEnvironment/testMatch/setupFiles here.
module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js']
};



