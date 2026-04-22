// eslint-disable-next-line import/no-relative-packages
import '../../tools/crypto-polyfill.js';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { loadEnv, defineConfig } from 'vite';
import { virtualized } from 'vite-plugin-react-virtualized';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { joinURL } from 'ufo';
import { codeInspectorPlugin } from 'code-inspector-plugin';

import { WELLKNOWN_SERVICE_PATH_PREFIX, WELLKNOWN_ANALYTICS_PREFIX, USER_AVATAR_PATH_PREFIX } from '@abtnode/constant';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';
  const port = env.PORT || 3000;
  const apiPort = env.APP_PORT || 3030;
  const enableCodeInspector = env.ENABLE_CODE_INSPECTOR === 'true';
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
  const exclude = [
    //
    // '@abtnode/ux/lib',
  ];

  if (['true', '1'].includes(env.ENABLED_ALIAS)) {
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
    ];

    if (env.ARCBLOCK_STORE_BASE_PATH) {
      const normalizedPath = path.resolve(env.ARCBLOCK_STORE_BASE_PATH);
      alias['@blocklet/list'] = path.join(normalizedPath, 'packages/list/lib/index.es.js');
    }
    if (env.ARCBLOCK_UX_BASE_PATH) {
      alias['@arcblock/ux/lib'] = `${env.ARCBLOCK_UX_BASE_PATH}/packages/ux/src`;
      alias['@arcblock/did-connect-react/lib'] = `${env.ARCBLOCK_UX_BASE_PATH}/packages/did-connect/src`;
      alias['@blocklet/ui-react/lib'] = `${env.ARCBLOCK_UX_BASE_PATH}/packages/blocklet-ui-react/src`;
      alias['@blocklet/ui-react'] = `${env.ARCBLOCK_UX_BASE_PATH}/packages/blocklet-ui-react/src/index.ts`;
      alias['@blocklet/launcher-layout/lib'] = `${env.ARCBLOCK_UX_BASE_PATH}/packages/blocklet-launcher-layout/src`;
      alias['@blocklet/launcher-layout'] =
        `${env.ARCBLOCK_UX_BASE_PATH}/packages/blocklet-launcher-layout/src/index.jsx`;

      excludeLibs.forEach(x => {
        alias[x] = path.join(process.cwd(), `../../node_modules/${x}`);
      });
      alias.zod = path.join(process.cwd(), '../../node_modules/zod/dist/v3/index.mjs');
      exclude.push('@blocklet/ui-react');
      exclude.push('@mui/lab');
      if (!env.ARCBLOCK_DID_SPACES_BASE_PATH) {
        exclude.push('@blocklet/did-space-react');
      }
    }
    if (env.ARCBLOCK_DID_SPACES_BASE_PATH) {
      alias['@blocklet/did-space-react'] = `${env.ARCBLOCK_DID_SPACES_BASE_PATH}/packages/react/src/index.ts`;
    }
    if (env.BLOCKCHAIN_BASE_PATH) {
      // 原则是尽量指向源码，这样可以不用关心编译的事情
      const chainMapList = [
        // FIXME: 指向 src/index.ts 时，会报一个导出的错误，暂时先指向 esm 的版本
        { source: '@arcblock/did', target: `${env.BLOCKCHAIN_BASE_PATH}/did/did/esm/index.js` },
        { source: '@arcblock/did-connect-js', target: `${env.BLOCKCHAIN_BASE_PATH}/did/did-connect` },
        { source: '@arcblock/jwt', target: `${env.BLOCKCHAIN_BASE_PATH}/did/jwt/src/index.ts` },
        // { source: '@arcblock/vc', target: `${env.BLOCKCHAIN_BASE_PATH}/asset/vc` },
        // { source: '@arcblock/ws', target: `${env.BLOCKCHAIN_BASE_PATH}/core/ws` },

        { source: '@ocap/wallet', target: `${env.BLOCKCHAIN_BASE_PATH}/core/wallet/src/index.ts` },
        { source: '@ocap/mcrypto', target: `${env.BLOCKCHAIN_BASE_PATH}/core/mcrypto/src/index.ts` },
        { source: '@ocap/util', target: `${env.BLOCKCHAIN_BASE_PATH}/core/util` },
        // { source: '@ocap/asset', target: `${env.BLOCKCHAIN_BASE_PATH}/core/asset/src/index.ts` },
        // { source: '@ocap/client', target: `${env.BLOCKCHAIN_BASE_PATH}/core/client` },
        // { source: '@ocap/message', target: `${env.BLOCKCHAIN_BASE_PATH}/core/message` },
        // { source: '@ocap/proto', target: `${env.BLOCKCHAIN_BASE_PATH}/core/proto` },
      ];

      chainMapList.forEach(x => {
        alias[x.source] = x.target;
      });
    }
  }

  return {
    base: './',
    resolve: {
      alias,
      dedupe: [
        '@blocklet/constant',
        '@blocklet/ui-react',
        '@arcblock/ux',
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
      force: true,
      strictPort: true,
      fs: { strict: false },
      allowedHosts: true,
      port,
      host: '0.0.0.0',
      proxy: {
        '/api': `http://127.0.0.1:${apiPort}`,
        '/hosted': `http://127.0.0.1:${apiPort}`,
        '/blocklet/logo': `http://127.0.0.1:${apiPort}`,
        '/blocklet/component': `http://127.0.0.1:${apiPort}`,
        '/blocklet/splash': `http://127.0.0.1:${apiPort}`,
        '/open/download/certificates': `http://127.0.0.1:${apiPort}`,
        '/__coverage__': `http://127.0.0.1:${apiPort}`,
        [USER_AVATAR_PATH_PREFIX]: `http://127.0.0.1:${apiPort}`,
        [joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/api')]: `http://127.0.0.1:${apiPort}`,
        //
        '/websocket': { target: `http://127.0.0.1:${apiPort}`, ws: true },
        [WELLKNOWN_ANALYTICS_PREFIX]: { target: `http://127.0.0.1:${apiPort}`, ws: true },
        [joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/relay/websocket')]: {
          target: `http://127.0.0.1:${apiPort}`,
          ws: true,
        },
      },
    },
    plugins: [
      enableCodeInspector &&
        codeInspectorPlugin({
          bundler: 'vite',
        }),
      react(),
      svgr(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'service-worker.js',
        injectManifest: { maximumFileSizeToCacheInBytes: 5194304 },
        selfDestroying: true, // 注销 service worker
      }),
      virtualized(),
      nodePolyfills({ protocolImports: true }),
    ],
    optimizeDeps: {
      // force: true,
      include: [
        '@blocklet/server-js',
        '@abtnode/constant',
        '@blocklet/constant',
        '@arcblock/graphql-playground',
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

        //
        '@blocklet/meta/lib/util',
        '@blocklet/meta/lib/schema',
        '@blocklet/meta/lib/did-utils',
        '@blocklet/meta/lib/url-path-friendly',
        '@blocklet/meta/lib/engine',
        '@blocklet/meta/lib/info',
        '@blocklet/meta/lib/security',
        '@blocklet/meta/lib/fix',
        '@blocklet/meta/lib/parse-navigation-from-blocklet',
        //
        '@abtnode/auth/lib/util/create-passport-svg',
        '@abtnode/auth/lib/util/get-auth-method',

        // others
        'ua-parser-js',
      ],
      exclude,
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [
          /node_modules/,
          /core\/client/,
          /core\/constant/,
          /blocklet\/constant/,
          /core\/util\/lib/,
          /blocklet\/meta/,
          /core\/auth/,
        ],
      },
      // rollupOptions: {
      //   external: [],
      //   output: {
      //     manualChunks: {
      //       'vendor-react': ['react', 'react-dom', 'react-router-dom'],
      //       'vendor-mui-core': ['@mui/material', '@mui/lab', '@mui/system', '@mui/icons-material'],
      //       'vendor-mui-x': ['@mui/x-date-pickers', '@mui/x-tree-view'],
      //       'vendor-utils': ['dayjs', 'numbro', 'bn.js', 'ufo', 'lodash', 'debug', 'axios'],
      //       'vendor-hooks': ['ahooks', 'use-bus', 'react-use'],
      //       'vendor-arcblock': [
      //         '@arcblock/ux',
      //         '@arcblock/did-connect-react',
      //         '@arcblock/nft-display',
      //         '@blocklet/ui-react',
      //         '@blocklet/launcher-layout',
      //       ],
      //       'vendor-ocap': [
      //         '@ocap/mcrypto',
      //         '@ocap/wallet',
      //         '@ocap/util',
      //         '@arcblock/did',
      //         '@arcblock/ws',
      //         '@ocap/client',
      //         '@ocap/message',
      //         '@ocap/proto',
      //         '@blocklet/server-js',
      //       ],
      //     },
      //   },
      // },
    },
  };
});
