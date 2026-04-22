describe('Blocklet Server Notifications', () => {
  it('should go to notification list page as expected', () => {
    cy.login();
    cy.visit('/dashboard');

    // Open Notification Pop Window
    cy.get('[data-cy="toggle-notification-btn"]').should('be.visible').first().click({ force: true });
    cy.contains('Notifications');
    cy.contains('View All');

    // Go To Notification List var curPages =  getCurrentPages();
    cy.get('[data-cy="view-all-notifications-btn"]').first().click({ force: true });
    cy.wait(500);
    cy.url().should('contain', '/notifications');
    cy.contains('Notifications');
  });
});
