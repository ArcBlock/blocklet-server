const path = require('path');
const fs = require('fs');
const express = require('express');
const expandTilde = require('expand-tilde');
const http = require('http');
const cors = require('cors');

const DEFAULT_PORT = 9090;

const sleep = async (ms = 1000) => new Promise((r) => setTimeout(r, ms));

module.exports = ({ port = DEFAULT_PORT, root = '.' } = {}) => {
  if (!port) {
    throw new Error('port must be specified!');
  }

  if (!root) {
    throw new Error('root must be specified!');
  }

  const dirExpanded = expandTilde(root);
  const dir = [dirExpanded, path.join(process.cwd(), dirExpanded)].filter((x) => fs.existsSync(x)).pop();
  if (!dir) {
    throw new Error('Can not serve a non-existent directory!');
  }

  const app = express();

  app.use(cors());

  app.use('/long-download-time/:filename', async (req, res) => {
    const { filename } = req.params;
    if (req.method === 'HEAD') {
      res.setHeader('Content-Type', 'application/x-gzip');
      res.end();
    } else {
      await sleep(18000);
      res.sendFile(path.join(dir, filename));
    }
  });

  const staticServe = express.static(dir, {
    index: false,
  });

  app.use(staticServe);

  const server = http.createServer(app);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Static server ready on port ${port} from ${root}`);
    server.emit('listen');
  });

  return server;
};

module.exports.DEFAULT_SERVER = `http://localhost:${DEFAULT_PORT}`;
