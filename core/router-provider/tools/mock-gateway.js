const fs = require('fs');
const path = require('path');
const { ROUTING_RULE_TYPES } = require('@abtnode/constant');

const TEST_DEFAULT_DAEMON_PORT = 18089;
const TEST_DEFAULT_REDIRECT_CODE = 302;

const testCert = fs.readFileSync(path.join(__dirname, 'test-certs/test-xxx-yyy-test.arcblockio.cn.crt')).toString();
const testPrivkey = fs.readFileSync(path.join(__dirname, 'test-certs/test-xxx-yyy-test.arcblockio.cn.key')).toString();

module.exports = [
  {
    description: 'redirect to https site',
    site: [
      {
        domain: 'test-xxx-yyy-test.arcblockio.cn',
        rules: [
          {
            from: { pathPrefix: '/demo' },
            to: {
              type: ROUTING_RULE_TYPES.REDIRECT,
              redirectCode: TEST_DEFAULT_REDIRECT_CODE,
              url: 'https://arcblock.io',
            },
          },
        ],
      },
    ],
    certificates: [
      {
        domain: 'test-xxx-yyy-test.arcblockio.cn',
        certificate: testCert,
        privateKey: testPrivkey,
      },
    ],
    expectations: [
      {
        method: 'get',
        url: 'http://test-xxx-yyy-test.arcblockio.cn/demo',
        expect: {
          status: 307,
          headers: {
            location: 'https://test-xxx-yyy-test.arcblockio.cn/demo',
          },
        },
      },
      {
        method: 'get',
        url: 'https://test-xxx-yyy-test.arcblockio.cn/demo',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
          headers: {
            location: 'https://arcblock.io',
          },
        },
      },
      {
        method: 'get',
        url: 'https://test-xxx-yyy-test.arcblockio.cn/demo/',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
          headers: {
            location: 'https://arcblock.io/',
          },
        },
      },
    ],
  },
  {
    description: '404 path',
    site: [
      {
        domain: 'abtnode.com',
        rules: [
          {
            from: { pathPrefix: '/demo' },
            to: {
              type: ROUTING_RULE_TYPES.REDIRECT,
              redirectCode: TEST_DEFAULT_REDIRECT_CODE,
              url: 'https://arcblock.io',
            },
          },
        ],
      },
    ],
    expectations: [
      {
        method: 'get',
        url: 'http://abtnode.com/test-not-found',
        expect: {
          status: 404,
        },
      },
    ],
  },
  {
    description: 'can not access internal path',
    site: [
      {
        domain: 'abtnode.com',
        rules: [
          {
            from: { pathPrefix: '/demo' },
            to: {
              type: ROUTING_RULE_TYPES.REDIRECT,
              redirectCode: TEST_DEFAULT_REDIRECT_CODE,
              url: 'https://arcblock.io',
            },
          },
        ],
      },
    ],
    expectations: [
      {
        method: 'get',
        url: 'http://abtnode.com/demo/',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
        },
      },
      {
        method: 'get',
        url: 'http://abtnode.com/_abtnode_404',
        expect: {
          status: 404,
        },
      },
      {
        method: 'get',
        url: 'http://abtnode.com/_abtnode_502',
        expect: {
          status: 404,
        },
      },
      {
        method: 'get',
        url: 'http://abtnode.com/_abtnode_5xx',
        expect: {
          status: 404,
        },
      },
    ],
  },
  {
    description: 'blocklet trim slash',
    mockUpstreamServices: [
      {
        port: TEST_DEFAULT_DAEMON_PORT,
      },
    ],
    site: [
      {
        domain: 'blocklet.abtnode.com',
        rules: [
          {
            from: { pathPrefix: '/demo' },
            to: {
              type: ROUTING_RULE_TYPES.BLOCKLET,
              port: 18095,
              did: 'z8iZiL2TgFJSxiEQ9NV7eXXeUBSicViGmdrrA',
            },
          },
        ],
      },
    ],
    expectations: [
      {
        method: 'get',
        url: 'http://blocklet.abtnode.com/demo',
        expect: {
          status: 307,
          headers: {
            location: 'http://blocklet.abtnode.com/demo/',
          },
        },
      },
    ],
  },
  {
    description: 'redirect with x-forwarded-*',
    site: [
      {
        domain: 'abtnode.com',
        rules: [
          {
            from: { pathPrefix: '/demo' },
            to: {
              type: ROUTING_RULE_TYPES.BLOCKLET,
              port: 18095,
              did: 'z8iZiL2TgFJSxiEQ9NV7eXXeUBSicViGmdrrA',
            },
          },
        ],
      },
    ],
    expectations: [
      {
        method: 'get',
        url: 'http://abtnode.com/demo',
        headers: {
          'x-forwarded-proto': 'http',
          'x-forwarded-host': 'test.abtnode.com',
        },
        expect: {
          status: 307,
          headers: {
            location: 'http://test.abtnode.com/demo/',
          },
        },
      },
    ],
  },
  {
    description: 'redirect',
    site: [
      {
        domain: 'abtnode.com',
        rules: [
          {
            from: { pathPrefix: '/' },
            to: {
              type: ROUTING_RULE_TYPES.REDIRECT,
              redirectCode: TEST_DEFAULT_REDIRECT_CODE,
              url: 'https://arcblock.io',
            },
          },
          {
            from: { pathPrefix: '/demo' },
            to: {
              type: ROUTING_RULE_TYPES.REDIRECT,
              redirectCode: TEST_DEFAULT_REDIRECT_CODE,
              url: 'https://demo.arcblock.io',
            },
          },
          {
            from: { pathPrefix: '/relative' },
            to: {
              type: ROUTING_RULE_TYPES.REDIRECT,
              redirectCode: TEST_DEFAULT_REDIRECT_CODE,
              url: '/relative-test',
            },
          },
        ],
      },
    ],
    expectations: [
      {
        method: 'get',
        url: 'http://abtnode.com',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
          headers: {
            location: 'https://arcblock.io',
          },
        },
      },
      {
        method: 'get',
        url: 'http://abtnode.com?a=2',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
          headers: {
            location: 'https://arcblock.io?a=2',
          },
        },
      },
      {
        method: 'get',
        url: 'http://abtnode.com/req1?a=2',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
          headers: {
            location: 'https://arcblock.io/req1?a=2',
          },
        },
      },
      {
        method: 'get',
        url: 'http://abtnode.com/demo',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
          headers: {
            location: 'https://demo.arcblock.io',
          },
        },
      },
      {
        method: 'get',
        url: 'http://abtnode.com/demo/req1',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
          headers: {
            location: 'https://demo.arcblock.io/req1',
          },
        },
      },
      {
        method: 'get',
        url: 'http://abtnode.com/demo/req1?a=1',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
          headers: {
            location: 'https://demo.arcblock.io/req1?a=1',
          },
        },
      },
      {
        method: 'get',
        url: 'http://abtnode.com/relative',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
          headers: {
            location: 'http://abtnode.com/relative-test',
          },
        },
      },
      {
        method: 'get',
        url: 'http://abtnode.com/relative/req1',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
          headers: {
            location: 'http://abtnode.com/relative-test/req1',
          },
        },
      },
      {
        method: 'get',
        url: 'http://abtnode.com/relative/req1?foo=1&bar=2',
        expect: {
          status: TEST_DEFAULT_REDIRECT_CODE,
          headers: {
            location: 'http://abtnode.com/relative-test/req1?foo=1&bar=2',
          },
        },
      },
    ],
  },
  {
    description: 'CORS',
    mockUpstreamServices: [
      {
        port: 18095,
      },
    ],
    site: [
      {
        domain: 'cors-test.abtnode.com',
        corsAllowedOrigins: ['cors-req.abtnode.com', 'cors-test.abtnode.com'],
        rules: [
          {
            from: { pathPrefix: '/demo' },
            to: {
              type: ROUTING_RULE_TYPES.BLOCKLET,
              port: 18095,
              did: 'z8iZiL2TgFJSxiEQ9NV7eXXeUBSicViGmdrrA',
            },
          },
        ],
      },
    ],
    expectations: [
      {
        method: 'get',
        url: 'http://cors-test.abtnode.com/demo',
        expect: {
          status: 307,
          headers: {
            location: 'http://cors-test.abtnode.com/demo/',
          },
        },
      },
      {
        method: 'options',
        url: 'http://cors-test.abtnode.com/demo',
        expect: {
          status: 204,
        },
      },
    ],
  },
];
