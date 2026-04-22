import { test, expect, describe } from 'bun:test';
import { getObjByPath } from '../src/get-obj-by-path';

describe('getObjByPath', () => {
  const config = {
    mountPoint: '/ai-kit',
    meta: {
      name: 'ai-kit',
      title: 'AI Kit',
      description: 'The decentralized AI access solution for blocklets',
      keywords: ['ai', 'openai'],
      group: 'dapp',
      did: 'z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ',
      main: 'blocklet.js',
      author: {
        name: 'arcblock',
        email: 'blocklet@arcblock.io',
        url: 'https://github.com/blocklet',
      },
      repository: {
        type: 'git',
        url: 'git+https://github.com/blocklet/ai-kit.git',
      },
      specVersion: '1.2.8',
      version: '0.1.66',
      logo: 'screenshots/a9793769824431ba7220c198694a8baa.png',
      files: ['dist', 'screenshots', 'docs', 'api/dist/store/migrations/*.js', 'api/hooks/pre-start.js'],
      interfaces: [
        {
          type: 'web',
          name: 'publicUrl',
          path: '/',
          prefix: '*',
          port: 'BLOCKLET_PORT',
          protocol: 'http',
          services: [
            {
              name: 'auth',
              config: {
                ignoreUrls: ['/api/meilisearch/embeddings'],
              },
            },
          ],
        },
      ],
      community: 'https://community.arcblock.io',
      documentation: 'https://developer.blocklet.io',
      homepage: 'https://store.blocklet.dev',
      license: '',
      timeout: {
        start: 60,
      },
      requirements: {
        server: '>=1.16.0',
        os: '*',
        cpu: '*',
      },
      scripts: {
        preStart: 'node api/hooks/pre-start.js',
        dev: 'npm run start',
      },
      environments: [
        {
          name: 'OPENAI_API_KEY',
          description: 'Your OpenAI apiKey separate with commas.',
          required: false,
          default: '123123',
          secure: true,
          shared: false,
        },
        {
          name: 'OPENAI_BASE_URL',
          description: 'Override the default base URL for the API, e.g., "https://api.example.com/v2/".',
          required: false,
          default: '',
          secure: false,
          shared: false,
        },
        {
          name: 'VERBOSE',
          description: 'Logging input and output of AI',
          required: false,
          default: 'false',
          secure: false,
          shared: false,
        },
        {
          name: 'HTTPS_PROXY',
          description: 'Use the API behind a proxy',
          required: false,
          default: '',
          secure: false,
          shared: false,
        },
        {
          name: 'GEMINI_API_KEY',
          description: 'Your Gemini apiKey separate with commas.',
          required: false,
          default: '',
          secure: true,
          shared: false,
        },
        {
          name: 'OPEN_ROUTER_API_KEY',
          description: 'Your OpenRouter apiKey separate with commas.',
          required: false,
          default: '',
          secure: true,
          shared: false,
        },
      ],
      capabilities: {
        clusterMode: false,
        component: true,
        navigation: true,
      },
      screenshots: [
        'QmbUCPd93pE62SpDe1ohoaH9SycncVNZ1RoRx5M4nzVuWg.png',
        'QmdCUh6PHZQnQWpEtzriiBJ23TAyuGk2Uko7VPqKSuwTfW.png',
      ],
      components: [],
      navigation: [
        {
          id: 'playground',
          title: {
            en: 'Playground',
            zh: '沙盒',
          },
          icon: 'carbon:run',
          link: '/playground',
          section: ['sessionManager', 'dashboard'],
          role: ['admin', 'owner'],
        },
        {
          id: 'billing',
          title: {
            en: 'Billing',
            zh: '账单',
          },
          icon: 'uil:bill',
          link: '/billing',
          section: ['dashboard'],
          role: ['admin', 'owner'],
        },
      ],
      stats: {
        downloads: 17070,
        star: 0,
        purchases: 0,
      },
      owner: {
        did: 'z1aRwBLojgqGPeUhPZfAdzgBTjDRC5vPu6g',
        fullName: 'ArcBlock',
        email: 'store@arcblock.io',
        avatar: '/.well-known/service/user/avatar/7534731d00abc5b65f655513c958b3c0.png',
      },
      lastPublishedAt: '2024-12-05T03:41:15.420Z',
      payment: {
        price: [],
        share: [],
      },
      bundleDid: 'z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ',
      bundleName: 'ai-kit',
    },
    bundleSource: {
      name: 'ai-kit',
      version: 'latest',
      store: 'https://test.store.blocklet.dev',
    },
    dependencies: [],
    children: [],
    ports: {
      BLOCKLET_PORT: 5561,
    },
    mode: 'production',
    dependents: [
      {
        id: 'zNKkjgrwMPVob7Pvgn5t2DY5ECT4dHH6f8fm/z8iZpog7mcgcgBZzTiXJCWESvmnRrQmnd3XBB',
        required: true,
      },
      {
        id: 'zNKkjgrwMPVob7Pvgn5t2DY5ECT4dHH6f8fm/z2qaBP9SahqU2L2YA3ip7NecwKACMByTFuiJ2',
        required: true,
      },
    ],
    startedAt: '2025-01-07T20:18:36.419Z',
    stoppedAt: null,
    env: {
      id: 'zNKkjgrwMPVob7Pvgn5t2DY5ECT4dHH6f8fm/z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ',
      name: 'zNKkjgrwMPVob7Pvgn5t2DY5ECT4dHH6f8fm/ai-kit',
      processId: 'zNKkjgrwMPVob7Pvgn5t2DY5ECT4dHH6f8fm/ai-kit',
      dataDir: '/home/pillar/source/bs_dirs/bs_dir/data/zNKkjgrwMPVob7Pvgn5t2DY5ECT4dHH6f8fm/ai-kit',
      logsDir: '/home/pillar/source/bs_dirs/bs_dir/logs/zNKkjgrwMPVob7Pvgn5t2DY5ECT4dHH6f8fm/ai-kit',
      cacheDir: '/home/pillar/source/bs_dirs/bs_dir/cache/zNKkjgrwMPVob7Pvgn5t2DY5ECT4dHH6f8fm/ai-kit',
      appDir: '/home/pillar/source/bs_dirs/bs_dir/blocklets/ai-kit/0.1.66',
    },
    configs: [
      {
        key: 'OPENAI_API_KEY',
        value: '',
        required: false,
        description: 'Your OpenAI apiKey separate with commas.',
        secure: true,
        validation: '',
        custom: false,
        shared: false,
      },
      {
        key: 'OPENAI_BASE_URL',
        value: '',
        required: false,
        description: 'Override the default base URL for the API, e.g., "https://api.example.com/v2/".',
        secure: false,
        validation: '',
        custom: false,
        shared: false,
      },
      {
        key: 'VERBOSE',
        value: 'false',
        required: false,
        description: 'Logging input and output of AI',
        secure: false,
        validation: '',
        custom: false,
        shared: false,
      },
      {
        key: 'HTTPS_PROXY',
        value: '',
        required: false,
        description: 'Use the API behind a proxy',
        secure: false,
        validation: '',
        custom: false,
        shared: false,
      },
      {
        key: 'GEMINI_API_KEY',
        value: '',
        required: false,
        description: 'Your Gemini apiKey separate with commas.',
        secure: true,
        validation: '',
        custom: false,
        shared: false,
      },
      {
        key: 'OPEN_ROUTER_API_KEY',
        value: '',
        required: false,
        description: 'Your OpenRouter apiKey separate with commas.',
        secure: true,
        validation: '',
        custom: false,
        shared: false,
      },
      {
        key: 'prefs.MAX_RETRIES',
        value: 3,
        required: true,
        description: 'MAX RETRIES',
        secure: false,
        validation: '',
        custom: false,
      },
      {
        key: 'prefs.calcTokenUsage',
        value: true,
        required: false,
        description: 'Calc Token Usage',
        secure: false,
        validation: '',
        custom: false,
      },
      {
        key: 'prefs.subscriptionProductId',
        value: '',
        required: false,
        description: 'Product Id',
        secure: false,
        validation: '',
        custom: false,
      },
      {
        key: 'prefs.subscriptionPaymentLink',
        value: '',
        required: false,
        description: 'Payment Link',
        secure: false,
        validation: '',
        custom: false,
      },
      {
        key: 'prefs.basePricePerUnit',
        value: '',
        required: false,
        description: 'Base Price',
        secure: false,
        validation: '',
        custom: false,
      },
      {
        key: 'prefs.onlyEnableModelsInPricing',
        value: '',
        required: false,
        description: 'Only enable models in the list',
        secure: false,
        validation: '',
        custom: false,
      },
      {
        key: 'prefs.pricingList',
        value: '',
        required: false,
        description: 'pricingList',
        secure: false,
        validation: '',
        custom: false,
      },
      {
        key: 'A',
        value: '123123a',
        required: false,
        description: '',
        secure: false,
        validation: '',
        custom: true,
      },
    ],
    configObj: {
      OPENAI_API_KEY: '',
      OPENAI_BASE_URL: '',
      VERBOSE: 'false',
      HTTPS_PROXY: '',
      GEMINI_API_KEY: '',
      OPEN_ROUTER_API_KEY: '',
      'prefs.MAX_RETRIES': 3,
      'prefs.calcTokenUsage': true,
      'prefs.subscriptionProductId': '',
      'prefs.subscriptionPaymentLink': '',
      'prefs.basePricePerUnit': '',
      'prefs.onlyEnableModelsInPricing': '',
      'prefs.pricingList': '',
      A: '123123a',
    },
  };

  test('should retrieve root level property', () => {
    expect(getObjByPath(config, 'meta.name')).toBe('ai-kit');
  });

  test('should retrieve nested object property', () => {
    expect(getObjByPath(config, 'meta.navigation[0].title.en')).toBe('Playground');
    expect(getObjByPath(config, 'meta.navigation[0].title.zh')).toBe('沙盒');
  });

  test('should retrieve array element by condition', () => {
    expect(getObjByPath(config, 'meta.interfaces[type=web].name')).toBe('publicUrl');
    expect(getObjByPath(config, 'meta.interfaces[0].port')).toBe('BLOCKLET_PORT');
  });

  test('should lowercase key', () => {
    expect(getObjByPath(config, 'configobj.a')).toBe('123123a');
  });
});
