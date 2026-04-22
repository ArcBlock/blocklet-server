/// <reference types="Cypress" />

const { joinURL } = require('ufo');
const createClient = require('../support/client');

describe('Setup Blocklet Server', () => {
  let client = null;
  before(async () => {
    client = createClient();
    await client.resetNode({ input: { owner: true } });
  });

  beforeEach(() => {
    cy.setCookie('nf_lang', 'en');
    cy.clearCookie('connected_did');
  });

  it('should setup and auto login work as expected', () => {
    cy.visit('/');
    cy.contains('Setup Blocklet Server').should('be.visible');
    cy.contains('End User License Agreement');
    cy.contains('Continue With');

    cy.contains('I have read and agreed to the terms of the EULA').click();
    cy.contains('Continue With').click();

    cy.claim('owner');

    cy.wait(1000);
    cy.url().should('eq', joinURL(client.baseUrl, '/dashboard'));
    cy.log('should auto login after claim and render dashboard');

    cy.reload();
    cy.contains('Overview');
    cy.contains('Storage');
    cy.contains('Environment');
    cy.log('should persist login status when reload page');

    cy.wait(500);
    cy.logout();

    cy.wait(500);
    cy.login();

    cy.wait(1000);
    cy.visit('/dashboard');
    cy.wait(1000);
    cy.get('[data-cy="locale-addon"]').find('button').first().click({ force: true });
    cy.contains('English');
    cy.contains('简体中文');

    cy.get('.locales').find('li').eq(2).click({ force: true });
    cy.contains('概览');
    cy.contains('存储');
    cy.contains('环境');

    cy.wait(500);
    cy.get('[data-cy="locale-addon"]').find('button').first().click({ force: true });
    cy.get('.locales').find('li').eq(0).click({ force: true });
    cy.wait(500);

    cy.get('[data-cy="sessionManager-logout-popup"]').click({ force: true });
    cy.get('[data-cy="sessionManager-switch-profile-trigger"]').click({ force: true });
    cy.switchProfile();
    cy.wait(2000);

    cy.get('[data-cy="sessionManager-logout-popup"]').click({ force: true });
    cy.get('[data-cy="sessionManager-switch-passport-trigger"]').click({ force: true });
    cy.switchPassport();
    cy.wait(500);

    /*
    blocklet-server 里调用了 process-on-spawn, 使用了 process.binding, 而这个在隔离模式里会报错
    (2025-07-17 05:48:03): Error [ERR_ACCESS_DENIED]: process.binding
    (2025-07-17 05:48:03):     at process.binding (node:internal/process/pre_execution:625:13)
    (2025-07-17 05:48:03):     at wrapSpawnFunctions (/home/amark/source/blocklet-server/node_modules/process-on-spawn/index.js:82:35)
    ...
    (2025-07-17 05:48:03):   code: 'ERR_ACCESS_DENIED',
    (2025-07-17 05:48:03):   permission: '',
    (2025-07-17 05:48:03):   resource: ''
    (2025-07-17 05:48:03): }
    */

    cy.visit('/settings');

    // 根据环境变量条件执行 Docker 模式设置
    if (Cypress.env('E2E_ENABLE_DOCKER_MODE')) {
      cy.get('[data-cy="file-system-isolation-switch"]')
        .first()
        .then($switch => {
          if ($switch.hasClass('Mui-checked')) {
            cy.wrap($switch).click({ force: true });
            cy.get('[data-cy="submit-btn"]').first().click({ force: true });
            cy.contains('Settings Saved');
          }
        });
      cy.wait(500);
      cy.get('button').contains('Save Changes').click({ force: true });
      cy.contains('Settings Saved Successfully');

      cy.contains('Run Blocklets in Containers').click({ force: true });
      cy.wait(500);
      cy.contains('Container Network Isolation').click({ force: true });
      cy.wait(500);
      cy.get('button').contains('Save Changes').click({ force: true });
      cy.contains('Settings Saved Successfully');
    }
  });
});
