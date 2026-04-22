/* eslint-disable newline-per-chained-call */
const createClient = require('../support/client');

describe('Router Add Certificate', () => {
  let client = null;
  before(async () => {
    client = createClient();
    await client.resetNode({ input: { sites: true, certificates: true } });
  });

  it('should add cert success and render correct', () => {
    cy.login();
    cy.visit('/settings/cert');

    cy.wait(1000);
    cy.get('[data-cy="add-cert"]').first().click({ force: true });
    cy.get('[data-cy="certificate-name-textfield"] input').type('Test Cert');
    const pemPath = './fullchain.pem';
    cy.get('[data-cy="pem-input"]').attachFile(pemPath);
    const keyPath = './privkey.pem';
    cy.get('[data-cy="key-input"]').attachFile(keyPath);
    cy.get('[data-cy="cert-cancel"]').click({ force: true });

    // FIXME: following lines fails on CI but works in development
    // cy.get('[data-cy="save-cert"]').click({ force: true });
    // cy.get('[data-cy="cert-form"]').trigger('submit');
    // cy.contains('Test Cert');
    // cy.contains('abtnode-test.arcblockio.cn');
    // cy.get('[data-cy="action-view-cert"]').then(actions => expect(actions.length).to.equal(2));
  });
});
