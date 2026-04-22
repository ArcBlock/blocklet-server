module.exports = {
  testTimeout: 60 * 1000 * 10,
  testMatch: ['**/tests/**/gateway.spec.js'],
  clearMocks: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  collectCoverageFrom: ['lib/**/*.js'],
};
