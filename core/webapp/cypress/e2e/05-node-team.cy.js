const createClient = require('../support/client');

describe('Node Team', () => {
  // eslint-disable-next-line no-unused-vars
  let client = null;
  const createInvitationSuccessTip = 'The invitation link is successfully created, click to copy and send the link to the invited member, please note that this invitation link can not be reused and will expire on'; // prettier-ignore
  before(async () => {
    client = createClient();
    await client.resetNode({ input: { blocklets: true, users: true, invitations: true } });
  });

  it('should team settings page work correctly', () => {
    cy.login('owner');

    // Passport List
    cy.visit('/team/passports');
    cy.contains('Manage Passports').click();
    cy.contains('Owner').should('be.visible');
    cy.contains('Admin');
    cy.contains('Member');
    cy.contains('Guest');

    // Passport popup
    cy.get('[data-cy="passport-admin"]').click();
    cy.contains('Change node setting');
    cy.get('.ux-dialog_closeButton').last().click();
    cy.get('.ux-dialog_closeButton').last().click();

    // Trusted passport issuers
    cy.get('[data-cy="trusted-issuers-more"]').click();
    cy.get('[data-cy="config-trusted-issuers"]').click();
    cy.get('[data-cy="add-trusted-issuer"]').click();
    cy.get('[data-cy="input-issuer-did"] input').type('z8iZuGaHf4BxN4XxFWhjuX1zP99ySPmZUFNJf');
    cy.get('[data-cy="input-issuer-remark"] input').type('test');
    cy.get('[data-cy="add-mapping"]').click();
    cy.get('[data-cy="input-0-from"] input').type('Admin');
    cy.get('[data-cy="save-mapping"]').click();
    cy.contains('1 Mapping rule');
    cy.get('[data-cy="delete-mapping-rule"]').click();
    cy.get('[data-cy="submit-confirm-dialog"]').click();
    cy.get('.ux-dialog_closeButton').last().click();

    cy.get('[data-cy="trusted-issuers-more"]').click();
    cy.wait(1000);
    cy.contains('"Issue Passport", "Invite Member" and other operations will be disabled');
    cy.get('[data-cy="config-show-issue-passport"]').click();
    cy.wait(1000);
    cy.contains('"Issue Passport", "Invite Member" and other operations will be enabled');
    cy.get('[data-cy="config-show-issue-passport"]').click();
    cy.wait(1000);
    cy.contains('"Issue Passport", "Invite Member" and other operations will be disabled');

    // Trusted nft
    cy.wait(1000);
    cy.get('[data-cy="config-show-trusted-factories"]').click();
    cy.contains('Trusted NFT Collections');
    cy.get('[data-cy="add-trusted-factory"]').click();
    cy.wait(1000);
    cy.get('[data-cy="input-factory-address"] input').type('z3Ct8C2gMRvc296SJ8zQWNbuMcQopVsEgcUAS');
    cy.wait(2000);
    cy.get('[data-cy="input-factory-remark"] input').clear().type('ArcBlock NFT Studio AIGC Genesis');
    cy.get('[data-cy="input-passport-ttl-mint"]').click({ force: true });
    cy.get('[data-cy="input-passport-ttl"] input').click({ force: true }).clear().type('365d');
    cy.get('[data-cy="save-trusted-factory"]').click();
    cy.wait(1000);
    cy.contains('z3Ct8C2gMRvc296SJ8zQWNbuMcQopVsEgcUAS');
    cy.get('[data-cy="delete-trusted-factory"]').first().click();
    cy.wait(1000);
    cy.get('[data-cy="submit-confirm-dialog"]').click();
    cy.wait(1000);

    // Team Invite
    cy.visit('/team/members');
    cy.contains('test-user').should('be.visible');
    cy.contains('Invite').click();
    cy.get('[data-cy="invite-member-select-role"]').click();
    cy.get('[data-cy="invite-member-select-option-admin"]').click();
    cy.contains('Generate Invitation Link').click();
    cy.contains(createInvitationSuccessTip);
    cy.contains('?inviteId=')
      .invoke('text')
      .then(inviteLink => {
        // https://github.com/cypress-io/cypress/issues/2739#issuecomment-539514279
        cy.window().then(win => {
          cy.stub(win, 'prompt').returns('DISABLED WINDOW PROMPT');
        });
        cy.contains('button', 'Copy').click({ force: true });
        cy.clearCookie('connected_did');

        cy.get('[data-cy="invite-member-more"]').click();
        cy.contains('Inviting').click();
        cy.contains(inviteLink);

        // invite login with admin
        cy.logout();
        cy.visit(inviteLink);
        cy.wait(1500);
        // FIXME: 邀请需要弹出 popup，暂不支持接受邀请 e2e 测试
        // cy.get('[data-cy="invite-receive-passport"]').click();
        // cy.claim('admin');
        cy.wait(1500);

        // should has owner user and admin user
        cy.login('owner');
        cy.visit('/team/members');
        cy.contains('test-user').should('be.visible');
        // FIXME: 邀请需要弹出 popup，暂不支持接受邀请 e2e 测试
        // cy.contains('linchen');

        // cy.get('[data-cy="member-name-linchen"]').first().click({ force: true });

        // cy.contains('Block Access').click({ force: true });
        // cy.get('[data-cy="submit-confirm-dialog"]').click();
        // cy.contains('Allow Login');
        // cy.get('.ux-dialog_closeButton').click();
        cy.wait(600);
      });

    // it('should user detail page working successfully', () => {
    cy.get('[data-cy="member-name-test-user"]').first().click({ force: true });
    cy.wait(600);

    cy.contains('test-user');
    cy.contains('test-user@example.com');
    cy.contains('Yes');

    // create passport issuance
    cy.get('[data-cy="member-name-test-user"]').first().click({ force: true });
    cy.get('.MuiDialog-container').contains('Passport').click();
    cy.contains('Owner');
    cy.get('[data-cy="issue-passport"]').click();
    cy.get('[data-cy="issue-passport-select-passport"]').click();
    cy.get('[data-cy="issue-passport-select-option-admin"]').click();
    cy.get('[data-cy="issue-passport-create-btn"]').click();
    cy.get('.MuiDialog-container').contains('Admin');
    cy.get('[data-cy="delete-issuance"]').click();
    cy.get('[data-cy="submit-confirm-dialog"]').click();
  });
});
