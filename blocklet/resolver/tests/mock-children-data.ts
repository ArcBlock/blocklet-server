export const mockOptionalChildrenBlocklet = {
  meta: { did: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o' },
  children: [
    {
      meta: {
        name: 'pages-kit',
        title: 'Pages Kit',
        description: 'A blocklet for building websites easily and quickly.',
        group: 'dapp',
        did: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o',
        version: '0.2.207',
        logo: 'logo.png',
        community: 'https://community.arcblock.io',
        documentation: 'https://developer.blocklet.io',
        homepage: 'https://store.blocklet.dev',
        components: [
          {
            name: 'image-bin',
            required: true,
            mountPoint: '/image-bin',
            source: {
              name: 'image-bin',
              version: 'latest',
              store: 'https://store.blocklet.dev',
            },
          },
        ],
        bundleDid: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o',
        bundleName: 'pages-kit',
      },
      mountPoint: '/',
      bundleSource: {
        url: 'https://store.blocklet.dev/api/blocklets/z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o/blocklet.json',
      },
      dependencies: [
        {
          did: 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
          required: true,
          version: 'latest',
        },
      ],
    },
    {
      mountPoint: '/image-bin',
      meta: {
        name: 'image-bin',
        version: '0.10.70',
        title: 'Media Kit',
        description: 'A simple media assets upload and hosting blocklet',
        did: 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
        logo: 'logo.png',
        community: 'https://community.arcblock.io',
        documentation: 'https://developer.blocklet.io',
        homepage: 'https://store.blocklet.dev',
        lastPublishedAt: '2024-01-15T07:18:18.818Z',
        bundleDid: 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
        bundleName: 'image-bin',
      },
      bundleSource: {
        name: 'image-bin',
        version: 'latest',
        store: 'https://store.blocklet.dev',
      },
      installedAt: '2024-01-20T19:12:55.107Z',
      dependents: [
        {
          id: 'zNKrvtrq2tAf8XhKuX4ZV8EH9R1u4VMytvdT/z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o',
          required: true,
        },
      ],
    },
    {
      meta: {
        name: 'ai-assistant',
        title: 'AI Assistant',
        description: 'AI-powered tools to help you and your team increase productivity by 10x',
        did: 'z8iZvMrKPa7qy2nxfrKremuSm8bE9Wb9Tu2NA',
        community: 'https://community.arcblock.io',
        documentation: 'https://developer.blocklet.io',
        homepage: 'https://store.blocklet.dev',
        bundleDid: 'z8iZvMrKPa7qy2nxfrKremuSm8bE9Wb9Tu2NA',
        bundleName: 'ai-assistant',
        components: [
          {
            name: 'ai-kit',
            mountPoint: '/ai-kit',
            source: {
              name: 'ai-kit',
              version: 'latest',
              store: 'https://store.blocklet.dev',
            },
          },
          {
            name: 'ai-studio',
            mountPoint: '/ai-studio',
            source: {
              name: 'ai-studio',
              version: 'latest',
              store: 'https://store.blocklet.dev',
            },
          },
        ],
      },
      bundleSource: {
        store: 'https://store.blocklet.dev',
        name: 'ai-assistant',
        version: 'latest',
      },
      mountPoint: '/ai-assistant',
      dependencies: [
        {
          did: 'z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ',
          required: false,
          version: 'latest',
        },
        {
          did: 'z8iZpog7mcgcgBZzTiXJCWESvmnRrQmnd3XBB',
          required: false,
          version: 'latest',
        },
      ],
    },
  ],
};

export const mockNoOptionalChildren = [
  {
    meta: {
      name: 'pages-kit',
      title: 'Pages Kit',
      description: 'A blocklet for building websites easily and quickly.',
      group: 'dapp',
      did: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o',
      version: '0.2.207',
      logo: 'logo.png',
      community: 'https://community.arcblock.io',
      documentation: 'https://developer.blocklet.io',
      homepage: 'https://store.blocklet.dev',
      components: [
        {
          name: 'image-bin',
          required: true,
          mountPoint: '/image-bin',
          source: {
            name: 'image-bin',
            version: 'latest',
            store: 'https://store.blocklet.dev',
          },
        },
      ],
      bundleDid: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o',
      bundleName: 'pages-kit',
    },
    mountPoint: '/',
    bundleSource: {
      url: 'https://store.blocklet.dev/api/blocklets/z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o/blocklet.json',
    },
    dependencies: [
      {
        did: 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
        required: true,
        version: 'latest',
      },
    ],
  },
  {
    mountPoint: '/image-bin',
    meta: {
      name: 'image-bin',
      version: '0.10.70',
      title: 'Media Kit',
      description: 'A simple media assets upload and hosting blocklet',
      did: 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
      logo: 'logo.png',
      community: 'https://community.arcblock.io',
      documentation: 'https://developer.blocklet.io',
      homepage: 'https://store.blocklet.dev',
      lastPublishedAt: '2024-01-15T07:18:18.818Z',
      bundleDid: 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
      bundleName: 'image-bin',
    },
    bundleSource: {
      name: 'image-bin',
      version: 'latest',
      store: 'https://store.blocklet.dev',
    },
    installedAt: '2024-01-20T19:12:55.107Z',
    dependents: [
      {
        id: 'zNKrvtrq2tAf8XhKuX4ZV8EH9R1u4VMytvdT/z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o',
        required: true,
      },
    ],
  },
];
