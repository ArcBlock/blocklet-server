export default {
  appDid: 'zNKqRZMZpX49Ct2byuFJKX2H4siZARnfQLiy',
  dynamic: null,
  mountPoint: null,
  children: [
    {
      dynamic: true,
      mountPoint: '/minimalist-html-demo',
      children: [],
      meta: {
        main: 'blocklet.js',
        bundleDid: 'z8iZjejYpy7TeJbTq6oXLbVgXemAMbpqwM17Q',
        bundleName: 'minimalist-html-demo',
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        name: 'minimalist-html-demo',
        navigation: [
          {
            id: 'nav1',
            section: ['header'],
            title: 'nav1 title',
            link: '/nav1',
            description: 'nav1 description',
          },
          {
            id: 'nav2',
            section: ['header'],
            title: 'nav2 title',
            link: '/nav2',
            description: {
              en: 'nav2 description',
              zh: 'nav2 描述',
            },
          },
        ],
        title: 'Simple HTML Demo',
        version: '1.0.15',
        capabilities: {
          clusterMode: false,
          component: true,
        },
        components: [],
      },
    },
  ],
  meta: {
    main: 'blocklet.js',
    bundleDid: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
    bundleName: 'static-demo-blocklet',
    did: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
    name: 'static-demo-blocklet',
    title: 'Static Demo',
    version: '1.0.0',
    capabilities: {},
  },
  settings: {
    navigations: [
      {
        component: '',
        from: 'manual',
        id: 'id-for-manual',
        link: '/manual',
        section: 'header',
        title: 'Manual Menu',
        visible: true,
      },
    ],
  },
};
