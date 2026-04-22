/* eslint-disable no-console */
const sleep = (ms) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('from reject'));
    }, ms);
  });

console.log('hook start', Date.now());
for (let i = 0; i < 10; i++) {
  console.log(i, 'a'.repeat(80));
}
console.log('hook done', Date.now());

sleep(100);
