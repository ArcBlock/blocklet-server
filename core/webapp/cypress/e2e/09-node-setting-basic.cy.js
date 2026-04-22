describe('Node Setting Basic', () => {
  it('should setting basic page render and work as expected', () => {
    cy.login();
    cy.visit('/settings/basic');

    cy.wait(1000);
    const newName = `Blocklet Server-${new Date().toDateString()}`;
    cy.get('[data-cy="node-name-input"]').find('input').first().clear().type(newName);
    cy.get('[data-cy="submit-btn"]').first().click({ force: true });
    cy.get('[data-cy="submit-btn"]').first().should('not.be.disabled');
    cy.contains(newName);

    cy.get('[data-cy="node-name-input"]').find('input').first().clear();
    cy.get('[data-cy="submit-btn"]').first().click({ force: true });

    cy.get('[data-cy="node-name-input"]')
      .find('input')
      .first()
      .then(x => {
        const ariaInvalid = x.get(0).getAttribute('aria-invalid');
        expect(ariaInvalid).to.equal('true');
        cy.get('[data-cy="node-name-input"]').find('input').first().clear().type(newName);
      });

    cy.visit('/settings/about');
    cy.contains('Cache Management').should('be.visible');
  });
});
