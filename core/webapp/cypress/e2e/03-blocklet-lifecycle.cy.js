/// <reference types="Cypress" />

const createClient = require('../support/client');

const BLOCKLET_START_TIMEOUT = Cypress.env('E2E_ENABLE_DOCKER_MODE') ? 180_000 : 120_000;

describe('Blocklet Lifecycle', () => {
  let client = null;
  before(async () => {
    client = createClient();
    await client.resetNode({ input: { blocklets: true } });
  });

  it('should blocklet install/start/visit/stop/remove work as expected', () => {
    cy.login();

    cy.setLocalStorage('instant-blocklet-install', true);
    cy.setLocalStorage('skip-blocklet-setup', true);

    cy.visit('/store');

    cy.contains('Find and Install Your Blocklets').should('be.visible');

    // Install
    cy.get('[data-cy=search-blocklet]', { timeout: 5000 }).should('be.visible').type('Static Demo').type('{enter}');
    cy.wait(1000);
    cy.contains('Static Demo').should('be.visible');
    cy.get('[data-cy="install-blocklet"]').first().contains('Launch').click({ force: true });
    cy.wait(1000);
    cy.authByKeyPair();

    // View
    cy.url().should('contain', '/components');
    cy.wait(4000);
    cy.clickOverviewWithRetry();
    cy.contains('Basic Information');

    cy.get('[type="button"]').contains('Domains').click({ force: true });
    cy.contains('Purchase or configure existing domain');
    cy.contains('Default Domains');

    // Start
    cy.contains('Start');
    cy.wait(3000);
    cy.get('[data-cy="start-blocklet"]').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.contains('Running', { timeout: BLOCKLET_START_TIMEOUT });
    cy.log('should start newly installed blocklet');

    // Stop
    cy.contains('Stop');
    cy.wait(2000);
    cy.get('[data-cy="stop-blocklet"]').click({ force: true });
    cy.wait(1000);
    cy.get('body').contains('Stop Static Demo');
    cy.get('body').find('[data-cy="submit-confirm-dialog"]').should('be.visible').click({ force: true });
    cy.log('should stop running blocklet');
    cy.wait(2000);
    cy.contains('Stopped');
    cy.wait(4000);

    // Component
    cy.get('[data-cy="blocklet-list"]').click({ force: true });
    cy.wait(1000);
    cy.get('[data-cy="start-blocklet"]').click({ force: true });
    cy.wait(1000);
    cy.contains('Running', { timeout: BLOCKLET_START_TIMEOUT });
    // 确保有 2 个 Running 状态的文字
    cy.get('span.MuiTypography-root')
      .filter((_, el) => el.textContent.trim() === 'Running')
      .should('have.length', 2, { timeout: BLOCKLET_START_TIMEOUT });

    cy.get('[data-cy="restart-blocklet"]').should('be.visible').and('not.be.disabled').click();
    cy.wait(2000);
    cy.get('[data-cy="submit-confirm-dialog"]').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.contains('Running', { timeout: BLOCKLET_START_TIMEOUT });
    cy.get('span.MuiTypography-root')
      .filter((_, el) => el.textContent.trim() === 'Running')
      .should('have.length', 2, { timeout: BLOCKLET_START_TIMEOUT });

    cy.wait(4000);
    cy.get('[data-cy="check-for-updates"').click();
    cy.contains('No Blocklets to update');
    cy.contains('Add Blocklet').click({ force: true });
    cy.wait(4000);
    cy.log('should install media kit');
    cy.get('[data-cy=search-blocklet]').should('be.visible').first().type('Media Kit').type('{enter}');
    cy.wait(1000);
    cy.get('[data-cy="install-blocklet"]').first().click({ force: true });
    cy.wait(500);
    cy.get('[data-cy="submit-confirm-next"]').first().click({ force: true });
    cy.wait(500);
    cy.get('[data-cy="submit-confirm-next"]').first().click({ force: true });

    // check if the step can be clicked to the previous step
    cy.contains('Introduction').click({ force: true });
    cy.get('[data-cy="submit-confirm-next"]').first().click({ force: true });

    cy.contains("What's the mount point?");
    cy.get('[data-cy="mount-point-input"]').first().type('/demo', { force: true });
    cy.wait(1000);
    cy.get('[data-cy="submit-confirm-next"]').first().click({ force: false });
    cy.wait(1000);
    cy.get('[data-cy="submit-confirm-next"]').first().click({ force: false });
    cy.wait(1000);
    cy.contains('Complete').click();
    cy.wait(2000);

    cy.contains('/demo');
    cy.wait(2000);
    cy.contains('Overview').click();
    cy.contains('Running', { timeout: BLOCKLET_START_TIMEOUT });
    cy.wait(1000);

    cy.get('[data-cy="stop-blocklet"]').click({ force: true });
    cy.wait(1000);
    cy.get('body').find('[data-cy="submit-confirm-dialog"]').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.contains('Stopped');
    cy.get('[data-cy="blocklet-list"]').click();
    cy.contains('/demo');
    cy.wait(2000);

    // check blocklet can config environment
    cy.contains('Add Blocklet').click();
    cy.get('[data-cy=search-blocklet]').should('be.visible').first().type('Blockchain Explorer').type('{enter}');
    cy.wait(2000);
    cy.get('[data-cy="install-blocklet"]').first().click({ force: true });
    cy.get('[data-cy="submit-confirm-next"]').first().click({ force: true });
    cy.get('[data-cy="submit-confirm-next"]').first().click({ force: true });
    cy.get('[data-cy="submit-confirm-next"]').first().click({ force: true });
    cy.get('[data-cy="schema-form-item-edit"]').first().click({ force: true });
    cy.get('[data-cy="schema-form-item-component"]')
      .first()
      .type('https://main.abtnetwork.io/api{enter}', { force: true });

    cy.wait(1000);
    cy.get('[data-cy="submit-confirm-next"]').first().click({ force: true });
    cy.contains('Complete').click();
    cy.contains('Running', { timeout: BLOCKLET_START_TIMEOUT });
    cy.waitUntil(
      () =>
        cy.get('[data-cy="actions-menu-icon"]').then($els => {
          return $els.length === 4;
        }),
      { timeout: 1000 * 10, interval: 1000 }
    );
    cy.get('[data-cy="actions-menu-icon"]').eq(3).click({ force: true });

    cy.wait(2000);
    cy.get('body').find('[role="menu"]').filter(':visible').last().contains('Environments').click({ force: true });
    cy.contains('https://main.abtnetwork.io/api');
    cy.get('.ux-dialog_closeButton').first().click({ force: true });

    cy.wait(3000);
    cy.get('[data-cy="stop-component-btn"]').eq(0).click({ force: true });
    cy.get('[data-cy="submit-confirm-dialog"]').first().click({ force: true });
    cy.wait(2000);

    // remove two components
    cy.get('[data-cy="actions-menu-icon"]').eq(3).click({ force: true });
    cy.wait(1000);
    cy.get('[data-cy="actions-menu-2"]').eq(2).click({ force: true });
    cy.wait(1000);
    cy.get('[data-cy="submit-confirm-dialog"]').first().click({ force: true });
    cy.wait(1500);
    cy.contains('successfully deleted');
    cy.get('[data-cy="actions-menu-icon"]').eq(2).click({ force: true });
    cy.wait(1000);
    cy.get('[data-cy="actions-menu-2"]').eq(1).click({ force: true });
    cy.wait(1500);
    cy.get('[data-cy="submit-confirm-dialog"]').first().click({ force: true });
    cy.contains('successfully deleted');
    cy.wait(1000);

    // Passports: Issuers/ToggleIssuance/Color
    cy.get('[type="button"]').contains('Passport').click({ force: true });
    cy.wait(3000);
    cy.get('[data-cy="trusted-issuers-more"]').click();
    cy.wait(2000);
    cy.contains('"Issue Passport", "Invite Member" and other operations will be disabled');
    cy.get('[data-cy="config-show-issue-passport"]').click();
    cy.wait(2000);
    cy.contains('"Issue Passport", "Invite Member" and other operations will be enabled');
    cy.get('[data-cy="config-show-issue-passport"]').click();
    cy.wait(2000);
    cy.contains('"Issue Passport", "Invite Member" and other operations will be disabled');
    cy.wait(2000);
    cy.get('[data-cy="config-passport-color"]').click();
    cy.wait(2000);
    cy.get('[data-cy="color-btn-confirm"]').click();
    cy.wait(2000);
    cy.get('[data-cy="trusted-issuers-more"]').click();

    // Create new passport
    cy.contains('Guest');
    cy.contains('Manage Passports').click();
    cy.contains('Create Passport').click();
    cy.get('[data-cy="mutate-role-input-title"] input').type('Developer1');
    cy.get('[data-cy="mutate-role-input-description"] textarea').first().type('Developer1 desc');
    cy.get('[data-cy="mutate-role-confirm"]').click();
    cy.contains('Guest');
    cy.contains('Developer1');

    // Configuration
    cy.get('[type="button"]').contains('Configuration').click({ force: true });
    cy.wait(1000);
    // cy.get('[data-cy="configuration-tab-access"').click();
    // cy.wait(1000);
    // cy.get(`[data-cy="btn-edit-${blocklets.staticDemo}"`).click();
    // cy.wait(1000);
    // cy.get('[data-cy="config-access-select"').click();
    // cy.wait(1000);
    // cy.get('[data-cy="config-access-opt-owner"').click();
    // cy.wait(1000);
    // cy.get('[data-cy="config-access-confirm"').click();
    // cy.wait(1000);

    // Insights
    cy.get('[type="button"]').contains('Runtime').click({ force: true });
    cy.get('[data-cy="start-blocklet"]').should('be.visible').click({ force: true });
    cy.contains('Running', { timeout: BLOCKLET_START_TIMEOUT });
    cy.contains('CPU');
    cy.contains('Memory');
    cy.contains('Uptime');

    // Traffic
    cy.get('[type="button"]').contains('Traffic').click({ force: true });
    cy.contains('Trends');
    cy.contains('Breakdown');

    // navigation
    cy.get('[type="button"]').contains('Navigation').click({ force: true });
    cy.wait(1000);
    cy.contains('Header');
    cy.contains('Footer');
    cy.contains('Footer Link');
    cy.contains('Footer Social');
    cy.contains('Dashboard');
    cy.contains('Session Blocklet');
    cy.contains('User Center');
    cy.contains('Config');
    cy.contains('Preview');

    // did spaces
    cy.get('[type="button"]').contains('DID Spaces').click({ force: true });
    cy.wait(1000);
    cy.contains('DID Spaces');

    // Remove
    cy.contains('Remove');
    cy.wait(2000);
    cy.get('[data-cy="remove-blocklet"]').should('be.visible').should('not.be.disabled').click({ force: true });
    cy.wait(2000);
    cy.get('body').contains('Remove Static Demo');
    cy.get('body').find('[data-cy="submit-confirm-dialog"]').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('should remove stopped blocklet');

    // Now the list is empty
    cy.wait(4000);
    cy.url().should('contain', '/blocklets');
    cy.get('body').contains('No blocklets found in this Blocklet Server');
    cy.log('should return to blocklet list page after remove');
  });
});
