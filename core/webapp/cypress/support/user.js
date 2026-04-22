const { fromJSON } = require('@ocap/wallet');

Cypress.Commands.add('getOwnerWallet', () => cy.readFile('.cypress/owner.json').then(json => fromJSON(json)));
Cypress.Commands.add('getOwnerProfile', () => ({
  email: 'alice@example.com',
  fullName: 'alice',
  avatar: 'https://avatars1.githubusercontent.com/u/10251037?s=460&v=4',
}));

Cypress.Commands.add('getAdminWallet', () => cy.readFile('.cypress/admin.json').then(json => fromJSON(json)));
Cypress.Commands.add('getAdminProfile', () => ({ email: 'bob@example.com', fullName: 'bob' }));

Cypress.Commands.add('getNodeWallet', () => cy.readFile('.cypress/node.json').then(json => fromJSON(json)));
