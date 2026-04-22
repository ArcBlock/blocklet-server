const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`[crashExample.js] Worker PID=${process.pid} will crash in 5s...\n`);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[crashExample.js] Worker PID=${process.pid} listening on port ${PORT}`);
});

setTimeout(() => {
  // eslint-disable-next-line no-console
  console.log(`[crashExample.js] Worker PID=${process.pid} exiting`);
  process.exit(1);
}, 500);
