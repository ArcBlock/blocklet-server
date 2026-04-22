const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const shelljs = require('shelljs');
// eslint-disable-next-line import/no-extraneous-dependencies
const prettier = require('prettier');

const { EOL } = os;

const MOCKED_BLOCKLET_SERVICE_FOLDER = path.join(os.homedir(), 'abtnode_mock_blocklet_service');
const blockletNginxConfPath = path.join(MOCKED_BLOCKLET_SERVICE_FOLDER, 'nginx.conf');

const mockBlockletService = (services) => {
  if (!Array.isArray(services) || services.length < 0) {
    return;
  }

  const serverTemplates = [];
  services.forEach(({ port }) => {
    serverTemplates.push(`server {
      listen ${port};
      server_name _;
      location / {
        add_header X-Path-Prefix $http_x_path_prefix;
        add_header X-Blocklet-Did $http_x_blocklet_did;
        return 200;
      }
    }`);
  });

  fs.ensureDirSync(MOCKED_BLOCKLET_SERVICE_FOLDER);
  fs.mkdirSync(path.join(MOCKED_BLOCKLET_SERVICE_FOLDER, 'logs'));

  fs.writeFileSync(
    blockletNginxConfPath,
    `worker_processes 1;
    events {
      worker_connections 1024;
    }

    http {
      ${serverTemplates}
    }
  `
  );

  shelljs.exec(`nginx -c ${blockletNginxConfPath}`);
};

const teardownMockedBlockletService = () => {
  shelljs.exec(`nginx -c ${blockletNginxConfPath} -s stop`);
  fs.removeSync(MOCKED_BLOCKLET_SERVICE_FOLDER);
};

const generateTestSuites = (testFilePath, data) => {
  console.log('[generate gateway spec] start...'); // eslint-disable-line no-console

  if (!testFilePath) {
    throw new Error('testFilePath is required');
  }

  if (fs.existsSync(testFilePath)) {
    fs.removeSync(testFilePath);
  }

  const generateRequest = ({ method, url, headers }) =>
    `response = await axios.${method}('${url}', {
        maxRedirects: 0, headers: ${JSON.stringify(headers || {})}
      });
    `;

  const generateHeaderExpectations = (headers) => {
    const headerNames = Object.keys(headers || {});
    const result = [];
    for (let headerIndex = 0; headerIndex < headerNames.length; headerIndex++) {
      const header = headers[headerNames[headerIndex]];

      result.push(`
      test('should response with header ${headerNames[headerIndex]}="${header}"', async () => {
        // eslint-disable-next-line dot-notation
        expect(response.headers['${headerNames[headerIndex].toLowerCase()}']).toEqual('${header}');
      });
      `);
    }

    return result.join(os.EOL);
  };

  const suits = [];
  for (let index = 0; index < data.length; index++) {
    const { expectations = [], site, certificates, mockUpstreamServices, description } = data[index];

    for (let expectationIndex = 0; expectationIndex < expectations.length; expectationIndex++) {
      const suites = [];
      const expectation = expectations[expectationIndex];
      suites.push(`
    test('redirect: should response status ${expectation.expect.status}', async () => {
      expect(response.status).toEqual(${expectation.expect.status});
    });
    `);

      if (expectation.expect.headers) {
        suites.push(generateHeaderExpectations(expectation.expect.headers));
      }

      const mockUpstreamTemplate =
        (mockUpstreamServices || []).length > 0
          ? `fixture.mockBlockletService(${JSON.stringify(mockUpstreamServices)})`
          : '';

      const teardownUpstreamTemplate =
        (mockUpstreamServices || []).length > 0 ? 'fixture.teardownMockedBlockletService()' : '';

      suits.push(`
    describe('Test ${description}, url:${expectation.url}', () => {
      let instance = null;
      const configDir = path.join(os.tmpdir(), 'abtnode-gateway-test');
      let response = null;
      beforeAll(async () => {
        instance = new NginxProvider({ configDir });
        await instance.update({
          routingTable: ${JSON.stringify(site)},
          certificates: ${JSON.stringify(certificates || [])},
          nodeInfo,
          services,
        });
        await instance.start();
        ${mockUpstreamTemplate}
        ${generateRequest({ method: expectation.method, url: expectation.url, headers: expectation.headers })}
      });

      afterAll(async () => {
        if (instance) {
          await instance.stop();
          fs.removeSync(instance.configPath);
        }
        ${teardownUpstreamTemplate}
      });
      ${suites.join(EOL)}
    });
    `);
    }
  }

  const specTemplate = `
    /**
    * Auto generated, DO NOT edit it
    */
    const path = require('path');
    const os = require('os');
    const fs = require('fs-extra');
    const shelljs = require('shelljs');
    const axios = require('../tools/axios-extends')({ validateStatus: () => true });
    const fixture = require('../tools/fixture');
    const NginxProvider = require('../lib/nginx');

    if (shelljs.which('nginx')) {
      const services = [];
      const nodeInfo = { version: '1.0.0', port: 8089 };
      ${suits.join(EOL)}
    } else {
      console.warn('no nginx found, skip gateway spec'); // eslint-disable-line no-console
    }
  `;

  prettier.resolveConfig('../../.prettierrc').then((options) => {
    const formatted = prettier.format(specTemplate, { parser: 'babel', ...options });
    fs.writeFileSync(testFilePath, formatted);
    console.log('[generate gateway spec] generated!'); // eslint-disable-line no-console
  });
};

module.exports = {
  generateTestSuites,
  mockBlockletService,
  teardownMockedBlockletService,
};
