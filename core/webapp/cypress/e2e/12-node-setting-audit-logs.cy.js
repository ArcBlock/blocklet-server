/* eslint-disable newline-per-chained-call */

describe('Audit Logs', () => {
  it('should access key page work as expected', () => {
    cy.login();
    cy.visit('/team/audit-logs');

    cy.contains('Audit Trail').should('be.visible');
    cy.get('[data-cy="audit-logs"] [data-cy="log-entry"]').its('length').should('be.gte', 2);

    cy.get('[data-cy="filter-by-category-trigger"]').click();
    cy.get('[data-cy="filter-by-category-security"]').click();
    cy.get('[data-cy="audit-logs"] [data-cy="log-entry"]').its('length').should('be.gte', 2);

    cy.get('[data-cy="filter-by-category-trigger"]').click();
    cy.get('[data-cy="filter-by-category-blocklet"]').click();
    cy.get('[data-cy="audit-logs"] [data-cy="log-entry"]').its('length').should('be.gte', 2);

    cy.log('should audit logs work correct');
  });
});
