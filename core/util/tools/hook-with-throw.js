/* eslint-disable no-console */
(async () => {
  console.log('hook start', Date.now());
  for (let i = 0; i < 10; i++) {
    console.log(i, 'a'.repeat(80));
  }
  console.log('hook done', Date.now());
  throw new Error('from hook');
})();
