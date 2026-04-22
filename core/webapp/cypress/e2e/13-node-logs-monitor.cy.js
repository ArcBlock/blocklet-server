/* eslint-disable newline-per-chained-call */
const { joinURL } = require('ufo');
const createClient = require('../support/client');

describe('Node Logs', () => {
  let client = null;
  before(async () => {
    client = createClient();
    await client.resetNode({ input: { blocklets: true } });
  });

  it('should logs page and monitor page work', () => {
    cy.login();

    cy.visit('/logs/abtnode');
    cy.url().should('eq', `${joinURL(client.baseUrl, '/logs/abtnode')}`);
    cy.contains('Error').should('be.visible');
    cy.contains('Info');
    cy.contains('Access');

    cy.visit('/analytics/runtime');

    cy.wait(2000);

    // FIXME: 如果不打开过这个页面，runtime 没有返回内容
    cy.contains('Blocklets').click();
    cy.wait(2000);

    cy.contains('Analytics').click();
    cy.wait(2000);
    cy.contains('Runtime').click();

    cy.contains('CPU').should('be.visible');
    cy.contains('Memory');
    cy.contains('Uptime');
    cy.contains('Group');
  });
});
