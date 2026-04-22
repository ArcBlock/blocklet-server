const { fromRandom } = require('@ocap/wallet');
const Mcrypto = require('@ocap/mcrypto');
const createClient = require('../support/client');
const blocklets = require('../fixtures/blocklets');

const appWallet = fromRandom({ role: Mcrypto.types.RoleType.ROLE_APPLICATION });

describe('Blocklet Launch Workflow: Free - Session', () => {
  let client = null;
  before(async () => {
    client = createClient();
    await client.resetNode({ input: { blocklets: true } });
  });

  it('should launch free blocklet without session works as expected', () => {
    cy.logout();
    cy.setLocalStorage('instant-blocklet-install', false);
    cy.setLocalStorage('skip-blocklet-setup', true);
    cy.visit(blocklets.launchExplorer);

    cy.contains('Blockchain Explorer').should('be.visible');

    cy.get('[data-cy="agree-all"] button').contains('Agree').click({ timeout: 10_000 });

    cy.authByVCAndKeyPair({ appSk: appWallet.secretKey });

    cy.wait(3000);
    cy.contains('installed').should('be.visible');
    cy.contains('successfully');
    cy.get('[data-cy="open-blocklet"]').contains('Open');

    cy.wait(1000);
    cy.visit('/blocklets');
    cy.wait(1000);
    cy.contains('Installed').should('be.visible');
  });
});
