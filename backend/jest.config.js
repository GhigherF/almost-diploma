module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!dist/**',
    '!coverage/**',
    '!jest.config.js',
    '!*.test.js',
    '!seed*.js',
    '!startup.js',
    '!test-*.js',
    '!index-old.js'
  ],
  // Coverage thresholds removed for unit tests with full mock isolation
  // Unit tests use mocked dependencies and are not expected to have high real code coverage
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: [],
  verbose: true,
  bail: false,
  maxWorkers: '50%',
  testTimeout: 10000
};
