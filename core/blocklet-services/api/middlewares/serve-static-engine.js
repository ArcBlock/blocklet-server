const path = require('path');
const express = require('express');
const { LRUCache } = require('lru-cache');
const { getBlockletEngine } = require('@blocklet/meta/lib/engine');
const { findComponentByIdV2 } = require('@blocklet/meta/lib/util');
const { RESOURCE_PATTERN, STATIC_SERVER_ENGINE_DID } = require('@blocklet/constant');

const logger = require('../libs/logger')('serve-static-engine');

// LRU cache for static middleware instances (keyed by staticRoot)
// This is the only cache needed - express.static() creation has real cost
const staticMiddlewares = new LRUCache({
  max: 100,
  ttl: 60 * 60 * 1000, // 1 hour TTL
  dispose: (value, key) => {
    logger.debug('Evicting static middleware from cache', { staticRoot: key });
  },
});

/**
 * Get static root path for a component
 * Same logic as static-server: BLOCKLET_APP_DIR + meta.main
 * @param {object} component - Blocklet component
 * @returns {string|null} - Absolute path to static files root
 */
const getStaticRoot = (component) => {
  const appDir = component.environments?.find((e) => e.key === 'BLOCKLET_APP_DIR')?.value;
  if (!appDir) {
    return null;
  }
  return component.meta?.main ? path.join(appDir, component.meta.main) : path.resolve(appDir);
};

/**
 * Check if a component can be served directly by blocklet-service
 * Conditions:
 * 1. Engine-based blocklet using 'blocklet' interpreter
 * 2. Engine source is the built-in static-server (not a custom engine)
 *
 * @param {object} component - Blocklet component
 * @returns {boolean}
 */
const canServeStaticEngine = (component) => {
  if (component.meta?.group === 'static') {
    return true;
  }
  const engine = getBlockletEngine(component?.meta);
  return engine?.interpreter === 'blocklet' && engine.source?.name === STATIC_SERVER_ENGINE_DID;
};

/**
 * Middleware to serve static files directly for engine-based blocklets
 * This eliminates the need for a separate static-server process
 *
 * Matches static-server logic:
 * 1. express.static with { maxAge: '30d', index: false }
 * 2. SPA fallback to index.html for HTML requests (non-resource paths)
 */
const serveStaticEngine = () => {
  // eslint-disable-next-line consistent-return
  return async (req, res, next) => {
    try {
      const blocklet = await req.getBlocklet();
      if (!blocklet) {
        return next();
      }

      const componentId = req.getBlockletComponentId();
      const component = componentId ? findComponentByIdV2(blocklet, componentId) : blocklet;

      if (!component) {
        return next();
      }

      // Check if this component can be served directly
      if (!canServeStaticEngine(component)) {
        return next();
      }

      // Get static root from component environments (same logic as static-server)
      const staticRoot = getStaticRoot(component);
      if (!staticRoot) {
        return next();
      }

      // Get or create static middleware for this root
      // Match static-server: { maxAge: '30d', index: false }
      let staticMiddleware = staticMiddlewares.get(staticRoot);
      if (!staticMiddleware) {
        staticMiddleware = express.static(staticRoot, {
          maxAge: '30d',
          index: false, // Don't serve index.html for directory requests, let fallback handle it
        });
        staticMiddlewares.set(staticRoot, staticMiddleware);
        logger.info('Created static middleware for engine-based blocklet', {
          staticRoot,
          componentDid: component.meta?.did,
        });
      }

      // Try to serve the static file
      // eslint-disable-next-line consistent-return
      staticMiddleware(req, res, (err) => {
        if (err) {
          return next(err);
        }

        // File not found - apply SPA fallback logic (same as @blocklet/sdk/lib/middlewares/fallback)
        // Skip non-HTML requests and resource requests
        if (!(req.method === 'GET' || req.method === 'HEAD') || !req.accepts('html')) {
          return next();
        }

        // Skip resource requests (JS, CSS, images, fonts, etc.)
        // This matches the RESOURCE_PATTERN check in @blocklet/sdk fallback
        if (RESOURCE_PATTERN.test(req.path)) {
          // Return 404 for missing resources instead of falling back to index.html
          return res.status(404).send('Static Server: File Not Found');
        }

        // Serve index.html for SPA routing
        const indexPath = path.join(staticRoot, 'index.html');
        res.sendFile(
          indexPath,
          {
            headers: {
              // Match fallback middleware: no-cache for HTML
              'Surrogate-Control': 'no-store',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              Expires: '0',
            },
          },
          (sendErr) => {
            if (sendErr) {
              // If index.html not found, return 404 like static-server
              logger.warn('Failed to serve index.html for SPA fallback', {
                staticRoot,
                error: sendErr,
              });
              res.status(404).send('Static Server: File Not Found');
            }
          }
        );
      });
    } catch (err) {
      logger.error('Error in serve-static-engine middleware', { error: err });
      return next(err);
    }
  };
};

/**
 * Clear middleware cache for a specific static root path
 * @param {string} staticRoot - The static root path to clear
 */
const clearCache = (staticRoot) => {
  if (!staticRoot) return;
  staticMiddlewares.delete(staticRoot);
  logger.debug('Cleared static middleware cache', { staticRoot });
};

/**
 * Clear all middleware caches
 */
const clearAllCaches = () => {
  staticMiddlewares.clear();
  logger.info('Cleared all static middleware caches');
};

/**
 * Get cache size for monitoring
 * @returns {number} Number of cached middlewares
 */
const getCacheSize = () => staticMiddlewares.size;

module.exports = serveStaticEngine;
module.exports.clearCache = clearCache;
module.exports.clearAllCaches = clearAllCaches;
module.exports.getCacheSize = getCacheSize;
