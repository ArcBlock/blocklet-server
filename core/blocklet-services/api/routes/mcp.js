const { WELLKNOWN_SERVICE_PATH_PREFIX, SECURITY_RULE_DEFAULT_ID } = require('@abtnode/constant');
const { joinURL } = require('ufo');
const get = require('lodash/get');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { checkPublicAccess } = require('@blocklet/meta/lib/util');
// eslint-disable-next-line import/no-unresolved
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
// eslint-disable-next-line import/no-unresolved
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
// eslint-disable-next-line import/no-unresolved
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
const { z } = require('zod');
const flatten = require('lodash/flatten');
const { version } = require('../../package.json');

const { initMcpServer } = require('../services/mcp/server');
const logger = require('../libs/logger')('mcp:server:routes');

const isMCPSupported = (b) => get(b.meta, 'capabilities.mcp', false);

// Zod schema for MCP tools request validation
const mcpToolsRequestSchema = z.object({
  name: z.string().min(1, 'Tool name is required'),
  componentDid: z.string().min(1, 'Component DID is required'),
  input: z.any(),
});

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // set to undefined for stateless servers
});

module.exports = {
  init(server, node) {
    const mcpServer = initMcpServer(node);
    mcpServer
      .connect(transport)
      .then(() => {
        logger.info('MCP server connected to streamableHttp transport');
      })
      .catch((err) => {
        logger.error('Failed to connect MCP server to streamableHttp transport', err);
      });

    // Return all MCP servers
    server.get(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/mcp/servers'), async (req, res) => {
      const blocklet = await req.getBlocklet();
      const { securityRules } = await node.getBlockletSecurityRules({ did: blocklet.appDid });
      let securityConfig = securityRules.find((x) => x.id === SECURITY_RULE_DEFAULT_ID);

      const mcpServers = [];

      // Blocklet Service MCP Server
      const info = getBlockletInfo(blocklet);
      const baseUrl = joinURL(info.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet');
      mcpServers.push({
        did: blocklet.appDid,
        name: info.name,
        description: info.description,
        endpoint: joinURL(info.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/mcp'),
        protected: !checkPublicAccess(securityConfig),
        version: info.version,
        logo: joinURL(baseUrl, '/logo'),
      });

      // Components MCP Server
      blocklet.children.forEach((x) => {
        securityConfig = securityRules.find((r) => r.componentDid === x.meta.did && r.pathPattern === '*');
        if (isMCPSupported(x)) {
          mcpServers.push({
            did: `${blocklet.appDid}/${x.meta.did}`,
            name: x.meta.title,
            description: x.meta.description,
            endpoint: joinURL(info.appUrl, x.mountPoint, '/mcp'),
            protected: !checkPublicAccess(securityConfig),
            version: x.meta.version,
            logo: joinURL(baseUrl, `/logo-bundle/${x.meta.did}?v=${info.version}`),
          });
        }
      });

      // TODO: should we include official services? such as chain, did-spaces, name-service, etc.
      res.json({
        version: info.version,
        servers: mcpServers,
      });
    });

    // Serve Service MCP server
    server.get(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/mcp'), (req, res) => {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Set required headers for SSE
      res.header('X-Accel-Buffering', 'no');

      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed.',
          },
          id: null,
        })
      );
    });

    server.delete(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/mcp'), (req, res) => {
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed.',
          },
          id: null,
        })
      );
    });

    server.post(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/mcp'), async (req, res) => {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      try {
        logger.debug('received MCP request', { request: req.body });
        req.auth = { extra: { user: req.user, blockletDid: req.getBlockletDid() } };
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        logger.error('failed to handle MCP request', { request: req.body, error });
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    server.get(
      joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/mcp/tools'),
      /**
       * @see https://team.arcblock.io/comment/discussions/aPYG3ocSGNIhFHFr5wFcquZx#53f1867b-3439-43c8-b63c-bf53fffcfe8c
       * @param {import('express').Request} req
       * @param {import('express').Response} res
       * @returns
       */
      async (req, res) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        const blocklet = await req.getBlocklet();
        const info = getBlockletInfo(blocklet);
        const mapServers = blocklet.children
          .map((x) => {
            if (isMCPSupported(x)) {
              return {
                name: x.meta.title,
                description: x.meta.description,
                componentDid: x.meta.did,
                appPid: blocklet.appPid,
                endpoint: joinURL(info.appUrl, x.mountPoint, '/mcp'),
              };
            }

            return null;
          })
          .filter(Boolean);

        const toolMartixs = await Promise.all(
          mapServers.map(async (x) => {
            const client = new Client({
              name: 'blocklet-service-mcp-client',
              version,
            });
            const currentTransport = new StreamableHTTPClientTransport(new URL(x.endpoint), {
              requestInit: {
                headers: {
                  Cookie: req.headers.cookie,
                  'x-csrf-token': req.cookies?.['x-csrf-token'],
                },
              },
            });
            await client.connect(currentTransport);
            const { tools } = await client.listTools().catch((error) => {
              console.error('error listing tools', error);
              return { tools: [] };
            });

            return tools.map((tool) => ({
              ...tool,
              appPid: x.appPid,
              componentDid: x.componentDid,
            }));
          })
        );
        const tools = flatten(toolMartixs);

        return res.send(tools);
      }
    );

    server.get(
      joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/mcp/tools.js'),
      /**
       *
       * @see https://team.arcblock.io/comment/discussions/aPYG3ocSGNIhFHFr5wFcquZx#53f1867b-3439-43c8-b63c-bf53fffcfe8c
       * @param {import('express').Request} req
       * @param {import('express').Response} res
       * @returns
       */
      async (req, res) => {
        const blocklet = await req.getBlocklet();
        const info = getBlockletInfo(blocklet);
        const toolsApiUrl = joinURL(info.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/mcp/tools');

        // 定义为 js
        res.type('js');

        // @note: 这么做的好处是，未登录到登录成功之后，页面没有刷新也能很快地注册 tools
        return res.send(`
function getCookiesAsObject() {
  const cookieStr = document.cookie;
  if (!cookieStr.trim()) {
    return {};
  }

  const cookies = {};
  const cookiePairs = cookieStr.split('; ');

  cookiePairs.forEach(pair => {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) {
      return;
    }

    const key = pair.substring(0, eqIndex);
    const value = pair.substring(eqIndex + 1);
    const decodedKey = decodeURIComponent(key);
    const decodedValue = decodeURIComponent(value);
    cookies[decodedKey] = decodedValue;
  });

  return cookies;
}
  
async function registerTools() {
  try {
    const cookies = getCookiesAsObject();
    if (cookies.login_token) {
      // 发送 GET 请求获取工具列表，携带 cookie
      const response = await fetch('${toolsApiUrl}', {
        method: 'GET',
        credentials: 'include', // 自动携带 cookie
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const tools = await response.json();
        dsBridge.call("arc__registerTools", tools);
        console.info("registerTools success");
      } else {
        console.error("Failed to fetch tools:", response.status, response.statusText);
        dsBridge.call("arc__registerTools", []);
      }
    } else {
      dsBridge.call("arc__registerTools", []);
    }
  } catch (error) {
    console.error("registerTools", error);
    dsBridge.call("arc__registerTools", []);
  }
}

let lastLoginToken = null;
async function watchCookieChanges() {
  const cookies = getCookiesAsObject();
  const currentLoginToken = cookies.login_token || null;
  
  if (currentLoginToken !== lastLoginToken) {
    lastLoginToken = currentLoginToken;
    await registerTools();
  }
}

registerTools();

const cookies = getCookiesAsObject();
lastLoginToken = cookies.login_token || null;
setInterval(watchCookieChanges, 1000);
      `);
      }
    );

    server.post(
      joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/mcp/tools'),
      /**
       * @see https://team.arcblock.io/comment/discussions/aPYG3ocSGNIhFHFr5wFcquZx#53f1867b-3439-43c8-b63c-bf53fffcfe8c
       * @param {import('express').Request} req
       * @param {import('express').Response} res
       *
       */
      async (req, res) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Validate request body with Zod
        let name;
        let componentDid;
        let input;
        try {
          const validatedData = await mcpToolsRequestSchema.parseAsync(req.body);
          ({ name, componentDid, input } = validatedData);
        } catch (error) {
          console.error(error);
          if (error instanceof z.ZodError) {
            return res.status(400).json({
              error: error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
              })),
            });
          }
          return res.status(400).json({ error: error.message });
        }

        const blocklet = await req.getBlocklet();
        const info = getBlockletInfo(blocklet);
        const mountPoint = blocklet.children.find((x) => {
          return x.meta.did === componentDid && isMCPSupported(x);
        })?.mountPoint;
        if (!mountPoint) {
          return res.status(404).json({ error: `Component not found by ${componentDid}` });
        }

        const endpoint = joinURL(info.appUrl, mountPoint, '/mcp');
        const client = new Client({
          name: 'blocklet-service-proxy',
          version,
        });
        const currentTransport = new StreamableHTTPClientTransport(new URL(endpoint), {
          requestInit: {
            headers: {
              Cookie: req.headers.cookie,
              'x-csrf-token': req.cookies?.['x-csrf-token'],
            },
          },
        });
        await client.connect(currentTransport);
        const output = await client.callTool({
          name,
          arguments: input,
        });

        return res.send(output);
      }
    );
  },
};
