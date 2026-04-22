const { fromRandom } = require('@ocap/wallet');
const Mcrypto = require('@ocap/mcrypto');
const createClient = require('../support/client');
const blocklets = require('../fixtures/blocklets');

const appWallet = fromRandom({ role: Mcrypto.types.RoleType.ROLE_APPLICATION });

describe('Blocklet Launch Workflow: Free + Session', () => {
  // eslint-disable-next-line no-unused-vars
  let client = null;
  before(async () => {
    client = createClient();
    await client.resetNode({ input: { blocklets: true } });
  });

  it('should launch free blocklet with existing session works as expected', () => {
    cy.login();
    cy.setLocalStorage('instant-blocklet-install', false);
    cy.setLocalStorage('skip-blocklet-setup', true);
    cy.visit('/store');

    // Install
    cy.contains('Find and Install Your Blocklets').should('be.visible');
    cy.wait(3000); // Wait for page to fully stabilize

    // Type with delay to avoid element detachment during React re-renders
    cy.get('[data-cy=search-blocklet]').should('be.visible').first().type('Static Demo', { delay: 100 });
    cy.wait(500);
    cy.get('[data-cy=search-blocklet]').first().type('{enter}');
    cy.wait(4000);
    cy.contains('Static Demo').should('be.visible');
    cy.get('[data-cy="install-blocklet"]').first().contains('Launch').click({ timeout: 10_000 });

    cy.get('[data-cy="agree-all"] button').contains('Agree').click({ timeout: 10_000 });

    cy.wait(1000);

    cy.authByKeyPair({ appSk: appWallet.secretKey });

    cy.contains('successfully', { timeout: 90000 });
    cy.get('[data-cy="open-blocklet"]').contains('Open');

    cy.wait(1000);
    cy.visit('/blocklets');
    cy.contains('Installed').should('be.visible');

    // launch existing
    cy.wait(1000);
    cy.visit(blocklets.launchStatic(appWallet.address));
    cy.contains('Static Demo').should('be.visible');
    cy.contains('is already installed').should('be.visible');
    cy.contains('View Application').should('be.visible');
    cy.get('.step-block').its('length').should('be.equal', 3);

    // launch existing(Agreed)
    cy.wait(1000);
    cy.visit(blocklets.launchStaticAgreed(appWallet.address));
    cy.contains('Static Demo').should('be.visible');
    cy.contains('already exists').should('be.visible');
    cy.get('[data-cy="open-blocklet"]').contains('Open');
    cy.get('.step-block').its('length').should('be.equal', 4);
  });
});
