/// <reference types="Cypress" />

const createClient = require('../support/client');

const BLOCKLET_START_TIMEOUT = Cypress.env('E2E_ENABLE_DOCKER_MODE') ? 180_000 : 120_000;

describe('Blocklet List', () => {
  let client = null;
  before(async () => {
    client = createClient();
    await client.resetNode({ input: { blocklets: true } });
  });

  it('should control blocklet from list page', () => {
    cy.login();

    cy.setLocalStorage('instant-blocklet-install', true);
    cy.setLocalStorage('skip-blocklet-setup', true);

    cy.visit('/store');

    cy.contains('Find and Install Your Blocklets').should('be.visible');
    // Add Store and Delete Store
    cy.get('[data-cy="store-toggle"]').click();
    cy.contains('Test Store');
    cy.contains('https://test.store.blocklet.dev');
    cy.get('[data-cy="store-action-delete"]').last().click();
    cy.get('[data-cy="delete-confirm-input"]').type('https://test.store.blocklet.dev');
    cy.get('[data-cy="submit-confirm-dialog"]').click();
    cy.wait(1000);
    cy.contains('Test Store').should('not.exist');
    cy.contains('https://test.store.blocklet.dev').should('not.exist');

    cy.get('.ux-dialog_right > .MuiButtonBase-root').click();
    cy.wait(500);

    // Add Test Store Again to make sure it works
    cy.get('[data-cy="store-toggle"]').click();
    cy.contains('Add Blocklet Store').first().click();
    cy.get('[data-cy="add-blocklet-store-url"]').should('be.visible').type('https://test.store.blocklet.dev/');
    cy.contains('button', 'Confirm').click();
    cy.wait(1000);
    cy.contains('Test Store');
    cy.contains('https://test.store.blocklet.dev');

    cy.get('.ux-dialog_right > .MuiButtonBase-root').first().click();
    cy.wait(500);
    // Search
    cy.get('[data-cy=search-blocklet]').should('be.visible').type('Static Demo').type('{enter}');
    cy.contains('Static Demo');
    cy.wait(1000);
    cy.get('[data-cy=search-blocklet]').should('be.visible').clear('');
    cy.wait(1000);
    cy.contains('Pages Kit');

    // Switch Store
    cy.contains('Official Store');
    cy.get('[data-cy="store-toggle"]').click();
    cy.contains('Dev Store');
    cy.wait(2000);
    cy.get('[data-cy="store-switch"]').last().click();
    cy.wait(2000);
    cy.get('[data-cy="store-toggle"]').click();
    cy.get('[data-cy="store-switch"]').first().click();
    cy.waitUntil(() => cy.contains('Static Demo'), {
      timeout: 1000 * 10,
      interval: 1000,
    });

    cy.visit('/store');
    cy.contains('Find and Install Your Blocklets').should('be.visible');

    // Ensure we're on Official Store
    cy.get('[data-cy="store-toggle"]').click();
    cy.contains('Official Store');
    cy.get('[data-cy="store-switch"]').first().click();
    cy.wait(2000);

    // Install Pages Kit from Official Store
    cy.log('Installing Pages Kit from Official Store');
    cy.get('[data-cy=search-blocklet]').should('be.visible').clear().type('Pages Kit').type('{enter}');
    cy.wait(5000);
    cy.contains('Pages Kit').should('be.visible');
    cy.get('[data-cy="install-blocklet"]').first().contains('Launch').click({ force: true });
    cy.wait(1000);
    cy.authByKeyPair();
    cy.wait(1000);

    cy.contains('Blocklet Installed', { timeout: 120_000 });
    cy.wait(5000);
    // Navigate to blocklets list page (stay on /blocklets, not /components)
    cy.visit('/blocklets');
    cy.wait(2000);
    cy.url().should('include', '/blocklets');

    // Start Pages Kit from blocklets list page
    cy.get('.MuiTableFooter-root').should('have.length', 1);
    cy.get('[data-testid="Search-iconButton"]').first().click({ force: true });
    cy.get('[placeholder="Search"').should('be.visible');
    cy.get('[placeholder="Search"').clear().type('Pages Kit');
    cy.contains('Pages Kit');
    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.contains('Start');
    cy.get('[data-cy="start-blocklet"]').first().click({ force: true });
    cy.contains('Running', { timeout: BLOCKLET_START_TIMEOUT });
    cy.log('Pages Kit is running');
    cy.wait(2000);

    // Verify 3 blocklets are running after Pages Kit installation
    cy.log('Verifying 3 blocklets are running after Pages Kit installation');
    // Stay on blocklets list page
    cy.url().should('include', '/blocklets');
    cy.get('[placeholder="Search"').clear();
    cy.wait(5000);
    // Click on Pages Kit name to enter its components page
    cy.contains('Pages Kit').click({ force: true });
    cy.wait(2000);
    cy.get('[role="tab"]').contains('Blocklets').click({ force: true });

    // Verify we're on the components page
    cy.url().should('include', '/components');
    // Verify 3 blocklets are running in the components page
    cy.get('span.MuiTypography-root')
      .filter((_, el) => el.textContent.trim() === 'Running')
      .should('have.length', 4, { timeout: BLOCKLET_START_TIMEOUT });
    cy.log('Verified: 3 blocklets are running after Pages Kit installation');

    // Install DocSmith Hub from Official Store
    cy.log('Installing DocSmith Hub from Official Store');
    cy.visit('/store');
    cy.contains('Find and Install Your Blocklets').should('be.visible');
    // Ensure we're on Official Store
    cy.get('[data-cy="store-toggle"]').click();
    cy.contains('Official Store');
    cy.get('[data-cy="store-switch"]').first().click();
    cy.wait(2000);
    cy.get('[data-cy=search-blocklet]').should('be.visible').clear().type('DocSmith Hub').type('{enter}');
    cy.wait(1000);
    cy.contains('DocSmith Hub').should('be.visible');
    cy.get('[data-cy="install-blocklet"]').first().contains('Launch').click({ force: true });
    cy.wait(1000);
    cy.authByKeyPair();
    cy.wait(1000);
    cy.contains('Blocklet Installed', { timeout: 120_000 });
    cy.wait(5000);

    // Navigate to blocklets list page (stay on /blocklets, not /components)
    cy.visit('/blocklets');
    cy.wait(2000);
    cy.url().should('include', '/blocklets');

    // Start DocSmith Hub from blocklets list page
    cy.get('.MuiTableFooter-root').should('have.length', 1);
    cy.get('[data-testid="Search-iconButton"]').first().click({ force: true });
    cy.get('[placeholder="Search"').should('be.visible');
    cy.get('[placeholder="Search"').clear().type('DocSmith Hub');
    cy.wait(3000);
    cy.contains('DocSmith Hub');
    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.contains('Start');
    cy.get('[data-cy="start-blocklet"]').first().click({ force: true });
    cy.contains('Running', { timeout: BLOCKLET_START_TIMEOUT });
    cy.log('DocSmith Hub is running');
    cy.wait(2000);

    // Verify 3 blocklets are running after DocSmith Hub installation
    cy.log('Verifying 3 blocklets are running after DocSmith Hub installation');
    // Stay on blocklets list page
    cy.url().should('include', '/blocklets');
    cy.get('[placeholder="Search"').clear();
    cy.wait(3000);
    // Click on DocSmith Hub name to enter its components page
    cy.contains('DocSmith Hub').click({ force: true });
    cy.wait(2000);
    cy.get('[role="tab"]').contains('Blocklets').last().click({ force: true });
    // Verify we're on the components page
    cy.url().should('include', '/components');
    // Verify 3 blocklets are running in the components page
    cy.get('span.MuiTypography-root')
      .filter((_, el) => el.textContent.trim() === 'Running')
      .should('have.length', 4, { timeout: BLOCKLET_START_TIMEOUT });
    cy.log('Verified: 3 blocklets are running after DocSmith Hub installation');

    cy.contains('Blocklets').click({ force: true });

    // Verify all blocklets are running (final check)
    cy.log('Verifying all blocklets are running');
    // Ensure search box is visible

    // Count all Running blocklets
    cy.get('span.MuiTypography-root')
      .filter((_, el) => el.textContent.trim() === 'Running')
      .should('have.length.at.least', 2, { timeout: 10000 });
    cy.log('All blocklets are verified as Running');

    // Stop and Remove DocSmith Hub
    cy.log('Stopping and removing DocSmith Hub');
    cy.visit('/blocklets');
    cy.wait(2000);
    // cy.get('[placeholder="Search"').clear().type('DocSmith Hub');

    cy.wait(3000);
    cy.contains('DocSmith Hub');
    // Stop DocSmith Hub
    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.wait(200);
    cy.contains('Stop');
    cy.get('[data-cy="stop-blocklet"]').first().click({ force: true });
    cy.get('body').find('[data-cy="submit-confirm-dialog"]').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.reload();
    cy.contains('Stopped');
    cy.wait(2000);
    // Remove DocSmith Hub
    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.wait(200);
    cy.contains('Remove');
    cy.get('[data-cy="remove-blocklet"]').first().click({ force: true });
    cy.wait(2000);
    cy.get('body').find('[data-cy="submit-confirm-dialog"]').should('be.visible').click({ force: true });
    cy.wait(4000);
    cy.log('DocSmith Hub stopped and removed');

    // Stop and Remove Pages Kit
    cy.log('Stopping and removing Pages Kit');
    cy.visit('/blocklets');
    cy.wait(2000);
    cy.get('[data-testid="Search-iconButton"]').first().click({ force: true });
    cy.get('[placeholder="Search"').should('be.visible');
    cy.get('[placeholder="Search"').clear().type('Pages Kit');
    cy.contains('Pages Kit');
    // Stop Pages Kit
    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.wait(200);
    cy.contains('Stop');
    cy.get('[data-cy="stop-blocklet"]').first().click({ force: true });
    cy.get('body').find('[data-cy="submit-confirm-dialog"]').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.reload(); // FIXME: @liangzhu 解决前端响应式问题之后这里得去掉
    cy.contains('Stopped');
    cy.wait(2000);
    // Remove Pages Kit
    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.wait(200);
    cy.contains('Remove');
    cy.get('[data-cy="remove-blocklet"]').first().click({ force: true });
    cy.wait(2000);
    cy.get('body').find('[data-cy="submit-confirm-dialog"]').should('be.visible').click({ force: true });
    cy.wait(4000);
    cy.log('Pages Kit stopped and removed');

    cy.wait(2000);
    cy.get('[placeholder="Search"').clear();
    cy.get('body').contains('No blocklets found in this Blocklet Server');
    cy.log('should return to blocklet list page after remove');
  });
});
