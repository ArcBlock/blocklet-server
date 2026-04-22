const createClient = require('../support/client');
const blocklets = require('../fixtures/blocklets');

describe('Blocklet Server AuthService prepare', () => {
  let client = null;
  before(async () => {
    client = createClient();
    const result = await client.resetNode({ input: { blocklets: true, users: true } });
    // eslint-disable-next-line no-console
    console.log('reset blocklets and users', result);
  });

  it('install blocklet', () => {
    const authTestDid = 'z8ia1CsFPeoyHFMCErmCribhZbSZn82FGRJQq';

    cy.login();
    cy.setLocalStorage('instant-blocklet-install', true);
    cy.visit('/blocklets');

    cy.get('[data-cy="open-install-menu"]').first().click({ force: true });
    cy.contains('Install From Url');
    cy.get('[data-cy="open-install-form"]').first().click({ force: true });
    cy.get('[data-cy="blocklet-url-input"]').type(`${Cypress.env('static-server-url')}/auth-test-1.0.0.json`);
    cy.get('[data-cy="install-blocklet-next-step"]').first().click({ force: true });
    cy.contains('auth-test');
    cy.get('[data-cy="install-blocklet-next-step"]').first().click({ force: true });
    cy.authByKeyPair();

    cy.get(`[status-blocklet-did="${blocklets.authTest}"]`).as('blocklet-status');
    cy.get('@blocklet-status').contains('Installed');
    cy.get('[data-cy="trigger-blocklet-actions"]').click();
    cy.contains('Start').click();
    cy.get('@blocklet-status').contains('Running');

    cy.visit(`/blocklets/${authTestDid}/passports`);

    cy.get('[data-cy="passport-admin"]').click();
    cy.contains('Access resources under the adminUrl interface').click();
    cy.get('[data-cy="bind-permission-btn-confirm"]').click();
  });
});
