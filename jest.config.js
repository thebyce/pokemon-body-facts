module.exports = {
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  collectCoverageFrom: ['./src/**/*.ts'],
  testEnvironment: 'node',
  transformIgnorePatterns: ['node_modules/(?!(@crm)/)'],
};
