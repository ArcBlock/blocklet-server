const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello Blocklet\n');
});

const port = process.env.BLOCKLET_PORT || 3000;

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://127.0.0.1:${3000}/`);
});
