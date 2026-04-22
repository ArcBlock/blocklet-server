/// <reference types="Cypress" />

const createClient = require('../support/client');

const BLOCKLET_START_TIMEOUT = Cypress.env('E2E_ENABLE_DOCKER_MODE') ? 180_000 : 120_000;
const DID_DNS_URL = 'https://store.blocklet.dev/api/blocklets/z8iZirivf1NFYYv9JakU3fSwaGE1Lf9CETPMm/blocklet.json';

describe('DID DNS', () => {
  let client = null;
  before(async () => {
    client = createClient();
    await client.resetNode({ input: { blocklets: true } });
  });

  it('should install DID DNS from url and manage its lifecycle', () => {
    if (Cypress.env('E2E_ENABLE_DOCKER_MODE')) {
      cy.log('Skipping DID DNS test in docker mode');
      return;
    }

    cy.login();

    cy.setLocalStorage('instant-blocklet-install', true);
    cy.setLocalStorage('skip-blocklet-setup', true);

    cy.visit('/blocklets');
    cy.wait(1000);

    // Install DID DNS from URL
    cy.log('Installing DID DNS from URL');
    cy.get('[data-cy="open-install-menu"]').first().click({ force: true });
    cy.contains('Install From Url');
    cy.get('[data-cy="open-install-form"]').first().click({ force: true });
    cy.get('[data-cy="blocklet-url-input"]').type(DID_DNS_URL);
    cy.get('[data-cy="install-blocklet-next-step"]').first().click({ force: true });

    // Verify blocklet info is displayed
    cy.contains('DID DNS');
    cy.contains('Name');
    cy.contains('Version');
    cy.contains('DID');
    cy.contains('Author');
    cy.contains('Download Link');

    // Proceed with installation
    cy.get('[data-cy="install-blocklet-next-step"]').first().click({ force: true });
    cy.authByKeyPair();
    cy.wait(1000);
    cy.reload();

    cy.contains('Blocklet Installed', { timeout: 120_000 });
    cy.wait(5000);

    // Navigate to blocklets list page
    cy.visit('/blocklets');
    cy.wait(2000);
    cy.url().should('include', '/blocklets');

    // Start DID DNS from blocklets list page
    cy.log('Starting DID DNS');
    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.contains('Start'); // Wait for menu to open and Start option to appear
    cy.get('[data-cy="start-blocklet"]').first().click({ force: true });
    cy.contains('Running', { timeout: BLOCKLET_START_TIMEOUT });
    cy.log('DID DNS is running');
    cy.wait(2000);

    // Verify DID DNS is running
    cy.log('Verifying DID DNS is running');
    cy.url().should('include', '/blocklets');

    // Configure IP_ECHO_DOMAIN environment variable via Environments menu
    cy.log('Configuring IP_ECHO_DOMAIN environment variable');
    cy.contains('DID DNS').click({ force: true });
    cy.wait(2000);
    cy.get('[role="tab"]').contains('Blocklets').click({ force: true });
    cy.wait(2000);

    // Click the actions menu on the component row and select Environments
    cy.get('[data-cy="actions-menu-icon"]').first().click({ force: true });
    cy.wait(500);
    cy.get('body').find('[role="menu"]').filter(':visible').last().contains('Environments').click({ force: true });
    cy.wait(1000);

    // Find and edit IP_ECHO_DOMAIN in the Environments dialog (MaterialTable)
    // Click the edit button on the IP_ECHO_DOMAIN row
    cy.contains('tr', 'IP_ECHO_DOMAIN').find('button[aria-label="Edit"]').click({ force: true });
    cy.wait(500);

    // In edit mode, find the Value input field (second input in the row) and enter the new value
    // Then press Enter to confirm
    cy.get('.MuiDialog-root input').eq(1).clear().type('ip_env.abtnet.io{enter}');
    cy.wait(1000);
    cy.contains('ip_env.abtnet.io');

    // Close the dialog
    cy.get('.ux-dialog_closeButton').first().click({ force: true });
    cy.wait(500);
    cy.log('IP_ECHO_DOMAIN configured');

    // Stop DID DNS first, then start it again
    cy.log('Stopping DID DNS to apply environment variable changes');
    cy.visit('/blocklets');
    cy.wait(2000);
    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.wait(200);
    cy.contains('Stop');
    cy.get('[data-cy="stop-blocklet"]').first().click({ force: true });
    cy.get('body').find('[data-cy="submit-confirm-dialog"]').should('be.visible').click({ force: true });
    cy.contains('Stopped', { timeout: BLOCKLET_START_TIMEOUT });
    cy.log('DID DNS stopped');
    cy.wait(2000);

    // Start DID DNS again
    cy.log('Starting DID DNS');
    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.wait(200);
    cy.contains('Start');
    cy.get('[data-cy="start-blocklet"]').first().click({ force: true });
    cy.contains('Running', { timeout: BLOCKLET_START_TIMEOUT });
    cy.log('DID DNS started and running');
    cy.wait(3000);

    // Test DNS resolution with dig command
    cy.log('Testing DNS resolution');

    // Check for port redirection (similar to ABT_NODE_REDIRECTION_SERVICE_PORTS logic)
    cy.exec('echo $ABT_NODE_REDIRECTION_SERVICE_PORTS', { failOnNonZeroExit: false }).then(envResult => {
      let dnsPort = 53;
      const redirectionPorts = envResult.stdout.trim();

      if (redirectionPorts) {
        redirectionPorts.split(',').forEach(portString => {
          const [portA, portB] = portString.split(':');
          if (+portA === 53) {
            dnsPort = +portB;
          }
        });
      }

      cy.log(`Using DNS port: ${dnsPort}`);

      // Pre-check: Test if DNS service is responding at all with a simple query
      cy.exec(`dig version.bind chaos txt @127.0.0.1 -p ${dnsPort} +short +time=2`, {
        failOnNonZeroExit: false,
        timeout: 10000,
      }).then(preCheckResult => {
        cy.log('[Pre-check] DNS service response test:');
        cy.log(preCheckResult.stdout || '(no response)');
        if (preCheckResult.stderr) {
          cy.log('[Pre-check stderr]');
          cy.log(preCheckResult.stderr);
        }
      });

      // Use +time=2 for 2 second timeout, +tries=1 to not retry internally
      const digCommand = `dig 1-1-1-1.ip_env.abtnet.io @127.0.0.1 -p ${dnsPort} +time=2 +tries=1`;

      if (!Cypress.env('E2E_ENABLE_DOCKER_MODE')) {
        // Helper function to execute dig with retry on timeout (max 10 retries)
        const executeDigWithRetry = (retryCount = 0, maxRetries = 10) => {
          cy.log(`Executing (attempt ${retryCount + 1}/${maxRetries + 1}): ${digCommand}`);
          cy.exec(digCommand, { failOnNonZeroExit: false, timeout: 10000 }).then(result => {
            cy.log('[dig stdout]');
            cy.log(result.stdout || '(empty)');
            cy.log('[dig stderr]');
            cy.log(result.stderr || '(empty)');
            cy.log(`[dig exit code] ${result.code}`);

            // Check if it's a timeout error
            const isTimeout =
              result.stdout.includes('timed out') ||
              result.stdout.includes('no servers could be reached') ||
              result.stderr.includes('timed out');

            if (isTimeout && retryCount < maxRetries) {
              cy.log(`Dig command timed out, retrying in 3 seconds... (attempt ${retryCount + 1}/${maxRetries})`);
              cy.wait(3000);
              executeDigWithRetry(retryCount + 1, maxRetries);
            } else {
              // Verify the DNS A record response: 1-1-1-1.ip_env.abtnet.io. <TTL> IN A 1.1.1.1
              expect(result.stdout).to.match(/1-1-1-1\.ip_env\.abtnet\.io\.\s+\d+\s+IN\s+A\s+1\.1\.1\.1/);
              cy.log('DNS A record verified: 1-1-1-1.ip_env.abtnet.io -> 1.1.1.1');
            }
          });
        };

        executeDigWithRetry();
      }
    });
    cy.log('DNS resolution test passed');

    // Stop and Remove DID DNS
    cy.log('Stopping and removing DID DNS');
    cy.visit('/blocklets');
    cy.wait(2000);

    // Stop DID DNS
    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.wait(200);
    cy.contains('Stop');
    cy.get('[data-cy="stop-blocklet"]').first().click({ force: true });
    cy.get('body').find('[data-cy="submit-confirm-dialog"]').should('be.visible').click({ force: true });
    cy.contains('Stopped');
    cy.wait(2000);

    // Remove DID DNS
    cy.get('[data-cy="trigger-blocklet-actions"]').first().click({ force: true });
    cy.wait(200);
    cy.contains('Remove');
    cy.get('[data-cy="remove-blocklet"]').first().click({ force: true });
    cy.wait(2000);
    cy.get('body').find('[data-cy="submit-confirm-dialog"]').should('be.visible').click({ force: true });
    cy.wait(4000);
    cy.log('DID DNS stopped and removed');

    cy.wait(2000);
    cy.get('body').contains('No blocklets found in this Blocklet Server');
    cy.log('should return to blocklet list page after remove');
  });
});
