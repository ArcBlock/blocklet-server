const { test, expect, describe, mock, it } = require('bun:test');
const path = require('path');
const shelljs = require('shelljs');

const {
  formatError,
  getNginxLoadModuleDirectives,
  parseNginxConfigArgs,
  getMissingModules,
  getUserGroup,
  getWorkerConnectionCount,
  getCachePathDirective,
  getUpstreamName,
} = require('../../lib/nginx/util');

const errStr = `nginx: [emerg] bind() to 0.0.0.0:8080 failed (48: Address already in use)
nginx: [emerg] bind() to 0.0.0.0:8080 failed (48: Address already in use)
nginx: [emerg] bind() to 0.0.0.0:8080 failed (48: Address already in use)
nginx: [emerg] bind() to 0.0.0.0:8080 failed (48: Address already in use)
nginx: [emerg] bind() to 0.0.0.0:8080 failed (48: Address already in use)
nginx: [emerg] still could not bind()`;

describe('Util', () => {
  describe('formatNginxError', () => {
    test('should be a function', () => {
      expect(typeof formatError).toEqual('function');
    });

    test('should return on empty', () => {
      expect(formatError('')).toEqual('');
    });

    test('should handle single line as expected', () => {
      expect(formatError('nginx: [emerg] bind() to 0.0.0.0:8080 failed (48: Address already in use)')).toEqual(
        'bind() to 0.0.0.0:8080 failed (48: Address already in use)'
      );
    });

    test('should handle multiple line as expected', () => {
      expect(formatError(errStr)).toEqual(
        'bind() to 0.0.0.0:8080 failed (48: Address already in use);still could not bind()'
      );
    });

    test('should handle syntax check output correctly', () => {
      expect(
        // eslint-disable-next-line max-len
        formatError(`nginx: [emerg] duplicate location "/admin/" in /Users/wangshijun/.abtnode/router/nginx/nginx.conf:46
    nginx: configuration file /Users/wangshijun/.abtnode/router/nginx/nginx.conf test failed`)
      ).toEqual('duplicate location "/admin/" in /Users/wangshijun/.abtnode/router/nginx/nginx.conf:46');
    });
  });

  describe('parseNginxConfigArgs', () => {
    const testConfigArgs = `nginx version: nginx/1.18.0
  built by gcc 7.3.1 20180712 (Red Hat 7.3.1-8) (GCC)
  built with OpenSSL 1.0.2k-fips  26 Jan 2017
  TLS SNI support enabled
  configure arguments: --prefix=/usr/share/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --http-client-body-temp-path=/var/lib/nginx/tmp/client_body --http-proxy-temp-path=/var/lib/nginx/tmp/proxy --http-fastcgi-temp-path=/var/lib/nginx/tmp/fastcgi --http-uwsgi-temp-path=/var/lib/nginx/tmp/uwsgi --http-scgi-temp-path=/var/lib/nginx/tmp/scgi --pid-path=/run/nginx.pid --lock-path=/run/lock/subsys/nginx --user=nginx --group=nginx --with-file-aio --with-ipv6 --with-http_ssl_module --with-http_v2_module --with-http_realip_module --with-stream_ssl_preread_module --with-http_addition_module --with-http_xslt_module=dynamic --with-http_image_filter_module=dynamic --with-http_geoip_module=dynamic --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_degradation_module --with-http_slice_module --with-http_stub_status_module --with-http_perl_module=dynamic --with-http_auth_request_module --with-mail=dynamic --with-mail_ssl_module --with-pcre --with-pcre-jit --with-stream=dynamic --with-stream_ssl_module --with-google_perftools_module --with-debug --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -specs=/usr/lib/rpm/redhat/redhat-hardened-cc1 -m64 -mtune=generic' --with-ld-opt='-Wl,-z,relro -specs=/usr/lib/rpm/redhat/redhat-hardened-ld -Wl,-E'`; // eslint-disable-line max-len

    it('should return null if config arguments is empty', () => {
      expect(parseNginxConfigArgs()).toEqual(null);
      expect(parseNginxConfigArgs(null)).toEqual(null);
      expect(parseNginxConfigArgs('')).toEqual(null);
    });

    it('should return valid object if config arguments is valid', () => {
      const parsedResult = parseNginxConfigArgs(testConfigArgs);
      expect(typeof parsedResult).toEqual('object');
      expect(parsedResult['with-stream']).toEqual('dynamic');
      expect(parsedResult['modules-path']).toEqual('/usr/lib64/nginx/modules');
    });
  });
  describe('getNginxLoadModuleDirectives', () => {
    const requiredModules = [
      { configName: 'with-stream', moduleBinaryName: 'ngx_stream_module.so' },
      { configName: 'with-test', moduleBinaryName: 'nginx_test.so' },
    ];

    it('should return empty array if required modules is empty', () => {
      expect(getNginxLoadModuleDirectives()).toEqual([]);
      expect(getNginxLoadModuleDirectives(null)).toEqual([]);
      expect(getNginxLoadModuleDirectives('')).toEqual([]);
      expect(getNginxLoadModuleDirectives({})).toEqual([]);
      expect(getNginxLoadModuleDirectives([])).toEqual([]);
    });

    it('should return empty array if configuration arguments is invalid', () => {
      expect(getNginxLoadModuleDirectives(requiredModules)).toEqual([]);
      expect(getNginxLoadModuleDirectives(requiredModules, {})).toEqual([]);
      expect(getNginxLoadModuleDirectives(requiredModules, null)).toEqual([]);
    });

    it('should return empty array if configuration arguments does not contains module-path attribute', () => {
      expect(getNginxLoadModuleDirectives(requiredModules, { test: 'does-not' })).toEqual([]);
    });

    it('should return required load_module directive if the module is not dynamic', () => {
      expect(
        getNginxLoadModuleDirectives(requiredModules, {
          'modules-path': '/usr/lib64/nginx/modules',
          'with-stream': '',
        })
      ).toEqual([]);
    });

    it('should return required load_module directive if the module is dynamic', () => {
      expect(
        getNginxLoadModuleDirectives(requiredModules, {
          'modules-path': '/usr/lib64/nginx/modules',
          'with-stream': 'dynamic',
          'with-test': 'dynamic',
        })
      ).toEqual([
        `load_module ${path.join('/usr/lib64/nginx/modules', 'ngx_stream_module.so')};`,
        `load_module ${path.join('/usr/lib64/nginx/modules', 'nginx_test.so')};`,
      ]);
    });
  });

  describe('getMissingModules', () => {
    it('ngx_http_realip_module is required', () => {
      const configParams = { 'with-stream': '', 'with-http_ssl_module': '' };
      expect(getMissingModules(configParams)).toEqual(['ngx_http_realip_module']);
    });

    it('ngx_stream_proxy_module is required', () => {
      const configParams = { 'with-http_realip_module': '', 'with-http_ssl_module': '' };
      expect(getMissingModules(configParams)).toEqual(['ngx_stream_proxy_module']);
    });

    it('ngx_http_ssl_module is required', () => {
      const configParams = { 'with-http_realip_module': '', 'with-stream': '' };
      expect(getMissingModules(configParams)).toEqual(['ngx_http_ssl_module']);
    });
  });

  describe('getUserGroup', () => {
    it('should throw error if username is empty', () => {
      expect(() => getUserGroup()).toThrow('username param is required');
      expect(() => getUserGroup('')).toThrow('username param is required');
      expect(() => getUserGroup(null)).toThrow('username param is required');
    });
  });

  describe('getWorkerConnectionCount', () => {
    test('should return maxWorkerConnections if maxWorkerConnections < ulimit/workerProcess', () => {
      shelljs.exec = mock().mockReturnValue({ code: 0, stdout: '100' });
      const maxWorkerConnections = 49;
      const count = getWorkerConnectionCount(maxWorkerConnections, 2);

      expect(count).toBe(maxWorkerConnections);
      expect(shelljs.exec).toBeCalledTimes(1);
    });

    test('should return maxWorkerConnections if maxWorkerConnections > ulimit/workerProcess', () => {
      shelljs.exec = mock().mockReturnValue({ code: 0, stdout: '100' });
      const maxWorkerConnections = 51;
      const count = getWorkerConnectionCount(maxWorkerConnections, 2);

      expect(count).toBe(100 / 2);
      expect(shelljs.exec).toBeCalledTimes(1);
    });

    test('should return maxWorkerConnections if get ulimit failed', () => {
      shelljs.exec = mock().mockReturnValue({ code: 127, stdout: '100' });
      const maxWorkerConnections = 51;
      const count = getWorkerConnectionCount(maxWorkerConnections, 2);

      expect(count).toBe(maxWorkerConnections);
      expect(shelljs.exec).toBeCalledTimes(1);
    });

    test('should return maxWorkerConnections if ulimit is unlimited', () => {
      shelljs.exec = mock().mockReturnValue({ code: 0, stdout: 'unlimited' });
      const maxWorkerConnections = 10240;
      const count = getWorkerConnectionCount(maxWorkerConnections, 2);

      expect(count).toBe(maxWorkerConnections);
      expect(shelljs.exec).toBeCalledTimes(1);
    });

    test('should return maxWorkerConnections if ulimit is NaN', () => {
      shelljs.exec = mock().mockReturnValue({ code: 0, stdout: 'invalid-value' });
      const maxWorkerConnections = 10240;
      const count = getWorkerConnectionCount(maxWorkerConnections, 2);

      expect(count).toBe(maxWorkerConnections);
      expect(shelljs.exec).toBeCalledTimes(1);
    });
  });

  describe('getUpstreamName', () => {
    test('should return correct name', () => {
      const port = 8090;

      expect(getUpstreamName(port)).toEqual(`server_${port}`);
    });
  });

  describe('getCachePathDirective', () => {
    test('should return cache path', () => {
      expect(getCachePathDirective('cache', 'not-exist')).toEqual('');
      expect(getCachePathDirective('cache', 'blockletProxy')).toBeTruthy();
    });
  });
});
