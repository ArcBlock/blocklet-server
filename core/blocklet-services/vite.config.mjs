// eslint-disable-next-line import/no-relative-packages
import '../../tools/crypto-polyfill.js';
import path from 'node:path';
import { createRequire } from 'node:module';
import react from '@vitejs/plugin-react';
import { loadEnv, defineConfig } from 'vite';
import { virtualized } from 'vite-plugin-react-virtualized';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import assetCdnHostPlugin from './tools/vite-plugin-asset-host.js';

const require = createRequire(import.meta.url);

const WELLKNOWN_SERVICE_PATH_PREFIX = '/.well-known/service';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量 - 指向项目根目录
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  const port = env.PORT;
  const enabledAlias = env.ENABLED_ALIAS === 'true';
  const arcblockUxBasePath = env.ARCBLOCK_UX_BASE_PATH;
  const arcblockDidSpacesBasePath = env.ARCBLOCK_DID_SPACES_BASE_PATH;
  const enableCodeInspector = env.ENABLE_CODE_INSPECTOR === 'true';

  let base = WELLKNOWN_SERVICE_PATH_PREFIX;
  if (isProduction) {
    base += '/static';
  }
  const exclude = [];
  const alias = {};
  if (isProduction) {
    alias.lodash = 'lodash-es';
    // mui-datatable
    alias['lodash.assign'] = 'lodash/assign';
    alias['lodash.clonedeep'] = 'lodash/cloneDeep';
    alias['lodash.isequal'] = 'lodash/isEqual';
    alias['lodash.merge'] = 'lodash/merge';
    alias['lodash.find'] = 'lodash/find';
  }
  if (isDevelopment) {
    alias['@abtnode/ux/lib'] = path.resolve(process.cwd(), '../ux/src');
  }
  if (enabledAlias) {
    const excludeLibs = [
      // 排除 ux repo 中其他的包
      '@arcblock/bridge',
      '@arcblock/icons',
      '@arcblock/react-hooks',
      '@arcblock/nft-display',
      // 排除 ux repo 中 使用到 server repo 的包
      '@blocklet/meta',
      '@blocklet/js-sdk',
      // 排除带有公共 context 的包
      'react',
      'react-router-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/icons-material',
      '@mui/material',
      'notistack',
      'color-convert',
    ];
    if (arcblockUxBasePath) {
      alias['@arcblock/ux/lib'] = `${arcblockUxBasePath}/packages/ux/src`;
      alias['@arcblock/did-connect-react/lib'] = `${arcblockUxBasePath}/packages/did-connect/src`;
      alias['@blocklet/ui-react/lib'] = `${arcblockUxBasePath}/packages/blocklet-ui-react/src`;
      alias['@blocklet/ui-react'] = `${arcblockUxBasePath}/packages/blocklet-ui-react/src/index.ts`;
      alias['@blocklet/launcher-layout/lib'] = `${arcblockUxBasePath}/packages/blocklet-launcher-layout/src`;
      alias['@blocklet/launcher-layout'] = `${arcblockUxBasePath}/packages/blocklet-launcher-layout/src/index.jsx`;

      excludeLibs.forEach((x) => {
        alias[x] = path.join(process.cwd(), `../../node_modules/${x}`);
      });

      if (!arcblockDidSpacesBasePath) {
        exclude.push('@blocklet/did-space-react');
      }
    }
    if (arcblockDidSpacesBasePath) {
      alias['@blocklet/did-space-react'] = `${arcblockDidSpacesBasePath}/packages/react/src/index.ts`;
    }
  }

  return {
    base,
    resolve: {
      alias,
      dedupe: [
        '@blocklet/constant',
        '@blocklet/ui-react',
        '@arcblock/ux',
        '@arcblock/ws',
        '@arcblock/did-connect-react',
        '@mui/material',
        // '@mui/utils',
        '@mui/icons-material',
        'react',
        'react-dom',
        'lodash',
        'bn.js',
      ],
    },
    server: {
      strictPort: true,
      port,
      hmr: { host: 'localhost', protocol: 'ws', clientPort: port },
      allowedHosts: true,
      fs: { strict: false },
    },
    plugins: [
      enableCodeInspector &&
        codeInspectorPlugin({
          bundler: 'vite',
        }),
      react(),
      svgr(),
      VitePWA({
        // manifest: false,
        // 暂时不接管 blocklet-service 中的 sw
        // injectRegister: false,
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'service-worker.js',
        injectManifest: { maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 },
        scope: `${WELLKNOWN_SERVICE_PATH_PREFIX}/`,
        selfDestroying: true, // 注销 service worker
      }),
      virtualized(),
      nodePolyfills({ protocolImports: true }),
      viteStaticCopy({
        targets: [
          {
            src: `${path.dirname(require.resolve('@abtnode/router-templates/package.json'))}/lib/styles/*`,
            dest: 'router-template-styles',
          },
        ],
      }),
      assetCdnHostPlugin(),
    ].filter(Boolean),
    optimizeDeps: {
      // force: true,
      include: [
        // '@abtnode/ux/lib/util',
        '@abtnode/constant',
        '@blocklet/constant',
        //
        '@abtnode/util/lib/serverless',
        '@abtnode/util/lib/dayjs',
        '@abtnode/util/lib/normalize-path-prefix',
        '@abtnode/util/lib/url-evaluation',
        '@abtnode/util/lib/url-evaluation/check-accessible-browser',
        '@abtnode/util/lib/format-error',
        '@abtnode/util/lib/format-name',
        '@abtnode/util/lib/get-domain-for-blocklet',
        '@abtnode/util/lib/nft',
        '@abtnode/util/lib/axios',
        '@abtnode/util/lib/base32',
        '@abtnode/util/lib/passport',
        '@abtnode/util/lib/is-path-prefix-equal',
        '@abtnode/util/lib/try-with-timeout',
        '@abtnode/util/lib/did-domain',
        '@abtnode/util/lib/domain',
        '@abtnode/util/lib/notification-preview/chain',
        '@abtnode/util/lib/notification-preview/config',
        '@abtnode/util/lib/notification-preview/constant',
        '@abtnode/util/lib/notification-preview/explorer-url',
        '@abtnode/util/lib/notification-preview/func',
        '@abtnode/util/lib/notification-preview/highlight',
        '@abtnode/util/lib/notification-preview/style',
        '@abtnode/util/lib/notification-preview/util',
        '@abtnode/util/lib/sanitize',
        '@abtnode/util/lib/security',
        '@abtnode/util/lib/url-evaluation/index',
        //
        '@blocklet/server-js',
        '@blocklet/meta/lib/url-path-friendly',
        '@blocklet/meta/lib/util',
        '@blocklet/meta/lib/did-utils',
        '@blocklet/meta/lib/engine',
        '@blocklet/meta/lib/info',
        '@blocklet/meta/lib/security',
        '@blocklet/meta/lib/fix',
        '@blocklet/meta/lib/parse-navigation-from-blocklet',
        //
        '@blocklet/images/lib/video',
        //
        '@abtnode/auth/lib/util/create-passport-svg',
        // others
        'ua-parser-js',
      ],
      exclude,
    },
    build: {
      modulePreload: false,
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [
          /node_modules/,
          /core\/client/,
          /core\/constant/,
          /blocklet\/constant/,
          /core\/util\/lib/,
          /blocklet\/meta/,
          /blocklet\/images/,
          /core\/auth/,
        ],
      },
      rollupOptions: {
        external: [],
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-mui-core': ['@mui/material', '@mui/lab', '@mui/system', '@mui/icons-material'],
            'vendor-mui-x': ['@mui/x-date-pickers', '@mui/x-tree-view'],
            'vendor-utils': ['dayjs', 'numbro', 'bn.js', 'ufo', 'lodash', 'debug', 'axios'],
            'lottie-web': ['lottie-web'],
            'vendor-hooks': ['ahooks', 'use-bus', 'react-use'],
            'vendor-ux': ['@arcblock/ux'],
            'vendor-arcblock': ['@arcblock/nft-display', '@blocklet/launcher-layout'],
          },
        },
      },
    },
  };
});
