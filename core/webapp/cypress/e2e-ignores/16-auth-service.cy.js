describe('Blocklet Server AuthService', () => {
  it('should visit blocklet page as expected', () => {
    const baseUrl = Cypress.config('gatewayBaseUrl');

    cy.visit(`${baseUrl}/admin/auth-test/publicUrl/`);
    cy.contains('public');

    cy.visit(`${baseUrl}/admin/auth-test/docUrl/`);
    cy.contains('doc');

    cy.visit(`${baseUrl}/admin/auth-test/adminUrl/`);
    cy.wait(500);
    cy.login('owner', { provideVC: false });
    cy.contains('admin');

    cy.visit(`${baseUrl}/admin/auth-test/configUrl/`);
    cy.wait(500);
    cy.login('owner', { provideVC: false });
    cy.contains('config');
  });
});
