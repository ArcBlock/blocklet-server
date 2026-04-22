/* eslint-disable newline-per-chained-call */
describe('Access Keys', () => {
  it('should access key page work as expected', () => {
    cy.login();
    cy.visit('/team/access-keys');

    cy.wait(1000);
    cy.get('[data-cy="add-access-key-btn"]').first().click({ force: true });
    cy.get('[data-cy="remark-input"]').first().type('Test Access Key');
    cy.get('[data-cy="create-access-key-select-passport"]').click();
    cy.get('[data-cy="create-access-key-passport-option-admin"]').click();
    cy.get('[data-cy="submit-confirm-dialog"]').first().click({ force: true });
    cy.get('[data-cy="show-secret-btn"]').first().click({ force: true });
    cy.get('[type="checkbox"]').first().click({ force: true });
    cy.get('[data-cy="submit-confirm-dialog"]').first().click({ force: true });
    cy.contains('Test Access Key');
    cy.log('should add access key work correct');

    cy.get('[data-cy="access-key-actions"]').get('[data-cy="actions-menu-icon"]').first().click({ force: true });
    cy.wait(500);
    cy.get('[data-cy^="actions-menu-"]').contains('Delete').first().click({ force: true });
    cy.get('[data-cy="click-copy"]')
      .first()
      .invoke('text')
      .then(text => {
        cy.get('[data-cy="delete-confirm-input"]').first().type(text);
        cy.get('[data-cy="submit-confirm-dialog"]').first().click({ force: true });
        cy.contains('Test Access Key').should('not.exist');
      });

    cy.log('should delete access key work correct');
  });
});
