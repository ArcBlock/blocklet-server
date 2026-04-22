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
        bundleDid: 'z8iZjejYpy7TeJbTq6oXLbVgXemAMbpqwM17Q',
        bundleName: 'minimalist-html-demo',
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        name: 'minimalist-html-demo',
        navigation: null,
        title: 'Simple HTML Demo',
        version: '1.0.15',
        main: 'blocklet.js',
        capabilities: {
          clusterMode: false,
          component: true,
        },
        components: [],
      },
    },
    // resource blocklet that has no start engine should not in navigation
    {
      dynamic: true,
      mountPoint: '/test-xxx',
      children: [],
      meta: {
        bundleDid: 'z2qa8aWozGuBKkA4HmWrizoXteP9ZGaZrK5Xw',
        bundleName: 'z2qa8aWozGuBKkA4HmWrizoXteP9ZGaZrK5Xw',
        did: 'z2qa8aWozGuBKkA4HmWrizoXteP9ZGaZrK5Xw',
        name: 'z2qa8aWozGuBKkA4HmWrizoXteP9ZGaZrK5Xw',
        navigation: null,
        title: 'Resource Blocklet',
        version: '1.0.0',
        capabilities: {
          clusterMode: false,
          component: true,
        },
        components: [],
      },
    },
  ],
  meta: {
    bundleDid: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
    bundleName: 'static-demo-blocklet',
    did: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
    name: 'static-demo-blocklet',
    title: 'Static Demo',
    version: '1.0.0',
    capabilities: {},
    main: 'blocklet.js',
  },
  settings: {
    navigations: [],
  },
};
