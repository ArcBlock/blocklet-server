/// <reference types="Cypress" />
const { fromRandom } = require('@ocap/wallet');
const Mcrypto = require('@ocap/mcrypto');
const createClient = require('../support/client');

const type = { role: Mcrypto.types.RoleType.ROLE_APPLICATION };

const ipEchoDNSAppWallet = fromRandom(type);
const staticDemoAppWallet = fromRandom(type);

describe('Blocklet Routing', () => {
  // eslint-disable-next-line no-unused-vars
  let client = null;
  before(async () => {
    client = createClient();
    await client.resetNode({ input: { blocklets: true, sites: true } });
  });

  it('should install ip echo dns from url correct', () => {
    cy.login();
    cy.setLocalStorage('instant-blocklet-install', true);
    cy.setLocalStorage('skip-blocklet-setup', true);
    cy.visit('/settings/basic');
    cy.wait(1000);
    // close file system isolation
    let closedFileSystemIsolation = false;
    cy.get('[data-cy="file-system-isolation-switch"]')
      .first()
      .then($switch => {
        if ($switch.hasClass('Mui-checked')) {
          cy.wrap($switch).click({ force: true });
          cy.get('[data-cy="submit-btn"]').first().click({ force: true });
          cy.contains('Settings Saved');
          closedFileSystemIsolation = true;
        }
      });
    cy.visit('/blocklets');
    cy.wait(1000);

    cy.get('[data-cy="open-install-menu"]').first().click({ force: true });
    cy.contains('Install From Url');
    cy.get('[data-cy="open-install-form"]').first().click({ force: true });
    cy.get('[data-cy="blocklet-url-input"]').type(`${Cypress.env('static-server-url')}/ip-echo-dns-1.4.4.json`);
    cy.get('[data-cy="install-blocklet-next-step"]').first().click({ force: true });
    cy.contains('IP Echo DNS');
    cy.contains('Name');
    cy.contains('Version');
    cy.contains('DID');
    cy.contains('Author');
    cy.contains('Download Link');
    cy.get('[data-cy="install-blocklet-next-step"]').first().click({ force: true });

    cy.authByKeyPair({ appSk: ipEchoDNSAppWallet.secretKey });
    cy.contains(`[status-blocklet-did="${ipEchoDNSAppWallet.address}"]`, 'Installed');
    cy.wait(1000);

    // 忽略 docker 启动 IP Echo DNS
    cy.contains('Settings').click();
    cy.wait(2000);
    cy.contains('Run Blocklets in Containers').find('input[type="checkbox"]').uncheck();
    cy.wait(200);
    cy.contains('Container Network Isolation').find('input[type="checkbox"]').uncheck();
    cy.wait(200);
    cy.get('button').contains('Save Changes').click();
    cy.wait(200);
    cy.contains('Settings Saved Successfully');
    cy.visit('/blocklets');

    cy.wait(1000);
    cy.get(`[actions-blocklet-did="${ipEchoDNSAppWallet.address}"]`).as('blocklet-actions');
    cy.get('@blocklet-actions').first().click({ force: true });
    cy.contains('start');
    cy.wait(200);
    cy.get('[data-cy="start-blocklet"]').first().click({ force: true });
    cy.contains('Running');
    cy.wait(2000);

    if (closedFileSystemIsolation) {
      // open file system isolation
      cy.visit('/settings/basic');
      cy.wait(1000);
      cy.get('[data-cy="file-system-isolation-switch"]').should('not.have.class', 'Mui-checked');
      cy.get('[data-cy="file-system-isolation-switch"]').first().click({ force: true });
      cy.get('[data-cy="submit-btn"]').first().click({ force: true });
      cy.contains('Settings Saved');
      cy.contains('Blocklets').click({ force: true });
      cy.wait(1000);
    }

    // it('should install static demo from url correct', () => {
    cy.get('[data-cy="open-install-menu"]').first().click({ force: true });
    cy.contains('Install From Url');
    cy.get('[data-cy="open-install-form"]').first().click({ force: true });
    cy.get('[data-cy="blocklet-url-input"]')
      .first()
      .type(`${Cypress.env('static-server-url')}/static-demo-1.1.5.json`);
    cy.get('[data-cy="install-blocklet-next-step"]').first().click({ force: true });
    cy.wait(500);
    cy.contains('Static Demo');
    cy.contains('Name');
    cy.contains('Version');
    cy.contains('DID');
    cy.contains('Author');
    cy.contains('Download Link');
    cy.get('[data-cy="install-blocklet-next-step"]').first().click({ force: true });
    cy.authByKeyPair({ appSk: staticDemoAppWallet.secretKey });
    cy.contains(`[status-blocklet-did="${staticDemoAppWallet.address}"]`, 'Installed');
    cy.wait(1000);

    // it('should start static demo correct', () => {
    cy.get('[data-cy="trigger-blocklet-actions"]').eq(1).click({ force: true });
    cy.contains('start');
    cy.wait(200);
    cy.get('[data-cy="start-blocklet"]').eq(1).click({ force: true });
    cy.contains('[data-cy="blocklet-status"]', 'Running');
    // it('should go router rules pages and render correct', () => {
    cy.contains('Static Demo').click();
    cy.contains('Configuration').click();
    cy.wait(800);

    // it('should add domain alias work', () => {
    // Add domain alias for the domain
    cy.contains('Domains').click();
    cy.get('[data-cy="add-domain-alias"]').first().not('.Mui-disabled').click({ force: true });
    cy.get('[data-cy="domain-name-input"]').type('2048.abtnode-test.com');
    cy.get('[data-cy="confirm-add-domain"]').first().click({ force: true });
    cy.wait(1000);
    cy.contains('2048.abtnode-test.com');

    // it('should add url mapping work correct', () => {
    // Add redirect
    cy.get('[data-cy="blocklet-list"]').click({ force: true });
    cy.wait(800);

    cy.get('[data-cy="actions-menu-icon"]').eq(0).click({ force: true });
    cy.get('[data-cy="actions-menu-0"]').eq(0).click({ force: true });
    cy.get('[data-cy="path-prefix-input"]').first().type('/old');
    cy.get('[role="combobox"]').first().click({ force: true });
    cy.get('[data-value="redirect"]').first().click({ force: true });
    cy.get('[data-cy="redirect-url-input"]').first().type('/new');
    cy.get('[data-cy="submit-confirm-dialog"').first().click({ force: true });
    cy.wait(200);
    cy.contains('/old', { timeout: 100 * 1000 });
    cy.contains('/new');

    cy.get('[data-cy="edit-mount-point"]').first().click({ force: true });
    cy.get('[data-cy="edit-mount-point-input"]').first().type('new-mount-point');
    cy.get('[data-cy="edit-mount-point-submit"]').first().click({ force: true });

    // Verify the confirmation dialog content
    cy.contains('Notice');
    // Click confirm button in the dialog
    cy.get('[data-cy="edit-mount-point-confirm"]').first().click({ force: true });

    cy.wait(200);
    cy.contains('/new-mount-point');

    // it('should add url mapping for default correctly', () => {
    cy.visit('/settings/router/');
    cy.reload();

    cy.wait(2000);
    cy.get('[data-cy="action-trigger"]').eq(1).click({ force: true });
    cy.get('[data-cy="action-add-domain-alias"]').eq(0).click({ force: true });
    cy.get('[data-cy="domain-name-input"]').first().type('www.arcblockio.cn', { force: true });
    cy.get('[data-cy="submit-confirm-dialog"').first().click({ force: true });
    cy.wait(2000);
    cy.contains('www.arcblockio.cn');
  });
});
