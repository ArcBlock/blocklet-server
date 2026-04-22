import fs from 'fs';
import { join } from 'path';
import { joinURL } from 'ufo';
import escape from 'lodash/escape';
import crypto from 'crypto';
import { RESOURCE_PATTERN } from '@blocklet/constant';
import { buildThemeStyles, buildThemeScript } from '@blocklet/theme';
// eslint-disable-next-line import/no-extraneous-dependencies
import { NextFunction, Request, Response } from 'express';

import { env, getBlockletJs, getBlockletSettings } from '../config';
import { SERVICE_PREFIX } from '../util/constants';

type PageData = {
  title?: string;
  description?: string;
  ogImage?: string;
  embed?: string; // for blocklet-open-embed
};

type FallbackOptions = {
  root?: string | undefined;
  getPageData?: (req: Request) => PageData | Promise<PageData>;
  timeout?: number;
  maxLength?: number;
  cacheTtl?: number;
  injectBlockletJs?: boolean;
};

interface CachedResponse {
  html: string;
  timestamp: number;
  etag: string;
  pageGroup: string;
  pathPrefix: string;
}

// Cache configurations
const DEFAULT_CACHE_TTL = 1 * 60 * 1000; // 1 minute
const cache = new Map<string, CachedResponse>();
const cacheEnabled = process.env.FALLBACK_CACHE_ENABLED === 'true' || process.env.NODE_ENV === 'test';

// Pre-compile regex patterns for better performance
const TITLE_TAG_REGEX = /<title>(.+)<\/title>/;
const HEAD_END_TAG = '</head>';

const buildOpenGraph = (pageData: PageData, appUrl: string) => {
  const parts = [
    `<meta property="og:title" content="${pageData.title}" data-react-helmet="true" />`,
    `<meta property="og:description" content="${pageData.description}" data-react-helmet="true" />`,
    '<meta property="og:type" content="website" data-react-helmet="true" />',
    `<meta property="og:url" content="${appUrl}" data-react-helmet="true" />`,
    `<meta property="og:image" content="${pageData.ogImage}" data-react-helmet="true" />`,
    '<meta name="twitter:card" content="summary_large_image" data-react-helmet="true" />',
  ];
  return parts.join('\n');
};

const validatePageData = (data: PageData, maxLength: number) => {
  if (data.title && data.title.length > maxLength) {
    throw new Error('Title too long');
  }
  if (data.description && data.description.length > maxLength) {
    throw new Error('Description too long');
  }
};

const generateETag = (content: string): string => {
  const hash = crypto.createHash('sha1');
  hash.update(content);
  return `W/"${hash.digest('base64')}"`;
};

const getCacheKey = (pathname: string, filePath: string, pageGroup: string, pathPrefix: string): string => {
  const hash = crypto.createHash('sha1');
  hash.update(`${pathname}:${filePath}:${pageGroup}:${pathPrefix}`);
  return hash.digest('base64');
};

const tryWithTimeout = (asyncFn: Function, timeout: number) => {
  if (typeof asyncFn !== 'function') {
    throw new Error('Must provide a valid asyncFn function');
  }

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout} ms`));
    }, timeout);

    try {
      const result = await asyncFn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      clearTimeout(timer);
    }
  });
};

const fallback = (file: string, options: FallbackOptions = {}) => {
  const filePath = options.root ? join(options.root, file) : file;

  // Check file existence during initialization
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fallback file not found at: ${filePath}`);
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip non-HTML requests early
      if (!(req.method === 'GET' || req.method === 'HEAD') || !req.accepts('html') || RESOURCE_PATTERN.test(req.path)) {
        next();
        return;
      }

      const pageGroup = req.headers['x-page-group'] || '';
      const pathPrefix = req.headers['x-path-prefix'] || '';
      const cacheKey = getCacheKey(req.path, filePath, pageGroup as string, pathPrefix as string);

      const { theme } = getBlockletSettings();

      if (cacheEnabled) {
        // Check cache first
        const cached = cache.get(cacheKey);
        const cacheTtl = options.cacheTtl || DEFAULT_CACHE_TTL;
        if (cached && Date.now() - cached.timestamp < cacheTtl) {
          if (cached.pageGroup === pageGroup && cached.pathPrefix === pathPrefix) {
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('ETag', cached.etag);
            res.type('html');
            res.send(cached.html);
            if (process.env.NODE_ENV === 'test') {
              next(cached.html);
            }
            return;
          }
        }
      }

      // Get page data with timeout protection
      const pageData: PageData = await tryWithTimeout(
        options.getPageData ? () => options.getPageData(req) : () => Promise.resolve({}),
        options.timeout || 5000
      );

      validatePageData(pageData, options.maxLength || 1000);

      pageData.title = escape(pageData.title || env.appName);
      pageData.description = escape(pageData.description || env.appDescription);
      pageData.ogImage = pageData.ogImage || joinURL(env.appUrl || '/', SERVICE_PREFIX, '/blocklet/og.png');

      let source = await fs.promises.readFile(filePath, 'utf8');

      // Optimize string replacements
      if (pageData.title) {
        if (!source.includes('<title>')) {
          source = source.replace(HEAD_END_TAG, `<title>${pageData.title}</title>${HEAD_END_TAG}`);
        } else {
          source = source.replace(TITLE_TAG_REGEX, `<title>${pageData.title}</title>`);
        }
      }

      if (pageData.description && !source.includes('<meta name="description"')) {
        source = source.replace(
          HEAD_END_TAG,
          `<meta name="description" content="${pageData.description}" data-react-helmet="true" />${HEAD_END_TAG}`
        );
      }

      if (!source.includes('meta property="og:image"')) {
        source = source.replace(HEAD_END_TAG, `${buildOpenGraph(pageData, env.appUrl || '/')}\n${HEAD_END_TAG}`);
      }

      if (pageData.embed) {
        source = source.replace(
          HEAD_END_TAG,
          `<link rel="blocklet-open-embed" type="application/json" href="${pageData.embed}" />${HEAD_END_TAG}`
        );
      }

      const blockletJs = getBlockletJs(pageGroup as string, pathPrefix as string);
      if (blockletJs && options.injectBlockletJs !== false) {
        source = source
          .replace('<script src="__blocklet__.js"></script>', `<script>${blockletJs}</script>`)
          .replace('<script src="__meta__.js"></script>', `<script>${blockletJs}</script>`);
      }

      // Inject theme styles and script
      const themeStyles = buildThemeStyles(theme);
      const themeScript = buildThemeScript(theme);

      // Inject theme styles
      if (!source.includes('<style id="blocklet-theme">')) {
        source = source.replace(HEAD_END_TAG, `${themeStyles}${HEAD_END_TAG}`);
      }

      // Inject theme-switching script
      if (!source.includes('<script id="blocklet-theme-script">')) {
        source = source.replace(HEAD_END_TAG, `${themeScript}${HEAD_END_TAG}`);
      }

      // Cache the processed response
      const etag = generateETag(source);
      cache.set(cacheKey, {
        html: source,
        timestamp: Date.now(),
        etag,
        pageGroup: pageGroup as string,
        pathPrefix: pathPrefix as string,
      });

      // Set response headers
      if (options.cacheTtl) {
        res.setHeader('Cache-Control', `public, max-age=${options.cacheTtl}`);
      } else {
        res.setHeader('Surrogate-Control', 'no-store');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Expires', '0');
      }
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('ETag', etag);

      res.type('html');
      res.send(source);

      if (process.env.NODE_ENV === 'test') {
        next(source);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'test') {
        console.error('error', err);
      }
      next(err);
    }
  };
};

export { fallback };
