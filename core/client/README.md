# ABT Node Client

Client library to connect webapp to Abt Node Daemon

## Table of Contents

- [Development](#development)
- [Install](#install)
- [Usage](#usage)
- [Debugging](#debugging)
- [Documentation](#documentation)

## Development

upgrade code: you need two shells

1. start demo server

```shell
cd ../gql
node demo.js
```

2. upgrade code

```shell
npm run upgrade
```

## Install

```shell
npm i @blocklet/server-js -S
# OR
yarn add @blocklet/server-js
```

## Usage

```js
const AbtNodeClient = require('@blocklet/server-js');

const client = new AbtNodeClient('http://localhost:3030/api/gql');
console.log({
  queries: client.getQueries(),
  subscriptions: client.getSubscriptions(),
  mutations: client.getMutations(),
});

client.listBlocklets().then(console.log);
```

## Debugging

- If you are in Node.js: `DEBUG=@blocklet/server-js node script.js`
- If you are in Browser: `localStorage.setItem('DEBUG', '@blocklet/server-js')`

## Documentation

Query arguments and response structure can be found: [QUERIES.md](./docs/QUERIES.md)
