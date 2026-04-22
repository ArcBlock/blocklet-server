require('./commands');
require('./user');
require('./auth');

Cypress.on('uncaught:exception', err => {
  // https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    // returning false here prevents Cypress from failing the test
    return false;
  }

  return true;
});
