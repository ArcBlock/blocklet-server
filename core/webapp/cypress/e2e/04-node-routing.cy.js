const createClient = require('../support/client');

describe('Node Routing: Blocklet', () => {
  let client = null;
  before(async () => {
    client = createClient();
    await client.resetNode({ input: { blocklets: true, sites: true } });
  });

  it('should Domains & URLs page and site list correctly', () => {
    cy.login();
    cy.visit('/settings/router/');

    cy.contains('Domains & URLs').should('be.visible');
    cy.contains('SSL Certificates');
    cy.wait(200);

    cy.get('[data-cy="rule-domain"]').then(domains => expect(domains.length).to.equal(2));
    cy.get('[data-cy="action-trigger"]').then(triggers => expect(triggers.length).to.equal(2));

    // TODO: add more tests for default site and dashboard
  });
});
