const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { default: axios } = require('axios');
const isUrl = require('is-url');
const { isAllowedURL } = require('@abtnode/util/lib/ssrf-protector');

const logger = require('../libs/logger')('blocklet-services:csp-proxy');

const PREFIX = WELLKNOWN_SERVICE_PATH_PREFIX;

// 允许的图片内容类型和 JSON 内容类型
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/bmp',
  'image/x-icon',
  'application/json',
];

/**
 * 检查请求来源是否合法
 */
function checkReferer(req) {
  if (req.get('x-amz-cf-id')) {
    return true;
  }

  const referer = req.get('referer');
  if (!referer) {
    return false;
  }

  try {
    const refererUrl = new URL(referer);
    const currentHost = req.get('x-real-hostname') || req.get('host');

    // 检查referer是否来自当前站点
    return refererUrl.hostname === currentHost || refererUrl.hostname === currentHost.split(':')[0]; // 处理端口号情况
  } catch {
    return false;
  }
}

/**
 * 检查内容类型是否为允许的图片类型
 */
function isAllowedContentType(contentType) {
  if (!contentType) return false;
  const lowerContentType = contentType.toLowerCase();
  return ALLOWED_CONTENT_TYPES.some((type) => lowerContentType.startsWith(type));
}

module.exports = {
  init(server) {
    server.get(`${PREFIX}/proxy`, async (req, res) => {
      const { url } = req.query;

      if (!url) {
        res.status(400).send('Invalid parameter: empty');
        return;
      }

      if (!isUrl(url)) {
        res.status(400).send('Invalid parameter: invalid');
        return;
      }

      // 检查referer来源
      if (!checkReferer(req)) {
        res.status(403).send('Invalid parameter: referer');
        return;
      }

      try {
        const tmp = new URL(url);
        if (tmp.protocol !== 'https:') {
          res.status(400).send('Invalid parameter: protocol');
          return;
        }

        // 检查是否为内网地址，防止SSRF攻击
        if (!(await isAllowedURL(url))) {
          res.status(400).send('Invalid parameter: internal');
          return;
        }

        // 配置axios请求，确保不传递用户的cookie等认证信息
        const requestConfig = {
          maxRedirects: 0,
          headers: {
            'User-Agent': 'BlockletServer-CSP-Proxy/1.0',
          },
        };

        // 直接发起GET请求，在响应头返回后立即检查content-type
        const response = await axios.get(url, {
          ...requestConfig,
          responseType: 'stream',
        });

        // 立即检查响应的content-type
        const contentType = response.headers['content-type'];
        if (!isAllowedContentType(contentType)) {
          // 立即销毁stream并返回错误，避免继续下载
          response.data.destroy();
          res.status(400).send('Invalid parameter: content-type');
          return;
        }

        // 设置响应头
        res.set('Content-Type', response.headers['content-type']);
        if (response.headers['content-length']) {
          res.set('Content-Length', response.headers['content-length']);
        }

        // 关键安全头：防止第三方内容获取本站cookie
        const securityHeaders = {
          // 防止浏览器MIME类型嗅探，严格按content-type处理
          'X-Content-Type-Options': 'nosniff',
          // 禁止发送referrer信息，保护隐私
          'Referrer-Policy': 'no-referrer',
          // 防止XSS攻击
          'X-XSS-Protection': '1; mode=block',
        };

        // 根据内容类型设置不同的安全策略
        const lowerContentType = contentType.toLowerCase();

        if (lowerContentType.startsWith('application/json')) {
          // JSON响应：严格禁止执行和嵌入
          securityHeaders['Content-Security-Policy'] = "default-src 'none'; script-src 'none'; object-src 'none';";
          securityHeaders['X-Frame-Options'] = 'DENY';
        } else if (lowerContentType.startsWith('image/svg+xml')) {
          // SVG图片：禁止脚本但允许样式，可能需要嵌入使用
          securityHeaders['Content-Security-Policy'] =
            "default-src 'none'; script-src 'none'; style-src 'unsafe-inline';";
          securityHeaders['X-Frame-Options'] = 'SAMEORIGIN'; // 允许同源嵌入
        } else if (lowerContentType.startsWith('image/')) {
          // 普通图片：最宽松的策略，但仍防止脚本执行
          securityHeaders['Content-Security-Policy'] = "script-src 'none';";
          // 不设置X-Frame-Options，允许嵌入
        }

        if (req.secure || req.get('x-forwarded-proto') === 'https') {
          securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
        }

        res.set(securityHeaders);

        // 添加缓存控制头
        res.set('Cache-Control', 'public, max-age=3600'); // 缓存1小时

        // 确保不传递可能包含敏感信息的响应头
        res.removeHeader('Set-Cookie');
        res.removeHeader('Authorization');
        res.removeHeader('WWW-Authenticate');

        // 直接将流管道传输到响应
        response.data.pipe(res);

        // 处理错误
        response.data.on('error', (err) => {
          logger.error('Stream error:', err.message);
          if (!res.headersSent) {
            res.status(500).send('Error streaming the resource');
          }
        });
      } catch (error) {
        logger.error('Error fetching the resource:', { error, url });

        if (error.code === 'ECONNABORTED') {
          res.status(408).send('Request timeout');
        } else if (error.response && error.response.status) {
          res.status(error.response.status).send(`Remote server error: ${error.response.status}`);
        } else {
          res.status(400).send('Invalid parameter: error');
        }
      }
    });
  },
};
