import { test, expect } from 'bun:test';
import { parseNavigation } from '../src/parse-navigation';

test('should work as expected', () => {
  // empty
  expect(parseNavigation()).toEqual([]);
  // not empty
  expect(parseNavigation([{ title: 'a', link: '/a' }])).toEqual([{ title: 'a', link: '/a/' }]);
  // prefix
  expect(parseNavigation([{ title: 'a', link: '/a' }], {}, '/prefix')).toEqual([{ title: 'a', link: '/prefix/a/' }]);
  // link
  expect(parseNavigation([{ title: 'a', link: 'http://a.com' }], {}, '/prefix')).toEqual([
    { title: 'a', link: 'http://a.com' },
  ]);
  expect(parseNavigation([{ title: 'a', link: '/' }], {}, '/prefix')).toEqual([{ title: 'a', link: '/prefix/' }]);
  expect(parseNavigation([{ title: 'a' }], {}, '/prefix')).toEqual([]);
  expect(parseNavigation([{ title: 'a', items: [] }], {}, '/prefix')).toEqual([]);
  expect(
    parseNavigation([
      { title: 'a', link: '/a' },
      { title: 'group', items: [{ title: 'b', link: '/b' }] },
    ])
  ).toEqual([
    { title: 'a', link: '/a/' },
    { title: 'group', link: '', items: [{ title: 'b', link: '/b/' }] },
  ]);
  // child
  // cannot find child
  expect(parseNavigation([{ title: 'a', child: 'child1' }])).toEqual([]);
  expect(parseNavigation([{ title: 'a', child: 'child1' }], { children: [] })).toEqual([]);
  // find child by name
  expect(parseNavigation([{ title: 'a', child: 'child1' }], { children: [{ meta: { name: 'child1' } }] })).toEqual([
    { title: 'a', link: '/' },
  ]);
  // find child by did
  expect(parseNavigation([{ title: 'a', child: 'child1' }], { children: [{ meta: { did: 'child1' } }] })).toEqual([
    { title: 'a', link: '/' },
  ]);
  // nav title by child name
  expect(parseNavigation([{ child: 'child1' }], { children: [{ meta: { name: 'child1' } }] })).toEqual([
    { title: 'child1', link: '/' },
  ]);
  // nav title by child title
  expect(parseNavigation([{ child: 'child1' }], { children: [{ meta: { name: 'child1', title: 'Child1' } }] })).toEqual(
    [{ title: 'Child1', link: '/' }]
  );
  // child mountPoint
  expect(
    parseNavigation([{ title: 'a', child: 'child1' }], {
      children: [{ meta: { name: 'child1' }, mountPoint: '/child1' }],
    })
  ).toEqual([{ title: 'a', link: '/child1/' }]);
  // prefix and child mountPoint
  expect(
    parseNavigation(
      [{ title: 'a', child: 'child1' }],
      {
        children: [{ meta: { name: 'child1' }, mountPoint: '/child1' }],
      },
      '/prefix'
    )
  ).toEqual([{ title: 'a', link: '/prefix/child1/' }]);
  // child custom navigation
  expect(
    parseNavigation([{ title: 'a', child: 'child1' }], {
      children: [
        { meta: { name: 'child1', navigation: [{ title: 'customTitle', link: '/custom' }] }, mountPoint: '/child1' },
      ],
    })
  ).toEqual([{ title: 'a', link: '/child1/custom/' }]);
  // child custom navigation, custom title
  expect(
    parseNavigation([{ child: 'child1' }], {
      children: [
        { meta: { name: 'child1', navigation: [{ title: 'customTitle', link: '/custom' }] }, mountPoint: '/child1' },
      ],
    })
  ).toEqual([{ title: 'customTitle', link: '/child1/custom/' }]);
  // child custom navigation, empty title
  expect(
    parseNavigation([{ child: 'child1' }], {
      children: [{ meta: { name: 'child1', navigation: [{ link: '/custom' }] }, mountPoint: '/child1' }],
    })
  ).toEqual([{ title: 'child1', link: '/child1/custom/' }]);
  // child multiple custom navigation
  expect(
    parseNavigation([{ title: 'a', child: 'child1' }], {
      children: [
        {
          meta: {
            name: 'child1',
            navigation: [
              { title: 'child-menu-1', link: '/custom1' },
              { title: 'child-menu-2', link: '/custom2' },
            ],
          },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([
    {
      title: 'a',
      items: [
        { title: 'child-menu-1', link: '/child1/custom1/' },
        { title: 'child-menu-2', link: '/child1/custom2/' },
      ],
    },
  ]);
  // child multiple custom navigation in secondary menu
  expect(
    parseNavigation([{ title: 'a', link: '/a', items: [{ title: 'b', link: '/b' }, { child: 'child1' }] }], {
      children: [
        {
          meta: {
            name: 'child1',
            navigation: [
              { title: 'child-menu-1', link: '/custom1' },
              { title: 'child-menu-2', link: '/custom2' },
            ],
          },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([
    {
      title: 'a',
      link: '/a/',
      items: [
        { title: 'b', link: '/b/' },
        { title: 'child-menu-1', link: '/child1/custom1/' },
        { title: 'child-menu-2', link: '/child1/custom2/' },
      ],
    },
  ]);
  // deep children navigation in secondary menu
  expect(
    parseNavigation([{ title: 'a', items: [{ child: 'child1' }] }], {
      children: [
        {
          meta: {
            name: 'child1',
            navigation: [
              { title: 'child-menu-1', link: '/custom1' },
              { title: 'child-menu-2', child: 'child1-1' },
            ],
          },
          mountPoint: '/child1',
          children: [
            {
              meta: {
                name: 'child1-1',
                navigation: [
                  { title: 'p1', link: '/p1' },
                  { title: 'p2', link: '/p2' },
                ],
              },
              mountPoint: '/child1-1',
            },
          ],
        },
      ],
    })
  ).toEqual([
    {
      title: 'a',
      link: '',
      items: [
        { title: 'child-menu-1', link: '/child1/custom1/' },
        { title: 'p1', link: '/child1/child1-1/p1/' },
        { title: 'p2', link: '/child1/child1-1/p2/' },
      ],
    },
  ]);
  // deep link navigation in secondary menu
  expect(
    parseNavigation([
      {
        title: 'a',
        items: [
          { title: 'b', link: '/b' },
          {
            title: 'c',
            items: [
              { title: 'c1', link: '/c1' },
              { title: 'd', items: [{ title: 'd1', link: '/d1' }] },
            ],
          },
        ],
      },
    ])
  ).toEqual([
    {
      title: 'a',
      link: '',
      items: [
        { title: 'b', link: '/b/' },
        { title: 'c1', link: '/c1/' },
        { title: 'd1', link: '/d1/' },
      ],
    },
  ]);
  // i18n title
  expect(parseNavigation([{ title: { zh: '你好', en: 'Hello' }, link: '/' }])).toEqual([
    { title: { zh: '你好', en: 'Hello' }, link: '/' },
  ]);
  // i18n link
  expect(parseNavigation([{ title: 'a', link: { zh: '/zh', en: '/en' } }])).toEqual([
    { title: 'a', link: { zh: '/zh/', en: '/en/' } },
  ]);
  expect(parseNavigation([{ title: 'a', items: [{ title: 'b', link: { zh: '/zh', en: '/en' } }] }])).toEqual([
    { title: 'a', link: '', items: [{ title: 'b', link: { zh: '/zh/', en: '/en/' } }] },
  ]);
  expect(
    parseNavigation([{ title: 'a', child: 'child1' }], {
      children: [
        {
          meta: {
            name: 'child1',
            navigation: [{ title: 'customTitle', link: { en: '/custom-en', zh: '/custom-zh' } }],
          },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([{ title: 'a', link: { en: '/child1/custom-en/', zh: '/child1/custom-zh/' } }]);
  // section
  expect(parseNavigation([{ title: 'a', section: ['a', 'b'], link: '/' }])).toEqual([
    { title: 'a', link: '/', section: ['a', 'b'] },
  ] as any);
  expect(
    parseNavigation([{ title: 'a', child: 'child1', section: ['a', 'b'] }], {
      children: [{ meta: { name: 'child1' } }],
    })
  ).toEqual([{ title: 'a', link: '/', section: ['a', 'b'] }] as any);
  // icon
  expect(parseNavigation([{ title: 'a', icon: 'abc', link: '/' }])).toEqual([{ title: 'a', link: '/', icon: 'abc' }]);
  expect(
    parseNavigation([{ title: 'a', child: 'child1', icon: 'abc' }], {
      children: [{ meta: { name: 'child1' } }],
    })
  ).toEqual([{ title: 'a', link: '/', icon: 'abc' }]);
  // role
  expect(
    parseNavigation([
      { title: 'a', link: '/', role: ['admin'] },
      { title: 'group', items: [{ title: 'b', link: '/b/', role: ['admin'] }] },
    ])
  ).toEqual([
    { title: 'a', link: '/', role: ['admin'] },
    { title: 'group', link: '', items: [{ title: 'b', link: '/b/', role: ['admin'] }] },
  ]);
  expect(
    parseNavigation([{ title: 'a', child: 'child1', role: ['admin'] }], {
      children: [{ mountPoint: '/a', meta: { name: 'child1' } }],
    })
  ).toEqual([{ title: 'a', link: '/a/', role: ['admin'] }]);
  expect(
    parseNavigation([{ title: 'a', child: 'child1' }], {
      children: [
        {
          meta: {
            name: 'child1',
            navigation: [
              { title: 'child-menu-1', link: '/custom1', role: ['admin'] },
              { title: 'child-menu-2', link: '/custom2' },
            ],
          },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([
    {
      title: 'a',
      items: [
        { title: 'child-menu-1', link: '/child1/custom1/', role: ['admin'] },
        { title: 'child-menu-2', link: '/child1/custom2/' },
      ],
    },
  ]);
});
test('uniq', () => {
  expect(
    parseNavigation([
      { title: 'a', link: '/a' },
      { title: 'b', link: '/a' },
    ])
  ).toEqual([{ title: 'a', link: '/a/' }]);
  expect(
    parseNavigation([
      { title: 'a', link: '/a' },
      { title: 'b', link: '/b' },
    ])
  ).toEqual([
    { title: 'a', link: '/a/' },
    { title: 'b', link: '/b/' },
  ]);
  expect(
    parseNavigation([
      {
        title: {
          en: 'Playground',
          zh: '试验场',
        },
        link: '',
        items: [
          {
            title: 'React',
            link: '/playground/react',
          },
        ],
      },
      {
        title: {
          en: 'Docs',
          zh: '文档',
        },
        link: '/docs',
      },
      {
        title: 'DID Connect Docs',
        link: '/docs/',
      },
      {
        title: 'DID Connect React',
        link: '/playground/react/',
      },
    ])
  ).toEqual([
    {
      title: {
        en: 'Playground',
        zh: '试验场',
      },
      link: '',
      items: [
        {
          title: 'React',
          link: '/playground/react/',
        },
      ],
    },
    {
      title: {
        en: 'Docs',
        zh: '文档',
      },
      link: '/docs/',
    },
  ]);
  expect(
    parseNavigation([
      { title: 'a', link: { zh: '/zh', en: '/en' } },
      { title: 'b', link: { zh: '/zh', en: '/en' } },
    ])
  ).toEqual([{ title: 'a', link: { zh: '/zh/', en: '/en/' } }]);
  expect(
    parseNavigation([
      { title: 'Developer', link: '/developer/blocklets' },
      { title: 'DuplicateLink', link: '/developer/blocklets', section: [] },
      { title: 'NotDuplicateLink', link: '/developer/blocklets', section: ['sessionManager'] },
      { title: 'Manage', link: '/admin/apply', section: ['sessionManager'] },
      { title: 'DuplicateTitle', link: '/admin/apply2', section: ['sessionManager'] },
    ])
  ).toEqual([
    { title: 'Developer', link: '/developer/blocklets/' },
    { title: 'NotDuplicateLink', link: '/developer/blocklets/', section: ['sessionManager'] },
    { title: 'Manage', link: '/admin/apply/', section: ['sessionManager'] },
    { title: 'DuplicateTitle', link: '/admin/apply2/', section: ['sessionManager'] },
  ]);
});
test('child icon', () => {
  // use child icon
  expect(
    parseNavigation([{ title: 'a', child: 'child1' }], {
      children: [
        {
          meta: { name: 'child1', navigation: [{ title: 'customTitle', link: '/', icon: 'abc' }] },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([{ title: 'a', link: '/child1/', icon: 'abc' }]);
  // use parent icon
  expect(
    parseNavigation([{ title: 'a', child: 'child1', icon: 'parent' }], {
      children: [
        {
          meta: { name: 'child1', navigation: [{ title: 'customTitle', link: '/', icon: 'abc' }] },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([{ title: 'a', link: '/child1/', icon: 'parent' }]);
});
test('child section', () => {
  // use child section
  expect(
    parseNavigation([{ title: 'a', child: 'child1' }], {
      children: [
        {
          meta: { name: 'child1', navigation: [{ title: 'customTitle', link: '/', section: ['dashboard'] }] },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([{ title: 'a', link: '/child1/', section: ['dashboard'] }]);
  // use parent section
  expect(
    parseNavigation([{ title: 'a', child: 'child1', section: ['header, footer'] }], {
      children: [
        {
          meta: { name: 'child1', navigation: [{ title: 'customTitle', link: '/', section: ['dashboard'] }] },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([{ title: 'a', link: '/child1/', section: ['header, footer'] }] as any);
  // multi section, multi group (parent declare section)
  expect(
    parseNavigation(
      [
        {
          child: 'child1',
          section: undefined, // parent should not declare section for child
        },
      ],
      {
        children: [
          {
            meta: {
              name: 'child1',
              navigation: [
                { title: { en: 'GiftCards', zh: '礼品卡' }, link: '/admin', section: ['dashboard'] },
                { title: { en: 'Redeem Gift Card', zh: '兑换礼品卡' }, link: '/', section: ['header'] },
              ],
            },
            mountPoint: '/child1',
          },
        ],
      }
    )
  ).toEqual([
    {
      title: { en: 'GiftCards', zh: '礼品卡' },
      link: '/child1/admin/',
      section: ['dashboard'],
    },
    { title: { en: 'Redeem Gift Card', zh: '兑换礼品卡' }, link: '/child1/', section: ['header'] },
  ]);
  // multi section, same group
  expect(
    parseNavigation([{ title: 'a1', child: 'child1', section: ['s1'] }], {
      children: [
        {
          meta: {
            name: 'child1',
            navigation: [
              { title: 'a21', link: '/p21', section: ['s2'] },
              { title: 'a22', link: '/p22', section: ['s2'] },
            ],
          },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([
    {
      title: 'a1',
      section: ['s1'],
      items: [
        { title: 'a21', link: '/child1/p21/', section: ['s2'] },
        { title: 'a22', link: '/child1/p22/', section: ['s2'] },
      ],
    },
  ] as any);
  // multi section, same group (parent does not declare section)
  expect(
    parseNavigation([{ title: 'DID Comments', child: 'did-comments' }], {
      children: [
        {
          meta: {
            name: 'did-comments',
            navigation: [
              { title: { en: 'Dashboard', zh: '看板' }, link: '/dashboard', section: ['dashboard'] },
              { title: { en: 'Comments', zh: '评论' }, link: '/objects', section: ['dashboard'] },
            ],
          },
          mountPoint: '/did-comments',
        },
      ],
    })
  ).toEqual([
    {
      title: 'DID Comments',
      section: ['dashboard'],
      items: [
        { title: { en: 'Dashboard', zh: '看板' }, link: '/did-comments/dashboard/', section: ['dashboard'] },
        { title: { en: 'Comments', zh: '评论' }, link: '/did-comments/objects/', section: ['dashboard'] },
      ],
    },
  ]);
});
test('rename child to component', () => {
  expect(
    parseNavigation([{ title: 'a', component: 'child1' }], {
      children: [
        {
          meta: { name: 'child1', navigation: [{ title: 'customTitle', link: '/', section: ['dashboard'] }] },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([{ title: 'a', link: '/child1/', section: ['dashboard'] }]);
});

test('nested child nav', () => {
  expect(
    parseNavigation([{ title: 'a', component: 'child1' }], {
      children: [
        {
          meta: {
            name: 'child1',
            navigation: [
              { title: 'm1', link: '/m1', section: ['dashboard'] },
              { title: 'm2', link: '/m2', section: ['dashboard'] },
            ],
          },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([
    {
      title: 'a',
      section: ['dashboard'],
      items: [
        { title: 'm1', link: '/child1/m1/', section: ['dashboard'] },
        { title: 'm2', link: '/child1/m2/', section: ['dashboard'] },
      ],
    },
  ]);

  expect(
    parseNavigation([{ title: 'a', component: 'child1' }], {
      children: [
        {
          meta: {
            name: 'child1',
            navigation: [
              {
                title: 'm1',
                section: ['dashboard'],
                items: [
                  { title: 'm1', link: '/m1', section: ['dashboard'] },
                  { title: 'm2', link: '/m2', section: ['dashboard'] },
                ],
              },
            ],
          },
          mountPoint: '/child1',
        },
      ],
    })
  ).toEqual([
    {
      title: 'a',
      section: ['dashboard'],
      items: [
        { title: 'm1', link: '/child1/m1/', section: ['dashboard'] },
        { title: 'm2', link: '/child1/m2/', section: ['dashboard'] },
      ],
    },
  ]);
});
