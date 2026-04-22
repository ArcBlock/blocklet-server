Cypress.Commands.add('clickOverviewWithRetry', (retries = 5) => {
  const errorText = 'Failed to fetch dynamically imported module';

  const attempt = remaining => {
    return cy.document().then(doc => {
      if (doc.body.innerText.includes(errorText)) {
        if (remaining <= 0) {
          throw new Error('clickOverviewWithRetry: 达到最大重试次数，仍未恢复');
        }
        return (
          cy
            .wait(2000)
            .reload()
            // reload 后给页面一点时间再检查
            .then(() => attempt(remaining - 1))
        );
      }

      return cy.contains('button[type="button"]', 'Overview', { timeout: 10000 }).click({ force: true });
    });
  };

  return attempt(retries);
});
