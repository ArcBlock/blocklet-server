/* eslint-disable no-console */
const express = require('express');

const range = require('./libs/range');

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'range from blocklet-dapp-hooks main', data: range(1, 10) });
});

app.listen(process.env.BLOCKLET_PORT, () => {
  console.log(`Listening on port ${process.env.BLOCKLET_PORT}`);
});
