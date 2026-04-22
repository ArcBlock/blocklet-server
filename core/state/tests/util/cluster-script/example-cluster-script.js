const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`[example.js] Worker PID=${process.pid} is serving request\n`);
});

const PORT = process.env.PORT || 0;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[example.js] Worker PID=${process.pid} listening on port ${PORT}`);
});
