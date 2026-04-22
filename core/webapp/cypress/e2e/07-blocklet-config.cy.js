/* eslint-disable newline-per-chained-call */
const { fromRandom } = require('@ocap/wallet');
const Mcrypto = require('@ocap/mcrypto');
const createClient = require('../support/client');

const appWallet = fromRandom({ role: Mcrypto.types.RoleType.ROLE_APPLICATION });

describe('Blocklet Config', () => {
  // eslint-disable-next-line no-unused-vars
  let client = null;
  before(async () => {
    client = createClient();
    const result = await client.resetNode({ input: { blocklets: true } });
    // eslint-disable-next-line no-console
    console.log('reset blocklets', result);
  });

  it('should install kitchen sink demo from url correct', () => {
    cy.login();
    cy.setLocalStorage('instant-blocklet-install', true);
    cy.visit('/blocklets');

    cy.wait(1000);
    cy.get('[data-cy="open-install-menu"]').first().click({ force: true });
    cy.contains('Install From Url');
    cy.get('[data-cy="open-install-form"]').first().click({ force: true });
    cy.get('[data-cy="blocklet-url-input"]').type(
      `${Cypress.env('static-server-url')}/kitchen-sink-blocklet-1.3.5.json`
    );
    cy.get('[data-cy="install-blocklet-next-step"]').first().click({ force: true });
    cy.contains('Kitchen Sink');
    cy.get('[data-cy="install-blocklet-next-step"]').first().click({ force: true });
    cy.authByKeyPair({ appSk: appWallet.secretKey });

    cy.contains(`[status-blocklet-did="${appWallet.address}"]`, 'Installed');

    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.contains('Start');
    cy.contains('Kitchen Sink').click({ force: true });
    cy.contains('Configuration').click();

    // it('should update config work correct', () => {
    cy.wait(2000);
    cy.get('[data-cy="schema-form-item-edit"]').eq(0).click({ force: true });
    cy.focused().clear().type('test_example_com');
    cy.wait(200);
    cy.get('[data-cy="schema-form-item-confirm"]').first().click({ force: true });
    cy.contains('test_example_com');
  });
});
