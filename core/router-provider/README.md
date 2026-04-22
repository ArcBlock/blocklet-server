# `router-provider`

The routing provider for ABT Node, which contains several routing engine implementations.

## Usage

```javascript
const { getProvider } = require('router-provider');
const providerName = 'nginx';
const Provider = getProvider(providerName);

const provider = new Provider({ configDir, httpPort: 80, httpsPort: 443 });
provider.start();
provider.stop();
// ...
```

## Run Test

The tests are divided into two parts: the general unit tests and the generated gateway.spec.js tests. The reason for the two parts is that gateway.spec.js has some port & nginx dependencies.

### General unit testing

```bash
npm run test
```

### gateway.spec.js

The test relies on docker, so you need to have docker installed on your computer to start the test.
The `gateway.spec.js` file is not included in the source code, it is generated during the test, so if you need to see the file, you need to generate it manually.

```bash
pwd
/project/abt-node/core/router-provider
npm run test:generate-gateway
```

The generated file is in `/project/abt-node/core/router-provider/tests/gateway.spec.js`.

To save resources, this part of the test is not installed separately from the dependencies, so you need to start the test in the project's heel directory:

```bash
pwd
/project/abt-node
make test-in-docker
```

## Contribution

There are various ways for you to contribute to this package, such as adding support for another routing engine:

- [ ] Apache
- [ ] Openresty
- [ ] Tengine
- [ ] AWS ELB
- [x] Node.js
- [x] Nginx: supported

If you are working with the nginx routing engine, you may found this tool useful: <https://nginx.viraptor.info/>

## How to update the CRS rules

1. Pull the latest rules from the CRS repository
2. Copy the rules in the `lib/nginx/includes/security/crs4/rules` directory
3. Disable rules for windows in `lib/nginx/includes/security/crs4/rules/REQUEST-932-APPLICATION-ATTACK-RCE.conf`
