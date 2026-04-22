/* eslint-disable newline-per-chained-call */
describe('Node Setting Integrations', () => {
  it('should integration page work as expected', () => {
    cy.login();
    cy.visit('/settings/integration');

    cy.wait(1000);
    cy.get('[data-testid="Add API Integration-iconButton"]').first().click({ force: true });
    cy.get('[data-cy="webhook-input"]').first().type('https://www.arcblock.io');
    cy.get('[data-cy="submit-confirm-dialog"]').first().click({ force: true });
    cy.contains('https://www.arcblock.io');
    cy.log('should add integration work correct');

    cy.get('[data-cy="action-delete-webhook"]').contains('Delete').first().click({ force: true });
    cy.get('[data-cy="click-copy"]')
      .first()
      .invoke('text')
      .then(text => {
        cy.get('[data-cy="delete-confirm-input"]').first().type(text);
        cy.get('[data-cy="submit-confirm-dialog"]').first().click({ force: true });
        cy.contains('https://www.arcblock.io').should('not.exist');
      });
    cy.log('should delete integration work correct');
  });
});
