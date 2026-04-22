/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-underscore-dangle */
const { it, test, expect, describe, beforeEach, afterEach, afterAll, spyOn, mock } = require('bun:test');
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const shelljs = require('shelljs');
const { promisify } = require('util');
const { NginxConfFile } = require('nginx-conf');
const { ROUTING_RULE_TYPES, DOMAIN_FOR_IP_SITE_REGEXP } = require('@abtnode/constant');

const util = require('../../lib/nginx/util');

const NginxProvider = require('../../lib/nginx');

const createNginxConf = promisify(NginxConfFile.create).bind(NginxConfFile);
const createNginxConfFromSource = promisify(NginxConfFile.createFromSource).bind(NginxConfFile);

describe('Router.NginxProvider', () => {
  let provider;
  const configDir = path.join(os.tmpdir(), 'nginx');
  const nodeInfo = { port: 8089 };

  beforeEach(() => {
    const shellExec = shelljs.exec.bind(shelljs);
    spyOn(shelljs, 'exec').mockImplementation((...args) => {
      if (args[0].includes('-V')) {
        return {
          code: 0,
          stdout: `nginx version: nginx/1.17.9
        built by clang 11.0.0 (clang-1100.0.33.17)
        built with OpenSSL 1.1.1d  10 Sep 2019 (running with OpenSSL 1.1.1i  8 Dec 2020)
        TLS SNI support enabled
        configure arguments: --prefix=/usr/local/Cellar/nginx/1.17.9 --sbin-path=/usr/local/Cellar/nginx/1.17.9/bin/nginx --with-cc-opt='-I/usr/local/opt/pcre/include -I/usr/local/opt/openssl@1.1/include' --with-ld-opt='-L/usr/local/opt/pcre/lib -L/usr/local/opt/openssl@1.1/lib' --conf-path=/usr/local/etc/nginx/nginx.conf --pid-path=/usr/local/var/run/nginx.pid --lock-path=/usr/local/var/run/nginx.lock --http-client-body-temp-path=/usr/local/var/run/nginx/client_body_temp --http-proxy-temp-path=/usr/local/var/run/nginx/proxy_temp --http-fastcgi-temp-path=/usr/local/var/run/nginx/fastcgi_temp --http-uwsgi-temp-path=/usr/local/var/run/nginx/uwsgi_temp --http-scgi-temp-path=/usr/local/var/run/nginx/scgi_temp --http-log-path=/usr/local/var/log/nginx/access.log --error-log-path=/usr/local/var/log/nginx/error.log --with-compat --with-debug --with-http_addition_module --with-http_auth_request_module --with-http_dav_module --with-http_degradation_module --with-http_flv_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_mp4_module --with-http_random_index_module --with-http_realip_module --with-http_secure_link_module --with-http_slice_module --with-http_ssl_module --with-http_stub_status_module --with-http_sub_module --with-http_v2_module --with-ipv6 --with-mail --with-mail_ssl_module --with-pcre --with-pcre-jit --with-stream --with-stream_realip_module --with-stream_ssl_module --with-stream_ssl_preread_module`, // eslint-disable-line max-len
        };
      }

      return shellExec(...args);
    });
    fs.removeSync(configDir);
    provider = new NginxProvider({ configDir });
  });

  afterEach(() => {
    fs.removeSync(configDir);
    provider = null;
    mock.restore();
  });

  afterAll(() => {
    fs.removeSync(configDir);
  });

  describe('initialize', () => {
    test('should throw error if no configDir provided', () => {
      expect(() => new NginxProvider({ httpPort: 80, httpsPort: 80 })).toThrow(/invalid configDir/);
    });

    test('should throw error if no nginx bin path be found', () => {
      spyOn(shelljs, 'which').mockImplementation(() => '');

      expect(() => new NginxProvider({ configDir: '/tmp/test', httpPort: 80, httpsPort: 80 })).toThrow(
        /invalid nginx binPath/
      );
    });

    test('should set isTest correctly', () => {
      const p1 = new NginxProvider({ configDir: '/tmp/test', httpPort: 80, httpsPort: 80 });
      expect(p1.isTest).toBe(false);

      const p2 = new NginxProvider({ configDir: '/tmp/test', httpPort: 80, httpsPort: 80, isTest: false });
      expect(p2.isTest).toBe(false);

      const p3 = new NginxProvider({ configDir: '/tmp/test', httpPort: 80, httpsPort: 80, isTest: true });
      expect(p3.isTest).toBe(true);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      spyOn(provider, '_addWwwFiles').mockImplementation(() => {});
      spyOn(provider, '_addCacheGroups').mockImplementation(() => {});
      spyOn(provider, '_addCommonResHeaders').mockImplementation(() => {});
      spyOn(provider, '_addExposeServices').mockImplementation(() => {});
      spyOn(provider, 'addRequestLimiting').mockImplementation(() => {});
      spyOn(provider, 'updateBlacklist').mockImplementation(() => {});
      spyOn(provider, 'updateWhitelist').mockImplementation(() => {});
      spyOn(provider, 'updateProxyPolicy').mockImplementation(() => {});
      spyOn(provider, 'ensureUpstreamServers').mockImplementation(() => {});
      spyOn(provider, '_addModSecurity').mockImplementation(() => {});
      spyOn(provider, '_addIpBlackHoleServer').mockImplementation(() => {});
      spyOn(provider, '_addUnknownHostBlackHoleServer').mockImplementation(() => {});
      spyOn(provider, '_addDefaultServer').mockImplementation(() => {});
      spyOn(provider, '_addDefaultBlackHoleServer').mockImplementation(() => {});
      spyOn(provider, '_addStubStatusLocation').mockImplementation(() => {});
    });

    it('should throw if routingTable is not array', async () => {
      await expect(provider.update({ routingTable: null })).rejects.toThrow(/must be an array/);
    });

    it('should call _addDefaultServer if enableDefaultServer and no _ site', async () => {
      const spy = provider._addDefaultServer;
      await provider.update({
        routingTable: [{ domain: 'a.com', rules: [] }],
        enableDefaultServer: true,
        nodeInfo: { port: 1234 },
      });
      expect(spy).toHaveBeenCalled();
    });

    it('should not call _addDefaultServer if enableDefaultServer and _ site exists', async () => {
      const spy = provider._addDefaultServer;
      await provider.update({
        routingTable: [{ domain: '_', rules: [] }],
        enableDefaultServer: true,
        nodeInfo: { port: 1234 },
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call _addDefaultBlackHoleServer if !enableDefaultServer', async () => {
      const spy = provider._addDefaultBlackHoleServer;
      await provider.update({
        routingTable: [{ domain: 'a.com', rules: [] }],
        enableDefaultServer: false,
        nodeInfo: { port: 1234 },
      });
      expect(spy).toHaveBeenCalled();
    });

    it('should call _addIpBlackHoleServer if !enableIpServer', async () => {
      const spy = provider._addIpBlackHoleServer;
      await provider.update({
        routingTable: [{ domain: 'a.com', rules: [] }],
        enableIpServer: false,
        nodeInfo: { port: 1234 },
      });
      expect(spy).toHaveBeenCalled();
    });

    it('should call _addUnknownHostBlackHoleServer if ABT_NODE_DOMAIN_BLACKLIST is set', async () => {
      process.env.ABT_NODE_DOMAIN_BLACKLIST = 'bad.com';
      const spy = provider._addUnknownHostBlackHoleServer;
      await provider.update({ routingTable: [{ domain: 'a.com', rules: [] }], nodeInfo: { port: 1234 } });
      expect(spy).toHaveBeenCalled();
      delete process.env.ABT_NODE_DOMAIN_BLACKLIST;
    });

    it('should call updateWhitelist', async () => {
      const spy = provider.updateWhitelist;
      await provider.update({ routingTable: [{ domain: 'a.com', rules: [] }], nodeInfo: { port: 1234 } });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('cache management', () => {
    test('clear all cache', () => {
      expect(provider.clearCache()).toEqual([provider.cacheDir]);
    });

    test('search cache', () => {
      expect(provider.searchCache('a.js')).toEqual([]);
    });
  });

  describe('getWorkerProcess', () => {
    const OLD_ENV = process.env;
    let oldIsTest;

    beforeEach(() => {
      oldIsTest = provider.isTest;
      mock.restore();

      process.env = { ...OLD_ENV };
      provider.isTest = oldIsTest;
    });

    afterEach(() => {
      process.env = OLD_ENV;
      provider.isTest = oldIsTest;
    });

    test('should return 1 if isTest === true', () => {
      provider.isTest = true;
      expect(provider.getWorkerProcess()).toEqual(1);
    });

    test('should return cpus count if isTest === false and node env is production', () => {
      process.env.NODE_ENV = 'production';
      expect(provider.getWorkerProcess(128)).toEqual(os.cpus().length);
    });

    test('should return 1 if isTest === false and node env is not production', () => {
      process.env.NODE_ENV = 'test';
      expect(provider.getWorkerProcess()).toEqual(1);
    });
  });

  describe('_addDefaultLocations', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource(`http {
          server {
            server_name _;
            listen 8080 default_server;
          }
        }`);
      const { server } = conf.nginx.http;
      provider._addDefaultLocations({ server, daemonPort: 8089, serverName: '_' });
    });

    it('should throw error if server is empty', () => {
      expect(() => provider._addDefaultLocations({ serverName: '_', daemonPort: 8089 })).toThrow(/server is required/);
      expect(() => provider._addDefaultLocations({ serverName: '_', daemonPort: 8089 }, null)).toThrow(
        /server is required/
      );
    });

    it('should throw error if daemonPort is empty', () => {
      expect(() => provider._addDefaultLocations({ server: {}, serverName: '_' })).toThrow(/daemonPort is required/);
      expect(() => provider._addDefaultLocations({ server: {}, serverName: '_' }, null)).toThrow(
        /daemonPort is required/
      );
      expect(() => provider._addDefaultLocations({ server: {}, serverName: '_' }, null)).toThrow(
        /daemonPort is required/
      );
    });

    it('should have /_abtnode_404 location', () => {
      expect(conf.nginx.http.server.location.find((x) => x._value === '/_abtnode_404')).toBeTruthy();
    });

    it('should have /_abtnode_502 location', () => {
      expect(conf.nginx.http.server.location.find((x) => x._value === '/_abtnode_502')).toBeTruthy();
    });

    it('should have blocked_access directive', () => {
      expect(conf.nginx.http.server['if ($access_blocked)']).toBeTruthy();
    });

    it('should /_abtnode_502 location have correct proxy_pass directive', () => {
      const location = conf.nginx.http.server.location.find((x) => x._value === '/_abtnode_502');
      expect(location.proxy_pass).toBeTruthy();
      expect(location.proxy_pass._value).toEqual('http://127.0.0.1:8089/error/502');
    });

    it.skip('should /_abtnode_502 location define $did if it is not defined', () => {
      const location = conf.nginx.http.server.location.find((x) => x._value === '/_abtnode_502');
      expect(location['if ($did ~ "^$")']._value).toEqual('set $did "";');
    });

    it.skip('should /_abtnode_502 location have correct proxy_set_header directive', () => {
      const location = conf.nginx.http.server.location.find((x) => x._value === '/_abtnode_502');
      expect(location.proxy_set_header._value).toEqual('x-did "$did"');
    });

    it('should have /_abtnode_5xx location', () => {
      expect(conf.nginx.http.server.location.find((x) => x._value === '/_abtnode_5xx')).toBeTruthy();
    });
  });

  describe('_addTailSlashRedirection', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource(`http {
          server {
            server_name _;
            listen 8080 default_server;

            location /demo {}
          }
        }`);
    });

    test('should not add redirection on root path(/)', () => {
      const { location } = conf.nginx.http.server;
      provider._addTailSlashRedirection(location, '/');
      expect(location._getString().trim().startsWith('location /demo')).toBeTruthy();
    });

    test('should add redirection on non-root path', () => {
      const { location } = conf.nginx.http.server;
      provider._addTailSlashRedirection(location, '/demo');
      expect(location.set.length).toEqual(2);
      expect(location.set[0]._value).toEqual('$abt_query_string ""');
      expect(location.set[1]._value).toEqual('$tail_slash_redirect_flag ""');
      expect(location['if ($query_string)']._value).toEqual('set $abt_query_string "?$query_string";');
      expect(location['if ($request_method = GET)']._value).toEqual(
        'set $tail_slash_redirect_flag "${tail_slash_redirect_flag}1";'
      );
      expect(location['if ($uri = /demo)']._value).toEqual(
        'set $tail_slash_redirect_flag "${tail_slash_redirect_flag}2";'
      );
      expect(location['if ($tail_slash_redirect_flag = 12)']._value).toEqual('return 307 /demo/$abt_query_string;');
    });
  });

  describe('_addExposeServices', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource(`http {
          server {
            server_name _;
            listen 8080 default_server;
          }
        }`);
    });

    test('should not add stream unit if no valid services', () => {
      provider._addExposeServices(conf);
      expect(typeof conf.nginx.stream).toEqual('undefined');
    });

    test('should add server unit if services if available', () => {
      provider._addExposeServices(conf, [{ port: 80, upstreamPort: 9000, protocol: 'tcp' }]);
      expect(conf.nginx.stream.server.listen._value).toEqual('80');
    });

    test('should add proxy_responses, proxy_timeout if protocol is udp', () => {
      provider._addExposeServices(conf, [{ port: 53, upstreamPort: 9000, protocol: 'udp' }]);
      expect(conf.nginx.stream.server.listen._value).toEqual('53 udp');
      expect(conf.nginx.stream.server.proxy_responses._value).toEqual(1);
      expect(conf.nginx.stream.server.proxy_timeout._value).toEqual('1s');
    });
  });

  describe('Others', () => {
    test('should create the nginx config file after initialized NginxProvider', () => {
      const tmpDir = path.join(os.tmpdir(), `nginx-${Date.now()}`);
      fs.removeSync(tmpDir);
      expect(fs.existsSync(tmpDir)).toBe(false);

      const tmpProvider = new NginxProvider({ configDir: tmpDir });
      expect(fs.existsSync(tmpProvider.configPath)).toBe(true);
      fs.removeSync(tmpDir);
    });

    test('should HTTP have three default error location', async () => {
      await provider.update({
        routingTable: [
          {
            domain: 'abtnode.com',
            rules: [{ from: { pathPrefix: '/' }, to: { port: 8089, type: ROUTING_RULE_TYPES.DAEMON } }],
          },
        ],
        nodeInfo,
      });

      const conf = await createNginxConf(provider.configPath);

      const httpServer = conf.nginx.http.server[0];

      expect(httpServer.listen._value).toEqual('80');
      expect(httpServer.location.length).toEqual(4);

      expect(!!httpServer.location.find((f) => f._value === '/_abtnode_404')).toEqual(true);
      expect(!!httpServer.location.find((f) => f._value === '/_abtnode_502')).toEqual(true);
      expect(!!httpServer.location.find((f) => f._value === '/_abtnode_5xx')).toEqual(true);
    });

    test('should HTTPS have three default error location', async () => {
      await provider.update({
        routingTable: [
          {
            domain: 'abtnode.com',
            rules: [{ from: { pathPrefix: '/' }, to: { port: 8089, type: ROUTING_RULE_TYPES.DAEMON } }],
          },
        ],
        certificates: [{ domain: 'abtnode.com', certificate: 'test', privateKey: 'test' }],
        nodeInfo,
      });

      const conf = await createNginxConf(provider.configPath);

      const httpsServer = conf.nginx.http.server.find(
        (item) => item.server_name._value === 'abtnode.com' && item.listen._value.startsWith('443 ssl')
      );

      expect(httpsServer.location.length).toEqual(4);

      expect(!!httpsServer.location.find((f) => f._value === '/_abtnode_404')).toEqual(true);
      expect(!!httpsServer.location.find((f) => f._value === '/_abtnode_502')).toEqual(true);
      expect(!!httpsServer.location.find((f) => f._value === '/_abtnode_5xx')).toEqual(true);
    });

    test('should HTTP request redirect to HTTPS', async () => {
      await provider.update({
        routingTable: [
          {
            domain: 'abtnode.com',
            rules: [{ from: { pathPrefix: '/' }, to: { port: 8089, type: ROUTING_RULE_TYPES.DAEMON } }],
          },
        ],
        certificates: [{ domain: 'abtnode.com', certificate: 'test', privateKey: 'test' }],
        nodeInfo,
      });

      const conf = await createNginxConf(provider.configPath);

      const httpServer = conf.nginx.http.server.find(
        (item) => item.server_name._value === 'abtnode.com' && item.listen._value === '80'
      );

      expect(httpServer.return._value).toEqual('307 https://$host$request_uri');
    });

    test('should handle pathSuffix correctly: location and order', async () => {
      await provider.update({
        nodeInfo,
        routingTable: [
          {
            domain: '192.168.1.2',
            rules: [
              {
                from: {
                  pathPrefix: '/demo',
                  pathSuffix: '/__blocklet__.js',
                },
                to: {
                  port: 8089,
                  did: 'zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5WMF',
                  type: ROUTING_RULE_TYPES.DAEMON,
                },
              },
              {
                from: {
                  pathPrefix: '/demo/2048',
                  pathSuffix: '/__blocklet__.js',
                },
                to: {
                  port: 8090,
                  did: 'zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5Awe',
                  type: ROUTING_RULE_TYPES.BLOCKLET,
                },
              },
            ],
          },
        ],
      });

      const conf = await createNginxConf(provider.configPath);
      const httpServer = conf.nginx.http.server[0];

      expect(httpServer.listen._value).toEqual('80');
      expect(httpServer.location.length).toEqual(5);
      expect(httpServer.location[3]._value).toEqual('~* ^/demo/2048.*/__blocklet__.js$');
      expect(httpServer.location[4]._value).toEqual('~* ^/demo.*/__blocklet__.js$');
      expect(!!httpServer.location.find((f) => f._value === '~* ^/demo.*/__blocklet__.js$')).toEqual(true);
      expect(!!httpServer.location.find((f) => f._value === '~* ^/demo/2048.*/__blocklet__.js$')).toEqual(true);
    });

    test('should generate correct config for one path blocklet', async () => {
      const daemonIP = '192.168.0.1';

      await provider.update({
        enableIpServer: true,
        nodeInfo,
        routingTable: [
          {
            domain: daemonIP,
            rules: [
              { from: {}, to: { port: 8089, type: ROUTING_RULE_TYPES.DAEMON } },
              { from: { pathPrefix: '/demo/', domain: daemonIP }, to: { port: 8093, did: 'zAbc' } },
            ],
          },
          {
            domain: '2048.abtnode.com',
            rules: [
              { from: {}, to: { port: 8090 } },
              { from: { pathPrefix: '/demo/' }, to: { port: 8093 } },
            ],
          },
          {
            domain: 'blocklets.abtnode.com',
            rules: [
              { from: { pathPrefix: 'manager' }, to: { port: 8091 } },
              { from: { pathPrefix: 'explorer' }, to: { port: 8092 } },
            ],
          },
        ],
        certificates: [{ domain: 'blocklets.abtnode.com', certificate: 'test', privateKey: 'test' }],
      });

      const conf = await createNginxConf(provider.configPath);
      expect(conf.nginx.http.server.length).toEqual(5);

      const defaultServer = conf.nginx.http.server.find(
        (item) => item.server_name._value === daemonIP && item.listen._value === '80'
      );

      expect(defaultServer.location.length).toEqual(5);

      const game2048Server = conf.nginx.http.server.find(
        (item) => item.server_name._value.trim() === '2048.abtnode.com' && item.listen._value === '80'
      );
      expect(game2048Server.location.length).toEqual(5);

      const blockletsHttpServer = conf.nginx.http.server.find(
        (item) => item.server_name._value.trim() === 'blocklets.abtnode.com' && item.listen._value === '80'
      );
      expect(blockletsHttpServer.return._value).toEqual('307 https://$host$request_uri');

      const blockletsHttpsServer = conf.nginx.http.server.find(
        (item) => item.server_name._value.trim() === 'blocklets.abtnode.com' && item.listen._value.startsWith('443 ssl')
      );
      expect(blockletsHttpsServer.location).toBeTruthy();
      expect(blockletsHttpsServer.location.length).toEqual(5);
    });

    test('should generate a default server if enableDefaultServer is true', async () => {
      await provider.update({ nodeInfo, enableDefaultServer: true, enableIpServer: true });

      const conf = await createNginxConf(provider.configPath);

      const defaultServer = conf.nginx.http.server;

      expect(defaultServer.server_name._value).toEqual('_');
      expect(defaultServer.listen._value).toEqual('80 default_server');

      expect(defaultServer.location.length).toEqual(4);
      expect(!!defaultServer.location.find((l) => l._value === '/_abtnode_404')).toBeTruthy();
      expect(!!defaultServer.location.find((l) => l._value === '/_abtnode_502')).toBeTruthy();
      expect(!!defaultServer.location.find((l) => l._value === '/_abtnode_5xx')).toBeTruthy();
      expect(!!defaultServer.location.find((l) => l._value === '/')).toBeTruthy();
    });

    test('should not generate a ip blackhole server if enableIpServer is true', async () => {
      await provider.update({ nodeInfo, enableDefaultServer: false, enableIpServer: true });

      const conf = await createNginxConf(provider.configPath);

      expect(conf.nginx.http.server._value).not.toContain(DOMAIN_FOR_IP_SITE_REGEXP); // 确保不是 ip server
    });

    test('should generate a default blackhole server if enableDefaultServer is false', async () => {
      await provider.update({ nodeInfo, enableDefaultServer: false, enableIpServer: true });

      const conf = await createNginxConf(provider.configPath);

      const defaultServer = conf.nginx.http.server;

      expect(defaultServer.server_name._value).toEqual('_');
      expect(defaultServer.listen._value).toEqual('80 default_server');
      expect(defaultServer.return._value).toEqual('444');
    });

    test('should fail validate by wrong config file', async () => {
      const configPath = path.join(provider.configDir, 'nginx.conf');
      const validate = () => provider.validateConfig().catch((err) => err);
      expect(provider.configPath).toBe(configPath);
      let result = await validate();
      expect(Object.prototype.toString.call(result)).toContain('[object');
      fs.writeFileSync(configPath, 'aaa');
      result = await provider.validateConfig().catch((err) => err);
      expect(Object.prototype.toString.call(result)).toBe('[object Error]');
    });

    test('should set server_tokens off', async () => {
      await provider.update({ nodeInfo });

      const conf = await createNginxConf(provider.configPath);

      expect(conf.nginx.http.server_tokens._value).toEqual('off');
    });

    test('should set headers of http by commonHeaders param', async () => {
      await provider.update({ commonHeaders: { 'X-Powered-By': 'ArcBlock/1.0.0', gzip: 'on' }, nodeInfo });

      const conf = await createNginxConf(provider.configPath);

      expect(conf.nginx.http.add_header.length).toEqual(3);
      expect(conf.nginx.http.add_header[0]._value).toEqual('X-Request-ID $request_id');
      expect(conf.nginx.http.add_header[1]._value).toEqual('X-Powered-By ArcBlock/1.0.0');
      expect(conf.nginx.http.add_header[2]._value).toEqual('gzip on');
    });

    test('should regex domain work as expected', async () => {
      await provider.update({
        routingTable: [
          {
            domain: 'static-demo-aaa-888-888-888-888.ip.abtnet.io',
          },
          {
            domain: '*.ip.abtnet.io',
          },
        ],
        nodeInfo,
      });

      const conf = await createNginxConf(provider.configPath);

      const blockletServer = conf.nginx.http.server[0];
      expect(blockletServer.server_name._value).toEqual('~^static-demo-aaa-\\d+-\\d+-\\d+-\\d+\\.ip\\.abtnet\\.io$');
      const dashboardServer = conf.nginx.http.server[1];
      expect(dashboardServer.server_name._value).toEqual('~.+\\.ip\\.abtnet\\.io$');
    });
  });

  describe('_addBlockletTypeLocation', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource(`http {
          server {
            server_name _;
            listen 8080 default_server;
          }
        }`);
    });

    test('should set the X-Blocklet-Did header if did is not empty', () => {
      const { server } = conf.nginx.http;
      provider._addBlockletTypeLocation({
        server,
        port: 8080,
        did: 'z8iZiL2TgFJSxiEQ9NV7eXXeUBSicViGmdrrA',
        prefix: '/demo',
        serverName: 'abtnode.com',
      });
      let proxySetHeader = server.location.proxy_set_header;
      if (!Array.isArray(proxySetHeader)) {
        proxySetHeader = [proxySetHeader];
      }
      expect(
        proxySetHeader.find(
          (x) => x._value.toLocaleLowerCase() === 'x-blocklet-did "z8iZiL2TgFJSxiEQ9NV7eXXeUBSicViGmdrrA"'.toLowerCase()
        )
      ).toBeTruthy();
      let includeData = server.location.include;
      if (!Array.isArray(includeData)) {
        includeData = [includeData];
      }
      expect(!!includeData.find((x) => x._value === 'includes/cache')).toBe(false);
    });

    test('should not set the $did variable if did is empty', () => {
      const { server } = conf.nginx.http;
      provider._addBlockletTypeLocation({ server, port: 8080, prefix: '/demo', serverName: 'abtnode.com' });
      const setLocation = server.location.set.length ? server.location.set : [server.location.set];
      expect(server.location.set._value).toBeFalsy();
      expect(setLocation.find((x) => x._value.toLocaleLowerCase().includes('$did'))).toBeFalsy();
    });

    test('should set the x-blocklet-did if did is not empty', () => {
      const { server } = conf.nginx.http;
      provider._addBlockletTypeLocation({
        server,
        port: 8080,
        did: 'z8iZiL2TgFJSxiEQ9NV7eXXeUBSicViGmdrrA',
        prefix: '/demo',
        serverName: 'abtnode.com',
        type: 'blocklet',
      });

      expect(
        server.location.proxy_set_header.find(
          (x) =>
            x._value.toLocaleLowerCase() ===
            'X-Blocklet-Did "z8iZiL2TgFJSxiEQ9NV7eXXeUBSicViGmdrrA"'.toLocaleLowerCase()
        )
      ).toBeTruthy();
    });

    test('should set the x-routing-rule-id if service is not empty', () => {
      const { server } = conf.nginx.http;
      provider._addBlockletTypeLocation({
        server,
        port: 8080,
        did: 'z8iZiL2TgFJSxiEQ9NV7eXXeUBSicViGmdrrA',
        prefix: '/demo',
        serverName: 'abtnode.com',
        services: [{ name: 'auth' }],
        ruleId: 'bd91e5cd-a5c8-445a',
        type: 'blocklet',
      });

      const headers = server.location.proxy_set_header;
      const createMatchFn = (value) => (x) => x._value.toLowerCase() === value.toLowerCase();
      expect(headers.find(createMatchFn('X-Routing-Rule-Id "bd91e5cd-a5c8-445a"'))).toBeTruthy();
    });

    test('should not set the proxy_set_header if did is empty', () => {
      const { server } = conf.nginx.http;
      provider._addBlockletTypeLocation({ server, port: 8080, prefix: '/demo', serverName: 'abtnode.com' });
      const proxySetHeaderLocation = server.location.proxy_set_header.length
        ? server.location.proxy_set_header
        : [server.location.proxy_set_header];

      expect(proxySetHeaderLocation.find((x) => x._value.toLocaleLowerCase().includes('x-Blocklet-did'))).toBeFalsy();
    });

    test('should set the expires if disabled cache', () => {
      const { server } = conf.nginx.http;
      provider.cacheEnabled = false;
      provider._addBlockletTypeLocation({ server, port: 8080, prefix: '/demo', serverName: 'abtnode.com' });
      expect(server.location.expires._value).toBe('-1');
    });

    test('should not set the expires if not enabled cache', () => {
      const { server } = conf.nginx.http;
      provider._addBlockletTypeLocation({ server, port: 8080, prefix: '/demo', serverName: 'abtnode.com' });
      expect(server.location.expires).toBe(undefined);
    });

    test('should have proxy cache if cacheGroup is correct', () => {
      const { server } = conf.nginx.http;
      provider._addBlockletTypeLocation({
        server,
        port: 8080,
        prefix: '/demo',
        serverName: 'abtnode.com',
        cacheGroup: 'blockletProxy',
      });

      let includeData = server.location.include;
      if (!Array.isArray(includeData)) {
        includeData = [includeData];
      }

      expect(!!includeData.find((x) => x._value === 'includes/cache')).toBe(true);
    });

    test('should have page-group is set', () => {
      const { server } = conf.nginx.http;
      provider._addBlockletTypeLocation({
        server,
        port: 8080,
        prefix: '/demo',
        did: 'z8iZiL2TgFJSxiEQ9NV7eXXeUBSicViGmdrrA',
        componentId: 'z8iZiL2TgFJSxiEQ9NV7eXXeUBSicViGmdrrA/zNKcEG9uVeU4SoUPS21B6YhZVCdUMTLe5Awe',
        serverName: 'abtnode.com',
        pageGroup: 'blockletProxy',
      });

      expect(
        server.location.proxy_set_header.find((x) => x._value.toLocaleLowerCase().includes('x-page-group'))
      ).toBeTruthy();
    });
  });

  describe('_addRedirectTypeLocation', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource(`http {
          server {
            server_name _;
            listen 8080 default_server;
          }
        }`);
    });

    test('should not rewrite the path if prefix === /', () => {
      const { server } = conf.nginx.http;

      provider._addRedirectTypeLocation({
        server,
        prefix: '/',
        serverName: 'abtnode.com',
        url: '/app/demo',
        redirectCode: 307,
      });

      expect(server.location.return._value).toEqual('307 /app/demo$request_uri');
    });

    test('should rewrite the path if prefix !== /', () => {
      const { server } = conf.nginx.http;

      provider._addRedirectTypeLocation({
        server,
        prefix: '/demo',
        serverName: 'abtnode.com',
        url: '/app/demo',
        redirectCode: 307,
      });

      expect(server.location.rewrite._value).toEqual('^/demo(.*) $1');
      expect(server.location.return._value).toEqual('307 /app/demo$1$abt_query_string');
    });
  });

  describe('_addRewriteTypeLocation', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource(`http {
          server {
            server_name _;
            listen 8080 default_server;
          }
        }`);
    });

    test('should rewrite the path', () => {
      const { server } = conf.nginx.http;

      provider._addRewriteTypeLocation({
        server,
        prefix: '/',
        serverName: 'abtnode.com',
        url: '/app/demo',
      });

      expect(server.location.rewrite._value).toEqual('^/(.*) /app/demo$1 last');
    });
  });

  describe('Nginx.exists', () => {
    test('should return true if nginx is available', () => {
      spyOn(shelljs, 'which').mockReturnValue('/test/usr/bin/nginx');

      expect(NginxProvider.exists()).toBe(true);
      expect(shelljs.which.mock.calls.length).toBe(1);
    });

    test('should return true if nginx is available', () => {
      spyOn(shelljs, 'which').mockReturnValue('');

      expect(NginxProvider.exists()).toBe(false);
      expect(shelljs.which.mock.calls.length).toBe(1);
    });
  });

  describe('Nginx.getUsablePorts', () => {
    // FIXME: 偶发错误，暂时跳过
    test('should getPreferredPorts without throw error', async () => {
      const ports = await NginxProvider.getUsablePorts();
      expect(ports.httpPort).toBeTruthy();
      expect(ports.httpsPort).toBeTruthy();
    });
  });

  describe('hasPortPermission', () => {
    test('should return true if the port is available', async () => {
      NginxProvider.prototype.start = mock();
      NginxProvider.prototype.stop = mock();
      spyOn(fs, 'rmSync');

      const res = await NginxProvider.hasPortPermission(80);

      expect(res).toBe(true);
      expect(NginxProvider.prototype.start).toHaveBeenCalled();
      expect(NginxProvider.prototype.stop).toHaveBeenCalled();
      expect(fs.rmSync).toHaveBeenCalled();
    });

    test('should return false if the port is not available', async () => {
      NginxProvider.prototype.start = mock().mockRejectedValue();
      NginxProvider.prototype.stop = mock();
      spyOn(fs, 'rmSync');

      const res = await NginxProvider.hasPortPermission(80);

      expect(res).toBe(false);
      expect(NginxProvider.prototype.start).toHaveBeenCalled();
      expect(NginxProvider.prototype.stop).not.toHaveBeenCalled();
      expect(fs.rmSync).toHaveBeenCalled();
    });
  });

  describe('ensureUpstreamServers', () => {
    test('should add upstream block for daemon rules and service server', async () => {
      const daemonPort = 8089;
      const blockletPort = 8090;
      const generalProxyPort = 8091;
      const routingTable = [
        {
          domain: 'abtnode.com',
          rules: [
            { from: { pathPrefix: '/' }, to: { port: daemonPort, type: ROUTING_RULE_TYPES.DAEMON } },
            { from: { pathPrefix: '/blocklet' }, to: { port: blockletPort, type: ROUTING_RULE_TYPES.BLOCKLET } },
            {
              from: { pathPrefix: '/general_proxy' },
              to: { port: generalProxyPort, type: ROUTING_RULE_TYPES.GENERAL_PROXY },
            },
            {
              from: { pathPrefix: '/general_proxy1' },
              to: { port: generalProxyPort, type: ROUTING_RULE_TYPES.GENERAL_PROXY },
            },
          ],
        },
      ];

      await provider.update({ routingTable, nodeInfo: { port: daemonPort } });

      // Only daemon and service ports get upstream blocks (blocklet/general_proxy are proxied via service)
      expect(provider.conf.nginx.http.upstream.length).toEqual(2);

      const daemonUpstream = provider.conf.nginx.http.upstream.find((item) =>
        item._getString().includes(util.getUpstreamName(daemonPort))
      );
      const serviceUpstream = provider.conf.nginx.http.upstream.find((item) =>
        item._getString().includes(util.getUpstreamName(process.env.ABT_NODE_SERVICE_PORT))
      );

      expect(!!daemonUpstream).toBe(true);
      expect(!!serviceUpstream).toBe(true);
    });
  });

  describe('_addGeneralProxyLocation', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource(`http {
          server {
            server_name _;
            listen 8080 default_server;
          }
        }`);
      const { server } = conf.nginx.http;
      provider._addDefaultLocations({ server, daemonPort: 8089, serverName: '_' });
    });

    test('should add x-blocklet-did header', () => {
      const { server } = conf.nginx.http;
      const blockletDid = 'test-blocklet-did';

      provider._addGeneralProxyLocation({
        server,
        port: 80,
        prefix: '/',
        suffix: '',
        blockletDid,
      });

      const location = provider._getLastLocation(server);

      expect(location.proxy_set_header._value).toEqual(`X-Blocklet-Did ${blockletDid}`);
    });

    test('should not add x-blocklet-did header', () => {
      const { server } = conf.nginx.http;

      provider._addGeneralProxyLocation({
        server,
        port: 80,
        prefix: '/',
        suffix: '',
      });

      const location = provider._getLastLocation(server);

      expect(typeof location.proxy_set_header).toBe('undefined');
    });

    test('should add proxy header', () => {
      const { server } = conf.nginx.http;

      provider._addGeneralProxyLocation({
        server,
        port: 80,
        prefix: '/',
        suffix: '',
      });

      const location = provider._getLastLocation(server);

      expect(location.include._value).toBe('includes/proxy');
    });
  });

  describe('updateProxyPolicy', () => {
    it('should update proxy file with realip when enabled', () => {
      provider.updateProxyPolicy({ enabled: true });

      const proxyContent = fs.readFileSync(path.join(provider.includesDir, 'proxy'), 'utf8');
      expect(proxyContent).toContain('proxy_set_header Host $host;');
      expect(proxyContent).toContain('proxy_set_header X-Forwarded-For "$http_x_forwarded_for,$realip_remote_addr";');
    });

    it('should update proxy file without realip when disabled', () => {
      provider.updateProxyPolicy({ enabled: false });

      const proxyContent = fs.readFileSync(path.join(provider.includesDir, 'proxy'), 'utf8');
      expect(proxyContent).toContain('proxy_set_header Host $host;');
      expect(proxyContent).toContain('proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;');
    });

    it('should handle undefined proxyPolicy', () => {
      provider.updateProxyPolicy(undefined);

      const proxyContent = fs.readFileSync(path.join(provider.includesDir, 'proxy'), 'utf8');
      expect(proxyContent).toContain('proxy_set_header Host $host;');
      expect(proxyContent).toContain('proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;');
    });
  });

  describe('updateBlacklist', () => {
    it('should write blacklist IPs to the blacklist file', () => {
      const blacklist = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
      provider.updateBlacklist(blacklist);

      const blacklistPath = path.join(provider.includesDir, 'blacklist');
      const fileContent = fs.readFileSync(blacklistPath, 'utf8');
      const expected = ['192.168.1.1 1;', '10.0.0.1 1;', '172.16.0.1 1;'].join(os.EOL);
      expect(fileContent).toBe(expected);
    });

    it('should handle empty blacklist', () => {
      provider.updateBlacklist([]);

      const blacklistPath = path.join(provider.includesDir, 'blacklist');
      const fileContent = fs.readFileSync(blacklistPath, 'utf8');
      expect(fileContent).toBe('');
    });
  });

  describe('_addStubStatusLocation', () => {
    let conf;
    beforeEach(async () => {
      conf = await createNginxConfFromSource(`http {
        server {
          server_name 127.0.0.1;
          listen 8080;
        }
      }`);
      provider.capabilities.httpStubStatus = true;
    });

    it('should add stub_status location if capability and server match', () => {
      provider._addStubStatusLocation(conf);
      const { server } = conf.nginx.http;
      const location = provider._getLastLocation(server);
      expect(location._value).toBe('/__nginx_status');
      expect(location.stub_status._value).toBe('on');
      expect(location.access_log._value).toBe('off');
      expect(location.allow._value).toBe('127.0.0.1');
      expect(location.deny._value).toBe('all');
    });

    it('should not add stub_status location if httpStubStatus capability is false', () => {
      provider.capabilities.httpStubStatus = false;
      provider._addStubStatusLocation(conf);
      const { server } = conf.nginx.http;
      const stubStatusLocation = server.location && server.location.find((loc) => loc._value === '/__nginx_status');
      expect(stubStatusLocation).toBeUndefined();
    });

    it('should not add stub_status location if no matching server', async () => {
      conf = await createNginxConfFromSource(`http {
        server {
          server_name localhost;
          listen 8080;
        }
      }`);
      provider.capabilities.httpStubStatus = true;
      provider._addStubStatusLocation(conf);
      const { server } = conf.nginx.http;
      const stubStatusLocation = server.location && server.location.find((loc) => loc._value === '/__nginx_status');
      expect(stubStatusLocation).toBeUndefined();
    });
  });

  describe('_addHostBlockWhitelistServer', () => {
    let conf = null;
    let OLD_ENV;
    beforeEach(async () => {
      OLD_ENV = { ...process.env };
      conf = await createNginxConfFromSource(`http {
        server {
          server_name test.local;
          listen 8080;
        }
      }`);
    });
    afterEach(() => {
      process.env = { ...OLD_ENV };
    });

    it('should do nothing if whitelist env not set', () => {
      process.env.ABT_NODE_DOMAIN_WHITELIST = '';
      process.env.ABT_NODE_DOMAIN_WHITELIST_HEADERS = '';
      provider._addHostBlockWhitelistServer({ server: conf.nginx.http.server, serverName: 'test.local' });
      // 没有 if 规则
      expect(conf.nginx.http.server['if ($http_x_test)']).toBeUndefined();
    });

    it('should do nothing if headers env is invalid json', () => {
      process.env.ABT_NODE_DOMAIN_WHITELIST = 'test.local';
      process.env.ABT_NODE_DOMAIN_WHITELIST_HEADERS = '{invalid json}';
      provider._addHostBlockWhitelistServer({ server: conf.nginx.http.server, serverName: 'test.local' });
      expect(conf.nginx.http.server['if ($http_x_test)']).toBeUndefined();
    });

    it('should add single header block rule', () => {
      process.env.ABT_NODE_DOMAIN_WHITELIST = 'test.local';
      process.env.ABT_NODE_DOMAIN_WHITELIST_HEADERS = JSON.stringify({ name: 'x-test', value: 'abc' });
      provider._addHostBlockWhitelistServer({ server: conf.nginx.http.server, serverName: 'test.local' });
      expect(conf.nginx.http.server['if ($http_x_test != abc)']).toBeTruthy();
    });

    it('should add multiple header block rules', () => {
      process.env.ABT_NODE_DOMAIN_WHITELIST = 'test.local';
      process.env.ABT_NODE_DOMAIN_WHITELIST_HEADERS = JSON.stringify([
        { name: 'x-test', value: 'abc' },
        { name: 'x-cfid', value: 'def' },
      ]);
      provider._addHostBlockWhitelistServer({ server: conf.nginx.http.server, serverName: 'test.local' });
      expect(conf.nginx.http.server['if ($http_x_test != abc)']).toBeTruthy();
      expect(conf.nginx.http.server['if ($http_x_cfid != def)']).toBeTruthy();
    });

    it('should skip invalid header config', () => {
      process.env.ABT_NODE_DOMAIN_WHITELIST = 'test.local';
      process.env.ABT_NODE_DOMAIN_WHITELIST_HEADERS = JSON.stringify([
        { name: 'x-test', value: 'abc' },
        { name: 'x-foo' },
      ]);
      provider._addHostBlockWhitelistServer({ server: conf.nginx.http.server, serverName: 'test.local' });
      expect(conf.nginx.http.server['if ($http_x_test != abc)']).toBeTruthy();
      expect(conf.nginx.http.server['if ($http_x_foo)']).toBeUndefined();
    });
  });

  describe('_addHttpServerUnit', () => {
    let conf;
    beforeEach(async () => {
      conf = await createNginxConfFromSource('http {}');
    });

    it('should add server with correct listen and server_name', () => {
      const serverName = 'mydomain.com';
      const port = 12345;
      const httpServerUnit = provider._addHttpServerUnit({ conf, serverName, port });
      expect(httpServerUnit.server_name._value).toBe(serverName);
      expect(httpServerUnit.listen._value).toBe(port);
    });

    it('should add default_server when serverName is "_"', () => {
      const serverName = '_';
      const port = 8080;
      const httpServerUnit = provider._addHttpServerUnit({ conf, serverName, port });
      expect(httpServerUnit.server_name._value).toBe(serverName);
      expect(httpServerUnit.listen._value).toBe(`${port} default_server`);
    });
  });

  describe('_addStaticLocation', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource(`http {
          server {
            server_name _;
            listen 8080 default_server;
          }
        }`);
    });

    test('should add static location with alias and try_files', () => {
      const { server } = conf.nginx.http;
      provider._addStaticLocation({
        server,
        prefix: '/app',
        staticRoot: '/var/www/blocklet',
      });

      const location = provider._getLastLocation(server);
      expect(location._value).toBe('/app');
      expect(location.alias._value).toBe('/var/www/blocklet/');
      expect(location.try_files._value).toBe('$uri $uri/ /app/index.html');
      expect(location.add_header[0]._value).toBe('Cache-Control "no-cache"');
    });

    test('should handle root path correctly', () => {
      const { server } = conf.nginx.http;
      provider._addStaticLocation({
        server,
        prefix: '/',
        staticRoot: '/var/www/root',
      });

      const location = provider._getLastLocation(server);
      expect(location.try_files._value).toBe('$uri $uri/ /index.html');
    });
  });

  describe('_addNotFoundLocation', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource(`http {
          server {
            server_name _;
            listen 8080 default_server;
          }
        }`);
    });

    test('should add 404 location with try_files', () => {
      const { server } = conf.nginx.http;
      provider._addNotFoundLocation({
        server,
        prefix: '/missing',
        suffix: '',
      });

      const location = provider._getLastLocation(server);
      expect(location._value).toBe('/missing');
      expect(location.try_files._value).toBe('$uri /404.html break');
    });
  });

  describe('_addDirectResponseLocation', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource(`http {
          server {
            server_name _;
            listen 8080 default_server;
          }
        }`);
    });

    test('should add direct response with status and body', () => {
      const { server } = conf.nginx.http;
      provider._addDirectResponseLocation({
        server,
        prefix: '/health',
        suffix: '',
        response: {
          status: 200,
          body: 'OK',
          contentType: 'text/plain',
        },
      });

      const location = provider._getLastLocation(server);
      expect(location._value).toBe('/health');
      expect(location.return._value).toBe('200 "OK"');
      expect(location.default_type._value).toBe('text/plain');
    });

    test('should handle response without content type', () => {
      const { server } = conf.nginx.http;
      provider._addDirectResponseLocation({
        server,
        prefix: '/ping',
        suffix: '',
        response: {
          status: 204,
          body: '',
        },
      });

      const location = provider._getLastLocation(server);
      expect(location.return._value).toBe('204 ""');
      expect(location.default_type).toBeUndefined();
    });
  });

  describe('addRequestLimiting', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource('http {}');
    });

    test('should add rate limiting zones when enabled', () => {
      provider.addRequestLimiting(conf.nginx.http, {
        enabled: true,
        rate: 10,
        burst: 20,
        burstDelay: 5,
        burstGlobal: 100,
        global: 1000,
        methods: ['POST', 'PUT', 'DELETE'],
      });

      const httpBlock = conf.nginx.http;
      expect(httpBlock['map $request_uri $global_rate_limit_key']).toBeTruthy();
      expect(httpBlock['map $request_uri:$request_method $ip_rate_limit_key']).toBeTruthy();

      const limitReqZones = Array.isArray(httpBlock.limit_req_zone)
        ? httpBlock.limit_req_zone
        : [httpBlock.limit_req_zone];
      expect(limitReqZones.some((z) => z._value.includes('global_rate_limit'))).toBe(true);
      expect(limitReqZones.some((z) => z._value.includes('ip_rate_limit'))).toBe(true);
      expect(httpBlock.limit_req_status._value).toBe(429);
    });

    test('should not add rate limiting when disabled', () => {
      provider.addRequestLimiting(conf.nginx.http, { enabled: false });

      const httpBlock = conf.nginx.http;
      expect(httpBlock.limit_req_zone).toBeUndefined();
    });

    test('should not add rate limiting when limit is undefined', () => {
      provider.addRequestLimiting(conf.nginx.http, undefined);

      const httpBlock = conf.nginx.http;
      expect(httpBlock.limit_req_zone).toBeUndefined();
    });
  });

  describe('updateWhitelist', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      process.env = { ...OLD_ENV };
    });

    afterEach(() => {
      process.env = OLD_ENV;
    });

    test('should write whitelist IPs to file', () => {
      process.env.ABT_NODE_IP_WHITELIST = '192.168.1.0/24,10.0.0.1';
      provider.updateWhitelist();

      const whitelistPath = path.join(provider.includesDir, 'whitelist');
      const fileContent = fs.readFileSync(whitelistPath, 'utf8');
      expect(fileContent).toContain('192.168.1.0/24 1;');
      expect(fileContent).toContain('10.0.0.1 1;');
    });

    test('should handle empty whitelist', () => {
      process.env.ABT_NODE_IP_WHITELIST = '';
      provider.updateWhitelist();

      const whitelistPath = path.join(provider.includesDir, 'whitelist');
      const fileContent = fs.readFileSync(whitelistPath, 'utf8');
      expect(fileContent).toBe('');
    });

    test('should handle undefined whitelist env', () => {
      delete process.env.ABT_NODE_IP_WHITELIST;
      provider.updateWhitelist();

      const whitelistPath = path.join(provider.includesDir, 'whitelist');
      const fileContent = fs.readFileSync(whitelistPath, 'utf8');
      expect(fileContent).toBe('');
    });
  });

  describe('getLogFilesForToday', () => {
    test('should return log file paths', () => {
      const logFiles = provider.getLogFilesForToday();

      expect(logFiles.access).toBe(provider.accessLog);
      expect(logFiles.error).toBe(provider.errorLog);
      expect(logFiles.security).toBe(provider.securityLog);
    });
  });

  describe('getStatus', () => {
    test('should call util.getNginxStatus with configDir', async () => {
      const mockStatus = { running: true, managed: true, pid: 12345 };
      spyOn(util, 'getNginxStatus').mockResolvedValue(mockStatus);

      const status = await provider.getStatus();

      expect(util.getNginxStatus).toHaveBeenCalledWith(provider.configDir);
      expect(status).toEqual(mockStatus);
    });
  });

  describe('_cleanupSiteConfFiles', () => {
    beforeEach(() => {
      fs.ensureDirSync(provider.sitesDir);
    });

    test('should remove conf files not in keepDids', () => {
      // Create some test conf files
      fs.writeFileSync(path.join(provider.sitesDir, 'did1.conf'), 'test');
      fs.writeFileSync(path.join(provider.sitesDir, 'did2.conf'), 'test');
      fs.writeFileSync(path.join(provider.sitesDir, 'did3.conf'), 'test');

      provider._cleanupSiteConfFiles(['did1', 'did3']);

      expect(fs.existsSync(path.join(provider.sitesDir, 'did1.conf'))).toBe(true);
      expect(fs.existsSync(path.join(provider.sitesDir, 'did2.conf'))).toBe(false);
      expect(fs.existsSync(path.join(provider.sitesDir, 'did3.conf'))).toBe(true);
    });

    test('should handle empty keepDids', () => {
      fs.writeFileSync(path.join(provider.sitesDir, 'did1.conf'), 'test');

      provider._cleanupSiteConfFiles([]);

      expect(fs.existsSync(path.join(provider.sitesDir, 'did1.conf'))).toBe(false);
    });

    test('should handle non-existent sitesDir', () => {
      fs.removeSync(provider.sitesDir);

      // Should not throw
      expect(() => provider._cleanupSiteConfFiles(['did1'])).not.toThrow();
    });
  });

  describe('_generateBlockletSiteConfFile', () => {
    test('should generate conf file for blocklet sites', async () => {
      const blockletDid = 'zTestBlockletDid123';
      const sites = [
        {
          domain: 'app.example.com',
          rules: [
            {
              from: { pathPrefix: '/' },
              to: { port: 8090, type: ROUTING_RULE_TYPES.BLOCKLET },
            },
          ],
          serviceType: 'blocklet',
        },
      ];

      await provider._generateBlockletSiteConfFile({
        blockletDid,
        sites,
        certificates: [],
        nodeInfo: { port: 8089 },
        commonHeaders: {},
      });

      const confPath = path.join(provider.sitesDir, `${blockletDid}.conf`);
      expect(fs.existsSync(confPath)).toBe(true);

      const content = fs.readFileSync(confPath, 'utf8');
      expect(content).toContain('server_name app.example.com');
    });

    test('should handle HTTPS sites with certificates', async () => {
      const blockletDid = 'zTestBlockletDidHttps';
      const sites = [
        {
          domain: 'secure.example.com',
          rules: [],
          serviceType: 'blocklet',
        },
      ];
      const certificates = [
        {
          domain: 'secure.example.com',
          certificate: 'test-cert',
          privateKey: 'test-key',
        },
      ];

      await provider._generateBlockletSiteConfFile({
        blockletDid,
        sites,
        certificates,
        nodeInfo: { port: 8089 },
        commonHeaders: {},
      });

      const confPath = path.join(provider.sitesDir, `${blockletDid}.conf`);
      expect(fs.existsSync(confPath)).toBe(true);

      const content = fs.readFileSync(confPath, 'utf8');
      expect(content).toContain('ssl');
    });
  });

  describe('Hash-based incremental updates', () => {
    describe('_loadHashes and _saveHashes', () => {
      test('should save and load hashes correctly', () => {
        provider.configHashes.global = 'test-global-hash';
        provider.configHashes.blocklets.set('did1', 'hash1');
        provider.configHashes.blocklets.set('did2', 'hash2');

        provider._saveHashes();

        expect(fs.existsSync(provider.hashFilePath)).toBe(true);

        // Create new provider to test loading
        const newProvider = new NginxProvider({ configDir });
        expect(newProvider.configHashes.global).toBe('test-global-hash');
        expect(newProvider.configHashes.blocklets.get('did1')).toBe('hash1');
        expect(newProvider.configHashes.blocklets.get('did2')).toBe('hash2');
      });

      test('should handle missing hash file gracefully', () => {
        fs.removeSync(provider.hashFilePath);

        provider._loadHashes();

        expect(provider.configHashes.global).toBeNull();
        expect(provider.configHashes.blocklets.size).toBe(0);
      });

      test('should handle invalid JSON in hash file', () => {
        fs.writeFileSync(provider.hashFilePath, 'invalid json');

        provider._loadHashes();

        expect(provider.configHashes.global).toBeNull();
        expect(provider.configHashes.blocklets.size).toBe(0);
      });
    });

    describe('hasHashFile', () => {
      test('should return true when hash file exists with global hash', () => {
        provider.configHashes.global = 'test-hash';
        provider._saveHashes();

        expect(provider.hasHashFile()).toBe(true);
      });

      test('should return false when hash file does not exist', () => {
        fs.removeSync(provider.hashFilePath);
        provider.configHashes.global = null;

        expect(provider.hasHashFile()).toBe(false);
      });
    });

    describe('_computeGlobalConfigHash', () => {
      test('should compute consistent hash for same config', () => {
        const params = {
          nodeInfo: { port: 8089 },
          requestLimit: { enabled: true, rate: 10 },
          cacheEnabled: true,
          enableDefaultServer: true,
          enableIpServer: false,
        };

        const hash1 = provider._computeGlobalConfigHash(params);
        const hash2 = provider._computeGlobalConfigHash(params);

        expect(hash1).toBe(hash2);
      });

      test('should compute different hash for different config', () => {
        const params1 = {
          nodeInfo: { port: 8089 },
          cacheEnabled: true,
        };
        const params2 = {
          nodeInfo: { port: 8089 },
          cacheEnabled: false,
        };

        const hash1 = provider._computeGlobalConfigHash(params1);
        const hash2 = provider._computeGlobalConfigHash(params2);

        expect(hash1).not.toBe(hash2);
      });
    });

    describe('_computeBlockletConfigHash', () => {
      test('should compute consistent hash for same blocklet config', () => {
        const blockletSites = [{ domain: 'app.example.com', rules: [] }];

        const hash1 = provider._computeBlockletConfigHash('did1', blockletSites, [], false);
        const hash2 = provider._computeBlockletConfigHash('did1', blockletSites, [], false);

        expect(hash1).toBe(hash2);
      });

      test('should compute different hash when wafDisabled changes', () => {
        const blockletSites = [{ domain: 'app.example.com', rules: [] }];

        const hash1 = provider._computeBlockletConfigHash('did1', blockletSites, [], false);
        const hash2 = provider._computeBlockletConfigHash('did1', blockletSites, [], true);

        expect(hash1).not.toBe(hash2);
      });
    });

    describe('_removeBlockletConfig', () => {
      test('should remove blocklet conf file and hash', () => {
        const blockletDid = 'zTestRemoveDid';
        const confPath = path.join(provider.sitesDir, `${blockletDid}.conf`);

        fs.ensureDirSync(provider.sitesDir);
        fs.writeFileSync(confPath, 'test content');
        provider.configHashes.blocklets.set(blockletDid, 'test-hash');

        provider._removeBlockletConfig(blockletDid);

        expect(fs.existsSync(confPath)).toBe(false);
        expect(provider.configHashes.blocklets.has(blockletDid)).toBe(false);
      });

      test('should handle non-existent conf file gracefully', () => {
        const blockletDid = 'zNonExistentDid';
        provider.configHashes.blocklets.set(blockletDid, 'test-hash');

        expect(() => provider._removeBlockletConfig(blockletDid)).not.toThrow();
        expect(provider.configHashes.blocklets.has(blockletDid)).toBe(false);
      });
    });
  });

  describe('_addCommonResHeaders', () => {
    let conf = null;
    beforeEach(async () => {
      conf = await createNginxConfFromSource('http {}');
    });

    test('should add X-Request-ID and custom headers', () => {
      provider._addCommonResHeaders(conf.nginx.http, {
        'X-Custom-Header': '"custom-value"',
        'X-Powered-By': '"ArcBlock"',
      });

      const headers = Array.isArray(conf.nginx.http.add_header)
        ? conf.nginx.http.add_header
        : [conf.nginx.http.add_header];

      expect(headers.find((h) => h._value === 'X-Request-ID $request_id')).toBeTruthy();
      expect(headers.find((h) => h._value === 'X-Custom-Header "custom-value"')).toBeTruthy();
      expect(headers.find((h) => h._value === 'X-Powered-By "ArcBlock"')).toBeTruthy();
    });

    test('should handle null headers', () => {
      provider._addCommonResHeaders(conf.nginx.http, null);

      expect(conf.nginx.http.add_header).toBeUndefined();
    });

    test('should handle non-object headers', () => {
      provider._addCommonResHeaders(conf.nginx.http, 'invalid');

      expect(conf.nginx.http.add_header).toBeUndefined();
    });

    test('should add X-Robots-Tag when ABT_NODE_NO_INDEX is set', () => {
      const original = process.env.ABT_NODE_NO_INDEX;
      process.env.ABT_NODE_NO_INDEX = 'true';

      try {
        const commonHeaders = { 'X-Powered-By': '"Test"' };
        const effective = process.env.ABT_NODE_NO_INDEX
          ? { ...(commonHeaders || {}), 'X-Robots-Tag': '"noindex, nofollow"' }
          : commonHeaders;

        provider._addCommonResHeaders(conf.nginx.http, effective);

        const headers = Array.isArray(conf.nginx.http.add_header)
          ? conf.nginx.http.add_header
          : [conf.nginx.http.add_header];

        expect(headers.find((h) => h._value === 'X-Robots-Tag "noindex, nofollow"')).toBeTruthy();
        expect(headers.find((h) => h._value === 'X-Powered-By "Test"')).toBeTruthy();
      } finally {
        if (original === undefined) {
          delete process.env.ABT_NODE_NO_INDEX;
        } else {
          process.env.ABT_NODE_NO_INDEX = original;
        }
      }
    });

    test('should not add X-Robots-Tag when ABT_NODE_NO_INDEX is not set', () => {
      const original = process.env.ABT_NODE_NO_INDEX;
      delete process.env.ABT_NODE_NO_INDEX;

      try {
        const commonHeaders = { 'X-Powered-By': '"Test"' };
        const effective = process.env.ABT_NODE_NO_INDEX
          ? { ...(commonHeaders || {}), 'X-Robots-Tag': '"noindex, nofollow"' }
          : commonHeaders;

        provider._addCommonResHeaders(conf.nginx.http, effective);

        const headers = Array.isArray(conf.nginx.http.add_header)
          ? conf.nginx.http.add_header
          : [conf.nginx.http.add_header];

        expect(headers.find((h) => h._value.includes('X-Robots-Tag'))).toBeFalsy();
      } finally {
        if (original === undefined) {
          delete process.env.ABT_NODE_NO_INDEX;
        } else {
          process.env.ABT_NODE_NO_INDEX = original;
        }
      }
    });

    test('should handle undefined commonHeaders when ABT_NODE_NO_INDEX is set', () => {
      const original = process.env.ABT_NODE_NO_INDEX;
      process.env.ABT_NODE_NO_INDEX = 'true';

      try {
        const commonHeaders = undefined;
        const effective = process.env.ABT_NODE_NO_INDEX
          ? { ...(commonHeaders || {}), 'X-Robots-Tag': '"noindex, nofollow"' }
          : commonHeaders;

        provider._addCommonResHeaders(conf.nginx.http, effective);

        const headers = Array.isArray(conf.nginx.http.add_header)
          ? conf.nginx.http.add_header
          : [conf.nginx.http.add_header];

        expect(headers.find((h) => h._value === 'X-Robots-Tag "noindex, nofollow"')).toBeTruthy();
      } finally {
        if (original === undefined) {
          delete process.env.ABT_NODE_NO_INDEX;
        } else {
          process.env.ABT_NODE_NO_INDEX = original;
        }
      }
    });
  });

  describe('_getEffectiveCommonHeaders', () => {
    test('should force noindex when blocklet has BLOCKLET_NO_INDEX=true, even if server default is off', () => {
      const commonHeaders = { 'X-Powered-By': '"Test"' };
      const noIndexOverrides = { 'did:blocklet:abc': true };

      const result = provider._getEffectiveCommonHeaders(commonHeaders, 'did:blocklet:abc', noIndexOverrides);

      expect(result['X-Robots-Tag']).toBe('"noindex, nofollow"');
      expect(result['X-Powered-By']).toBe('"Test"');
    });

    test('should force allow index when blocklet has BLOCKLET_NO_INDEX=false, even if server default is on', () => {
      const commonHeaders = { 'X-Powered-By': '"Test"', 'X-Robots-Tag': '"noindex, nofollow"' };
      const noIndexOverrides = { 'did:blocklet:abc': false };

      const result = provider._getEffectiveCommonHeaders(commonHeaders, 'did:blocklet:abc', noIndexOverrides);

      expect(result['X-Robots-Tag']).toBeUndefined();
      expect(result['X-Powered-By']).toBe('"Test"');
    });

    test('should follow server default when blocklet has no override', () => {
      const commonHeaders = { 'X-Powered-By': '"Test"', 'X-Robots-Tag': '"noindex, nofollow"' };
      const noIndexOverrides = {};

      const result = provider._getEffectiveCommonHeaders(commonHeaders, 'did:blocklet:abc', noIndexOverrides);

      expect(result['X-Robots-Tag']).toBe('"noindex, nofollow"');
      expect(result['X-Powered-By']).toBe('"Test"');
    });

    test('should follow server default when blockletDid is not provided (system site)', () => {
      const commonHeaders = { 'X-Robots-Tag': '"noindex, nofollow"' };
      const noIndexOverrides = { 'did:blocklet:abc': false };

      const result = provider._getEffectiveCommonHeaders(commonHeaders, undefined, noIndexOverrides);

      expect(result['X-Robots-Tag']).toBe('"noindex, nofollow"');
    });

    test('should not modify original commonHeaders object', () => {
      const commonHeaders = { 'X-Robots-Tag': '"noindex, nofollow"' };
      const noIndexOverrides = { 'did:blocklet:abc': false };

      provider._getEffectiveCommonHeaders(commonHeaders, 'did:blocklet:abc', noIndexOverrides);

      expect(commonHeaders['X-Robots-Tag']).toBe('"noindex, nofollow"');
    });
  });

  describe('reload', () => {
    test('should reload successfully when nginx is managed', async () => {
      util.getNginxStatus = mock().mockResolvedValue({
        managed: true,
        running: true,
        pid: 12345,
      });

      const execSpy = spyOn(provider, '_exec').mockImplementation((param) => {
        if (param === 'reload') {
          return { stdout: 'reload success', code: 0 };
        }
        return { stdout: 'default', code: 0 };
      });

      const result = await provider.reload();

      expect(execSpy).toHaveBeenCalledWith('reload');
      expect(result.stdout).toBe('reload success');

      execSpy.mockRestore();
    });

    test('should fallback to start when reload fails', async () => {
      util.getNginxStatus = mock().mockResolvedValue({
        managed: true,
        running: true,
        pid: 12345,
      });

      const execSpy = spyOn(provider, '_exec').mockImplementation((param) => {
        if (param === 'reload') {
          throw new Error('PID file not found');
        }
        return { stdout: 'start success', code: 0 };
      });

      const result = await provider.reload();

      expect(execSpy).toHaveBeenCalledTimes(2);
      expect(execSpy).toHaveBeenNthCalledWith(1, 'reload');
      expect(execSpy).toHaveBeenNthCalledWith(2);
      expect(result.stdout).toBe('start success');

      execSpy.mockRestore();
    });

    test('should start nginx when not managed', async () => {
      util.getNginxStatus = mock().mockResolvedValue({
        managed: false,
        running: false,
        pid: 0,
      });

      const execSpy = spyOn(provider, '_exec').mockReturnValue({
        stdout: 'start success',
        code: 0,
      });

      const result = await provider.reload();

      expect(execSpy).toHaveBeenCalledWith();
      expect(result.stdout).toBe('start success');

      execSpy.mockRestore();
    });
  });

  describe('Sub-Service functionality', () => {
    describe('full sub-service site configuration', () => {
      test('should generate correct nginx config for wildcard sub-service site', async () => {
        const sites = [
          {
            domain: '*.staging.example.com',
            port: 80,
            type: ROUTING_RULE_TYPES.SUB_SERVICE,
            blockletDid: 'test-blocklet-did',
            serviceType: 'blocklet',
            rules: [
              {
                from: { pathPrefix: '/' },
                to: {
                  type: ROUTING_RULE_TYPES.SUB_SERVICE,
                  staticRoot: '/data/blocklet/sites',
                },
                type: ROUTING_RULE_TYPES.SUB_SERVICE,
                staticRoot: '/data/blocklet/sites',
                prefix: '/',
                suffix: '',
              },
            ],
          },
        ];

        await provider.update({
          routingTable: sites,
          nodeInfo,
          certificates: [],
          services: [],
        });

        // Sub-service sites with blockletDid are written to separate conf files
        const confContent = fs.readFileSync(path.join(configDir, 'sites/test-blocklet-did.conf'), 'utf-8');

        // Should contain wildcard server_name with subdomain capture
        expect(confContent).toContain('(?<subdomain>.+)');
        expect(confContent).toContain('\\.staging\\.example\\.com');

        // Should contain root with $subdomain variable
        expect(confContent).toContain('/data/blocklet/sites/$subdomain');

        // Should contain SPA fallback
        expect(confContent).toContain('try_files');
        expect(confContent).toContain('index.html');
      });

      test('should generate correct nginx config for single domain sub-service site', async () => {
        const sites = [
          {
            domain: 'sites.example.com',
            port: 80,
            type: ROUTING_RULE_TYPES.SUB_SERVICE,
            blockletDid: 'test-blocklet-did',
            serviceType: 'blocklet',
            rules: [
              {
                from: { pathPrefix: '/' },
                to: {
                  type: ROUTING_RULE_TYPES.SUB_SERVICE,
                  staticRoot: '/data/blocklet/public',
                },
                type: ROUTING_RULE_TYPES.SUB_SERVICE,
                staticRoot: '/data/blocklet/public',
                prefix: '/',
                suffix: '',
              },
            ],
          },
        ];

        await provider.update({
          routingTable: sites,
          nodeInfo,
          certificates: [],
          services: [],
        });

        // Sub-service sites with blockletDid are written to separate conf files
        const confContent = fs.readFileSync(path.join(configDir, 'sites/test-blocklet-did.conf'), 'utf-8');

        // Should contain exact server_name (not regex with subdomain capture)
        expect(confContent).toContain('sites.example.com');

        // Should NOT contain subdomain capture
        expect(confContent).not.toContain('(?<subdomain>');

        // Should contain root without $subdomain variable
        expect(confContent).toContain('root /data/blocklet/public');
        expect(confContent).not.toContain('$subdomain');

        // Should contain SPA fallback
        expect(confContent).toContain('try_files');
        expect(confContent).toContain('index.html');
      });

      test('should add cache control and security headers for sub-service', async () => {
        const sites = [
          {
            domain: 'static.example.com',
            port: 80,
            type: ROUTING_RULE_TYPES.SUB_SERVICE,
            blockletDid: 'test-blocklet-did',
            serviceType: 'blocklet',
            rules: [
              {
                from: { pathPrefix: '/' },
                to: {
                  type: ROUTING_RULE_TYPES.SUB_SERVICE,
                  staticRoot: '/data/static',
                },
                type: ROUTING_RULE_TYPES.SUB_SERVICE,
                staticRoot: '/data/static',
                prefix: '/',
                suffix: '',
              },
            ],
          },
        ];

        await provider.update({
          routingTable: sites,
          nodeInfo,
          certificates: [],
          services: [],
        });

        // Sub-service sites with blockletDid are written to separate conf files
        const confContent = fs.readFileSync(path.join(configDir, 'sites/test-blocklet-did.conf'), 'utf-8');

        // Should contain cache control headers
        expect(confContent).toContain('Cache-Control "no-cache"');

        // Should contain security headers
        expect(confContent).toContain('X-Content-Type-Options');
      });
    });
  });
});
