export default {
  appDid: 'zNKqRZMZpX49Ct2byuFJKX2H4siZARnfQLiy',
  meta: {
    name: 'demo-blocklet',
    did: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ',
    title: 'demo-blocklet',
    version: '1.0.0',
    capabilities: {
      navigation: true,
    },
  },
  children: [
    {
      mountPoint: '/',
      meta: {
        name: 'demo-blocklet-child-1',
        title: 'demo-blocklet-child-1',
        did: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ',
        main: 'api/index.js',
        capabilities: {
          clusterMode: false,
          navigation: true,
          component: true,
          serverless: true,
        },
        navigation: [
          {
            id: 'admin',
            title: 'Admin',
            icon: 'eos-icons:admin-outlined',
            section: ['dashboard'],
            role: ['owner', 'admin'],
            items: [
              {
                id: 'admin__blocklets',
                title: 'Blocklets',
                icon: 'icon-park-outline:all-application',
                link: '/console/blocklets',
              },
              {
                id: 'admin__categories',
                title: 'Categories',
                icon: 'mdi:tag-outline',
                link: '/console/categories',
                role: ['developer'],
              },
            ],
          },
        ],
        components: [],
      },
    },
  ],
};
