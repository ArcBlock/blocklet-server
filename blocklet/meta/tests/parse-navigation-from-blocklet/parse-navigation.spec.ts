import { describe, test, expect } from 'bun:test';
import {
  parseNavigation,
  isMatchSection,
  deepWalk,
  nestNavigationList,
  filterNavigation,
  joinLink,
  checkLink,
  flattenNavigation,
  splitNavigationBySection,
  NavigationItem,
} from '../../src/parse-navigation-from-blocklet';

import simpleData from './fixtures/01-simple.json';
import navigationData from './fixtures/02-navigation.json';
import childrenData from './fixtures/03-children.json';
import navigationWithChildrenData from './fixtures/04-navigation-with-children.json';
import navigationWithChildrenRewriteData from './fixtures/05-navigation-with-children-rewrite.json';
import navigationWithChildrenLocaleData from './fixtures/06-navigation-with-children-locale.json';
import nestedChildrenData from './fixtures/07-nested-children.json';
import nestedChildrenWithContainerData from './fixtures/08-nested-children-with-container-mode.json';
import navigationLevelupData from './fixtures/09-navigation-levelup.json';
import childrenWithRoleOnParent from './fixtures/10-children-with-role-on-parent';
import navigationWithDescription from './fixtures/11-navigation-with-description';

describe('parseNavigation should work', () => {
  test('should work with empty data', () => {
    const { navigationList, builtinList, components } = parseNavigation();
    expect(navigationList).toEqual([]);
    expect(builtinList).toEqual([]);
    expect(components).toEqual([]);
  });

  test('should work with data (without navigation, without children)', () => {
    const { navigationList, builtinList, components } = parseNavigation(simpleData);
    expect(navigationList).toEqual([]);
    expect(builtinList).toEqual([]);
    expect(components).toEqual([]);
  });

  test('should work with data (with navigation, without children)', () => {
    const { navigationList, builtinList, components } = parseNavigation(navigationData as any);
    expect(navigationList).toEqual([
      {
        component: '',
        from: 'manual',
        id: 'id-for-manual',
        link: '/manual',
        section: 'header',
        title: 'Manual Menu',
        visible: true,
      },
    ]);
    expect(builtinList).toEqual([]);
    expect(components).toEqual([]);
  });

  test('should work with data (without navigation, with children)', () => {
    const { navigationList, builtinList, components } = parseNavigation(childrenData);
    expect(navigationList).toEqual([
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/',
        section: 'header',
        title: 'Simple HTML Demo',
        visible: true,
      },
    ]);
    expect(builtinList).toEqual([
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/',
        section: 'header',
        title: 'Simple HTML Demo',
        visible: true,
      },
    ]);
    expect(components).toEqual([
      {
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/minimalist-html-demo',
        name: 'minimalist-html-demo',
        navigation: [],
        title: 'Simple HTML Demo',
      },
    ]);
  });

  test('should work with data (with navigation, with children)', () => {
    const { navigationList, builtinList, components } = parseNavigation(navigationWithChildrenData as any);
    expect(navigationList).toEqual([
      {
        component: '',
        from: 'manual',
        id: 'id-for-manual',
        link: '/manual',
        section: 'header',
        title: 'Manual Menu',
        visible: true,
      },
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/',
        section: 'header',
        title: 'Simple HTML Demo',
        visible: true,
      },
    ]);
    expect(builtinList).toEqual([
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/',
        section: 'header',
        title: 'Simple HTML Demo',
        visible: true,
      },
    ]);
    expect(components).toEqual([
      {
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/minimalist-html-demo',
        name: 'minimalist-html-demo',
        navigation: [],
        title: 'Simple HTML Demo',
      },
    ]);
  });

  test('should work with data (with navigation, with children, rewrite children)', () => {
    const { navigationList, builtinList, components } = parseNavigation(navigationWithChildrenRewriteData as any);
    expect(navigationList).toEqual([
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/',
        section: 'header',
        title: 'Simple HTML Demo (changed)',
        visible: true,
      },
    ]);
    expect(builtinList).toEqual([
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/',
        section: 'header',
        title: 'Simple HTML Demo',
        visible: true,
      },
    ]);
    expect(components).toEqual([
      {
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/minimalist-html-demo',
        name: 'minimalist-html-demo',
        navigation: [],
        title: 'Simple HTML Demo',
      },
    ]);
  });

  test('should work with data (multi locale)', () => {
    const { navigationList, builtinList, components } = parseNavigation(navigationWithChildrenLocaleData as any);
    expect(navigationList).toEqual([
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: {
          en: '/en',
          zh: '/zh',
        },
        section: 'header',
        title: {
          en: 'Simple HTML Demo (en)',
          zh: 'Simple HTML Demo (zh)',
        },
        visible: true,
      },
    ]);
    expect(builtinList).toEqual([
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/',
        section: 'header',
        title: 'Simple HTML Demo',
        visible: true,
      },
    ]);
    expect(components).toEqual([
      {
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/minimalist-html-demo',
        name: 'minimalist-html-demo',
        navigation: [],
        title: 'Simple HTML Demo',
      },
    ]);
  });
  test('should work with data (nested children)', () => {
    const { navigationList, builtinList, components } = parseNavigation(nestedChildrenData);
    expect(navigationList).toEqual([
      {
        id: 'navigation',
        title: 'Navigation',
        link: '/navigation',
        items: [
          {
            id: 'navigation-level-1',
            title: 'Navigation Level 1',
            link: '/level-1',
          },
        ],
      },
      {
        title: 'Simple HTML Demo',
        component: 'minimalist-html-demo',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: undefined,
        from: 'yaml',
        visible: true,
        section: 'header',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-1-2',
        title: 'Level 1-2',
        link: '/level-1-1/level-1-2',
        component: 'minimalist-html-demo',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
        visible: true,
        section: 'header',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-1-3',
        title: 'Level 1-3',
        link: '/level-1-1/level-1-3',
        component: 'minimalist-html-demo',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
        visible: true,
        section: 'header',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-2-1',
        title: 'Level-2-1',
        link: '/level-2-1',
        component: 'minimalist-html-demo.minimalist-html-demo-2',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
        visible: true,
        section: 'header',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-3-1',
        title: 'Level-3-1',
        link: '/level-3-1',
        component: 'minimalist-html-demo.minimalist-html-demo-2.minimalist-html-demo-3',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
        visible: true,
        section: 'header',
      },
    ]);
    expect(builtinList).toEqual([
      {
        title: 'Simple HTML Demo',
        component: 'minimalist-html-demo',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: undefined,
        from: 'yaml',
        visible: true,
        section: 'header',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-1-2',
        title: 'Level 1-2',
        link: '/level-1-1/level-1-2',
        component: 'minimalist-html-demo',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
        visible: true,
        section: 'header',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-1-3',
        title: 'Level 1-3',
        link: '/level-1-1/level-1-3',
        component: 'minimalist-html-demo',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
        visible: true,
        section: 'header',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-2-1',
        title: 'Level-2-1',
        link: '/level-2-1',
        component: 'minimalist-html-demo.minimalist-html-demo-2',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
        visible: true,
        section: 'header',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-3-1',
        title: 'Level-3-1',
        link: '/level-3-1',
        component: 'minimalist-html-demo.minimalist-html-demo-2.minimalist-html-demo-3',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
        visible: true,
        section: 'header',
      },
    ]);
    expect(components).toEqual([
      {
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        name: 'minimalist-html-demo',
        link: '/minimalist-html-demo',
        title: 'Simple HTML Demo',
        navigation: [
          {
            section: 'header',
            id: 'level-1-1',
            title: 'Level 1-1',
            link: '/level-1-1',
            items: [
              { id: 'level-1-2', title: 'Level 1-2', link: '/level-1-2' },
              { id: 'level-1-3', title: 'Level 1-3', link: '/level-1-3' },
            ],
          },
        ],
      },
      {
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj2',
        name: 'minimalist-html-demo.minimalist-html-demo-2',
        link: '/minimalist-html-demo/minimalist-html-demo-2',
        title: 'Simple HTML Demo - 2',
        navigation: [
          {
            section: 'header',
            id: 'level-2-1',
            title: 'Level-2-1',
            link: '/level-2-1',
          },
        ],
      },
      {
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj3',
        name: 'minimalist-html-demo.minimalist-html-demo-2.minimalist-html-demo-3',
        link: '/minimalist-html-demo/minimalist-html-demo-2/minimalist-html-demo-3',
        title: 'Simple HTML Demo - 3',
        navigation: [
          {
            section: 'header',
            id: 'level-3-1',
            title: 'Level-3-1',
            link: '/level-3-1',
          },
        ],
      },
    ]);
  });
  test('should work with container mode(nested children)', () => {
    const { navigationList, builtinList, components } = parseNavigation(nestedChildrenWithContainerData as any);
    const list = [
      {
        title: 'Static Demo',
        component: 'static-demo-blocklet',
        id: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
        link: undefined as unknown as string,
        from: 'yaml',
        visible: true,
        section: 'header',
      },
      {
        id: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV/navigation-level-1',
        title: 'Navigation Level 1',
        link: '/navigation/level-1',
        section: 'header',
        visible: true,
        component: 'static-demo-blocklet',
        parent: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
        from: 'yaml',
      },
      {
        title: 'Simple HTML Demo',
        component: 'minimalist-html-demo',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: undefined,
        from: 'yaml',
        visible: true,
        section: 'header',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-1-2',
        title: 'Level 1-2',
        link: '/level-1-1/level-1-2',
        section: 'header',
        visible: true,
        component: 'minimalist-html-demo',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-1-3',
        title: 'Level 1-3',
        link: '/level-1-1/level-1-3',
        section: 'header',
        visible: true,
        component: 'minimalist-html-demo',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-2-1',
        title: 'Level-2-1',
        link: '/level-2-1',
        section: 'header',
        visible: true,
        component: 'minimalist-html-demo.minimalist-html-demo-2',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
      },
      {
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/level-3-1',
        title: 'Level-3-1',
        link: '/level-3-1',
        section: 'header',
        visible: true,
        component: 'minimalist-html-demo.minimalist-html-demo-2.minimalist-html-demo-3',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        from: 'yaml',
      },
    ];
    expect(navigationList).toEqual(list);
    expect(builtinList).toEqual(list);
    expect(components).toEqual([
      {
        did: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
        name: 'static-demo-blocklet',
        link: '/',
        title: 'Static Demo',
        navigation: [
          {
            section: 'header',
            id: 'navigation',
            title: 'Navigation',
            link: '/navigation',
            items: [
              {
                id: 'navigation-level-1',
                title: 'Navigation Level 1',
                link: '/level-1',
              },
            ],
          },
        ],
      },
      {
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        name: 'minimalist-html-demo',
        link: '/minimalist-html-demo',
        title: 'Simple HTML Demo',
        navigation: [
          {
            section: 'header',
            id: 'level-1-1',
            title: 'Level 1-1',
            link: '/level-1-1',
            items: [
              { id: 'level-1-2', title: 'Level 1-2', link: '/level-1-2' },
              { id: 'level-1-3', title: 'Level 1-3', link: '/level-1-3' },
            ],
          },
        ],
      },
      {
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj2',
        name: 'minimalist-html-demo.minimalist-html-demo-2',
        link: '/minimalist-html-demo/minimalist-html-demo-2',
        title: 'Simple HTML Demo - 2',
        navigation: [
          {
            section: 'header',
            id: 'level-2-1',
            title: 'Level-2-1',
            link: '/level-2-1',
          },
        ],
      },
      {
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj3',
        name: 'minimalist-html-demo.minimalist-html-demo-2.minimalist-html-demo-3',
        link: '/minimalist-html-demo/minimalist-html-demo-2/minimalist-html-demo-3',
        title: 'Simple HTML Demo - 3',
        navigation: [
          {
            section: 'header',
            id: 'level-3-1',
            title: 'Level-3-1',
            link: '/level-3-1',
          },
        ],
      },
    ]);
  });

  test('should work with levelUp section', () => {
    const { navigationList, builtinList, components } = parseNavigation(navigationLevelupData as any);

    expect(navigationList.filter((x) => x.section === 'header').length).toBe(2);
    expect(navigationList.filter((x) => x.section === 'footer').length).toBe(2);
    expect(navigationList.filter((x) => x.section === 'dashboard').length).toBe(2);
    expect(navigationList.filter((x) => x.section === 'bottom').length).toBe(1);
    expect(navigationList.filter((x) => x.section === 'social').length).toBe(1);
    expect(navigationList.filter((x) => x.section === 'sessionManager').length).toBe(1);
    expect(navigationList.filter((x) => x.section === 'userCenter').length).toBe(1);

    expect(builtinList.filter((x) => x.section === 'header').length).toBe(2);
    expect(builtinList.filter((x) => x.section === 'footer').length).toBe(2);
    expect(builtinList.filter((x) => x.section === 'dashboard').length).toBe(2);
    expect(builtinList.filter((x) => x.section === 'bottom').length).toBe(1);
    expect(builtinList.filter((x) => x.section === 'social').length).toBe(1);
    expect(builtinList.filter((x) => x.section === 'sessionManager').length).toBe(1);
    expect(builtinList.filter((x) => x.section === 'userCenter').length).toBe(1);

    expect(components[0].did).toEqual(navigationLevelupData.children[0].meta.did);
    expect(components[0].name).toEqual(navigationLevelupData.children[0].meta.name);
    expect(components[0].title).toEqual(navigationLevelupData.children[0].meta.title);
  });

  test('should work with data (role on parent)', () => {
    const { navigationList, builtinList, components } = parseNavigation(childrenWithRoleOnParent as any);

    expect(navigationList).toEqual([
      {
        title: 'demo-blocklet-child-1',
        component: 'demo-blocklet-child-1',
        id: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ',
        link: undefined,
        from: 'yaml',
        visible: true,
        section: 'dashboard',
      },
      {
        id: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ/admin__blocklets',
        title: 'Blocklets',
        icon: 'icon-park-outline:all-application',
        link: '/console/blocklets',
        section: 'dashboard',
        visible: true,
        role: ['owner', 'admin'], // inherit
        component: 'demo-blocklet-child-1',
        parent: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ',
        from: 'yaml',
      },
      {
        id: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ/admin__categories',
        title: 'Categories',
        icon: 'mdi:tag-outline',
        link: '/console/categories',
        role: ['developer'], // own
        section: 'dashboard',
        visible: true,
        component: 'demo-blocklet-child-1',
        parent: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ',
        from: 'yaml',
      },
    ]);
    expect(builtinList).toEqual([
      {
        title: 'demo-blocklet-child-1',
        component: 'demo-blocklet-child-1',
        id: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ',
        from: 'yaml',
        visible: true,
        section: 'dashboard',
      },
      {
        id: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ/admin__blocklets',
        title: 'Blocklets',
        icon: 'icon-park-outline:all-application',
        link: '/console/blocklets',
        section: 'dashboard',
        visible: true,
        role: ['owner', 'admin'],
        component: 'demo-blocklet-child-1',
        parent: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ',
        from: 'yaml',
      },
      {
        id: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ/admin__categories',
        title: 'Categories',
        icon: 'mdi:tag-outline',
        link: '/console/categories',
        role: ['developer'],
        section: 'dashboard',
        visible: true,
        component: 'demo-blocklet-child-1',
        parent: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ',
        from: 'yaml',
      },
    ]);
    expect(components).toEqual([
      {
        did: 'z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ',
        name: 'demo-blocklet-child-1',
        link: '/',
        title: 'demo-blocklet-child-1',
        navigation: [
          {
            section: ['dashboard'],
            id: 'admin',
            title: 'Admin',
            icon: 'eos-icons:admin-outlined',
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
      },
    ]);
  });

  test('should work with description', () => {
    const { navigationList, builtinList, components } = parseNavigation(navigationWithDescription as any);

    expect(navigationList).toEqual([
      {
        component: '',
        from: 'manual',
        id: 'id-for-manual',
        link: '/manual',
        section: 'header',
        title: 'Manual Menu',
        visible: true,
      },
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        section: 'header',
        title: 'Simple HTML Demo',
        visible: true,
      },
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/nav1',
        link: '/nav1',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        section: 'header',
        title: 'nav1 title',
        description: 'nav1 description',
        visible: true,
      },
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/nav2',
        link: '/nav2',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        section: 'header',
        title: 'nav2 title',
        description: {
          en: 'nav2 description',
          zh: 'nav2 描述',
        },
        visible: true,
      },
    ]);
    expect(builtinList).toEqual([
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        section: 'header',
        title: 'Simple HTML Demo',
        visible: true,
      },
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/nav1',
        link: '/nav1',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        section: 'header',
        title: 'nav1 title',
        description: 'nav1 description',
        visible: true,
      },
      {
        component: 'minimalist-html-demo',
        from: 'yaml',
        id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj/nav2',
        link: '/nav2',
        parent: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        section: 'header',
        title: 'nav2 title',
        description: {
          en: 'nav2 description',
          zh: 'nav2 描述',
        },
        visible: true,
      },
    ]);
    expect(components).toEqual([
      {
        did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
        link: '/minimalist-html-demo',
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
      },
    ]);
  });
});

describe('isMatchSection should work', () => {
  test('should work with simple data', () => {
    expect(isMatchSection('header', 'header')).toBe(true);
    expect(isMatchSection('header', 'footer')).toBe(false);
    expect(isMatchSection('footer', 'header')).toBe(false);
  });
  test('should work with array data', () => {
    expect(isMatchSection(['header', 'footer'], 'header')).toBe(true);
    expect(isMatchSection(['header', 'footer'], 'footer')).toBe(true);
    expect(isMatchSection(['header', 'footer'], 'dashboard')).toBe(false);
  });
});

describe('deepWalk should work', () => {
  const data = {
    value: 1,
    children: [
      {
        value: 2,
        children: {
          value: 3,
        },
      },
      {
        value: 4,
      },
    ],
  } as Record<string, unknown>;
  test('should work with normal tree data', () => {
    const list: number[] = [];
    deepWalk(data, (item) => {
      list.push(item.value);
    });
    expect(list).toEqual([1, 2, 3, 4]);
  });
  test('should work with normal tree data (reverse walk)', () => {
    const list: number[] = [];
    deepWalk(
      data,
      (item) => {
        list.push(item.value);
      },
      { order: 'last' }
    );
    expect(list).toEqual([3, 2, 4, 1]);
  });
  test('should work with diffrent children key', () => {
    const testData = {
      value: 1,
      items: [
        {
          value: 2,
          items: {
            value: 3,
          },
        },
        {
          value: 4,
        },
      ],
    } as Record<string, unknown>;
    const listRight: number[] = [];
    const listError: number[] = [];
    deepWalk(
      testData,
      (item) => {
        listRight.push(item.value);
      },
      { key: 'items' }
    );
    deepWalk(testData, (item) => {
      listError.push(item.value);
    });
    expect(listRight).toEqual([1, 2, 3, 4]);
    expect(listError).toEqual([1]);
  });
});

describe('nestNavigationList should work', () => {
  test('should work with empty data', () => {
    expect(nestNavigationList()).toEqual([]);
    expect(nestNavigationList([])).toEqual([]);
  });
  test('should work with normal data (without parent)', () => {
    const data = [
      {
        id: '1',
        value: 'one',
      },
      {
        id: '2',
        value: 'two',
      },
    ];
    expect(nestNavigationList(data)).toEqual(data);
  });
  test('should work with normal data (with parent)', () => {
    const data = [
      {
        id: '1',
        value: 'one',
      },
      {
        id: '2',
        value: 'two',
      },
      {
        id: '3',
        value: "one's child",
        parent: '1',
      },
    ];
    expect(nestNavigationList(data)).toEqual([
      {
        id: '1',
        value: 'one',
        items: [
          {
            id: '3',
            value: "one's child",
            parent: '1',
          },
        ],
      },
      {
        id: '2',
        value: 'two',
      },
    ]);
  });
  test('should work with complex data', () => {
    const data = [
      {
        id: '1',
        value: 'one',
      },
      {
        id: '2',
        value: 'two',
      },
      {
        id: '3',
        value: "three - one's child",
        parent: '1',
      },
      {
        id: '4',
        value: "four - three's child",
        parent: '3',
      },
      {
        id: '5',
        value: "five - one's child",
        parent: '1',
      },
    ];
    expect(nestNavigationList(data)).toEqual([
      {
        id: '1',
        value: 'one',
        items: [
          {
            id: '3',
            value: "three - one's child",
            parent: '1',
            items: [
              {
                id: '4',
                value: "four - three's child",
                parent: '3',
              },
            ],
          },
          {
            id: '5',
            value: "five - one's child",
            parent: '1',
          },
        ],
      },
      {
        id: '2',
        value: 'two',
      },
    ]);
  });
});

describe('filterNavigation', () => {
  test('should work without visible', () => {
    const data = [
      {
        id: '1',
        value: 'one',
      },
      {
        id: '2',
        value: 'two',
      },
      {
        id: '3',
        value: "one's child",
        parent: '1',
      },
    ];
    expect(filterNavigation(data)).toEqual([
      {
        id: '1',
        value: 'one',
        items: [
          {
            id: '3',
            value: "one's child",
            parent: '1',
          },
        ],
      },
      {
        id: '2',
        value: 'two',
      },
    ]);
  });
  test('should work with visible === false', () => {
    const data1 = [
      {
        id: '1',
        value: 'one',
        visible: false,
      },
      {
        id: '2',
        value: 'two',
      },
      {
        id: '3',
        value: "one's child",
        parent: '1',
      },
    ];
    const data2 = [
      {
        id: '1',
        value: 'one',
      },
      {
        id: '2',
        value: 'two',
      },
      {
        id: '3',
        value: "one's child",
        parent: '1',
        visible: false,
      },
    ];
    expect(filterNavigation(data1)).toEqual([
      {
        id: '2',
        value: 'two',
      },
    ]);
    expect(filterNavigation(data2)).toEqual([
      {
        id: '1',
        value: 'one',
        items: [],
      },
      {
        id: '2',
        value: 'two',
      },
    ]);
  });
});

describe('joinLink should work', () => {
  const components = [
    {
      name: 'a-com',
      link: '/a-com',
    },
    {
      name: 'b-com',
      link: '/b-com',
    },
    {
      name: 'c-com',
      link: '/c-com',
    },
  ];
  test('should work with string link', () => {
    const navigation = [
      {
        component: 'a-com',
        items: [
          {
            link: '/sub-1',
          },
        ],
      },
    ] as NavigationItem[];
    expect(joinLink(navigation as unknown as NavigationItem, components)).toEqual([
      {
        component: 'a-com',
        link: '/a-com',
        items: [
          {
            link: '/a-com/sub-1',
          },
        ],
      },
    ] as any);
  });
  test('should work with object link', () => {
    const navigation = [
      {
        component: 'a-com',
        items: [
          {
            link: {
              en: '/en/sub-1',
              zh: '/zh/sub-1',
            },
          },
        ],
      },
    ] as unknown as NavigationItem[];
    expect(joinLink(navigation as unknown as NavigationItem, components)).toEqual([
      {
        component: 'a-com',
        link: '/a-com',
        items: [
          {
            link: {
              en: '/a-com/en/sub-1',
              zh: '/a-com/zh/sub-1',
            },
          },
        ],
      },
    ] as any);
  });

  test('should work with object link (only parent object link)', () => {
    const navigation = [
      {
        link: {
          en: '/en/parent',
          zh: '/zh/parent',
        },
        items: [
          {
            link: '/sub-1',
          },
        ],
      },
    ];
    expect((joinLink as any)(navigation, components)).toEqual([
      {
        link: {
          en: '/en/parent',
          zh: '/zh/parent',
        },
        items: [
          {
            link: {
              en: '/en/parent/sub-1',
              zh: '/zh/parent/sub-1',
            },
          },
        ],
      },
    ]);
  });
  test('should work with object link (both parent & child object link)', () => {
    const navigation = [
      {
        link: {
          en: '/en/parent',
          zh: '/zh/parent',
        },
        items: [
          {
            link: {
              en: '/en/sub-1',
              zh: '/zh/sub-1',
            },
          },
        ],
      },
    ];
    expect((joinLink as any)(navigation, components)).toEqual([
      {
        link: {
          en: '/en/parent',
          zh: '/zh/parent',
        },
        items: [
          {
            link: {
              en: '/en/parent/en/sub-1',
              zh: '/zh/parent/zh/sub-1',
            },
          },
        ],
      },
    ]);
  });

  test('should work with absolute link', () => {
    const navigation = [
      {
        link: {
          en: '/en/parent',
          zh: '/zh/parent',
        },
        items: [
          {
            link: {
              en: '/en/sub-1',
              zh: 'https://arcblock.io',
            },
          },
        ],
      },
    ];
    expect((joinLink as any)(navigation, components)).toEqual([
      {
        link: {
          en: '/en/parent',
          zh: '/zh/parent',
        },
        items: [
          {
            link: {
              en: '/en/parent/en/sub-1',
              zh: 'https://arcblock.io',
            },
          },
        ],
      },
    ]);
  });
});

describe('checkLink should work', () => {
  test('should work width data', () => {
    expect(checkLink('/abc')).toBe(true);
    expect(checkLink('https://arcblock.io')).toBe(true);
    expect(checkLink('abc')).toBe(false);
  });
});

describe('flattenNavigation should work', () => {
  test('should work with normal data', () => {
    const rawData = [
      {
        id: '1',
        value: 'v1',
        items: [
          {
            id: '3',
            value: 'v3',
            items: [
              {
                id: '4',
                value: 'v4',
              },
            ],
          },
        ],
      },
      {
        id: '2',
        value: 'v2',
      },
    ];
    expect(flattenNavigation(rawData)).toEqual([
      { id: '1', value: 'v1' },
      { id: '3', value: 'v3' },
      { id: '4', value: 'v4' },
      { id: '2', value: 'v2' },
    ]);
    expect(flattenNavigation(rawData, { depth: 2 })).toEqual([
      {
        id: '1',
        value: 'v1',
        items: [
          { id: '3', value: 'v3' },
          { id: '4', value: 'v4' },
        ],
      },
      { id: '2', value: 'v2' },
    ]);
    expect(flattenNavigation(rawData, { depth: 3 })).toEqual([
      {
        id: '1',
        value: 'v1',
        items: [
          {
            id: '3',
            value: 'v3',
            items: [{ id: '4', value: 'v4' }],
          },
        ],
      },
      { id: '2', value: 'v2' },
    ]);
    expect(flattenNavigation(rawData, { depth: 4 })).toEqual([
      {
        id: '1',
        value: 'v1',
        items: [
          {
            id: '3',
            value: 'v3',
            items: [{ id: '4', value: 'v4' }],
          },
        ],
      },
      { id: '2', value: 'v2' },
    ]);
  });
  test('should work with flat data', () => {
    const rawData = [
      {
        id: '1',
        value: 'v1',
      },
      {
        id: '2',
        value: 'v2',
      },
      {
        id: '3',
        value: 'v3',
      },
      {
        id: '4',
        value: 'v4',
      },
    ];
    expect(flattenNavigation(rawData)).toEqual([
      { id: '1', value: 'v1' },
      { id: '2', value: 'v2' },
      { id: '3', value: 'v3' },
      { id: '4', value: 'v4' },
    ]);
    expect(flattenNavigation(rawData, { depth: 2 })).toEqual([
      { id: '1', value: 'v1' },
      { id: '2', value: 'v2' },
      { id: '3', value: 'v3' },
      { id: '4', value: 'v4' },
    ]);
    expect(flattenNavigation(rawData, { depth: 3 })).toEqual([
      { id: '1', value: 'v1' },
      { id: '2', value: 'v2' },
      { id: '3', value: 'v3' },
      { id: '4', value: 'v4' },
    ]);
  });
});

describe('splitNavigationBySection should work', () => {
  const data = [
    {
      title: 'Simple HTML Demo',
      component: 'minimalist-html-demo-1',
      id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
      link: '/',
      from: 'yaml',
      visible: true,
    },
    {
      title: 'Component Demo',
      component: 'component-demo-1',
      id: 'z8iZsvZpMrfEwwbMM2BZxsZGbo4zmhbA7G3FV',
      items: [] as NavigationItem[],
      link: '/',
      from: 'yaml',
      visible: true,
    },
    {
      title: 'Vote',
      component: 'vote-1',
      id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
      items: [
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/manage',
          title: {
            en: 'Manage',
            zh: '管理',
          },
          icon: 'ion:settings-outline',
          link: '/admin',
          section: ['sessionManager'],
          role: ['admin', 'owner'],
          visible: true,
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/twitter',
          icon: 'mdi:twitter',
          link: 'https://twitter.com/ArcBlock_io',
          section: ['social'],
          title: 'twitter',
          visible: true,
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/tg',
          icon: 'mdi:telegram',
          link: 'https://t.me/ArcBlock',
          section: ['social'],
          title: 'telegram',
          visible: true,
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/github',
          icon: 'mdi:github',
          link: 'https://github.com/arcblock',
          section: ['social'],
          title: 'github',
          visible: true,
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/vote_all',
          title: {
            en: 'All Votes',
            zh: '投票列表',
          },
          link: '/admin/polls',
          icon: 'mdi:history',
          visible: true,
          component: '',
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/comments_all',
          title: {
            en: 'All Comments',
            zh: '所有评论',
          },
          link: '/did-comments/objects',
          icon: 'ic:outline-insert-comment',
          role: ['admin', 'owner'],
          visible: true,
          component: '',
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/comments_my',
          title: {
            en: 'My Comments',
            zh: '我的评论',
          },
          link: '/did-comments/my-comments',
          icon: 'icon-park-outline:comments',
          section: ['dashboard'],
          visible: true,
          component: '',
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/comments_playground',
          title: {
            en: 'Playground',
            zh: '试验',
          },
          link: '/did-comments/playground',
          icon: 'ant-design:experiment-outlined',
          visible: true,
          component: '',
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
      ],
      from: 'yaml',
      visible: true,
    },
    {
      id: '/team',
      title: {
        en: 'Access',
        zh: '访问控制',
      },
      role: ['owner', 'admin', 'member'],
      section: ['dashboard'],
      link: '',
      from: 'team-tmpl',
      items: [
        {
          id: '/access/member',
          title: {
            en: 'Members',
            zh: '成员',
          },
          icon: 'ant-design:user-outlined',
          link: '/.well-known/service/admin/members',
          from: 'team-tmpl',
          parent: '/team',
          visible: true,
        },
        {
          id: '/access/passport',
          title: {
            en: 'Passport',
            zh: '通行证',
          },
          icon: 'icon-park-outline:passport',
          link: '/.well-known/service/admin/passports',
          from: 'team-tmpl',
          parent: '/team',
          visible: true,
        },
      ],
      visible: true,
    },
    {
      id: '/dashboard',
      title: 'Blocklet',
      role: ['owner', 'admin'],
      section: ['dashboard'],
      link: '',
      from: 'team-tmpl',
      items: [
        {
          id: '/dashboard/dashboard',
          title: {
            en: 'Dashboard',
            zh: '仪表盘',
          },
          icon: 'ant-design:dashboard-outlined',
          link: '/.well-known/service/admin',
          from: 'team-tmpl',
          parent: '/dashboard',
          visible: true,
        },
      ],
      visible: true,
    },
    {
      id: '/sessionManager',
      title: {
        en: 'Manage',
        zh: '管理',
      },
      section: ['sessionManager'],
      icon: 'ion:settings-outline',
      link: '/.well-known/service/admin',
      role: ['owner', 'admin'],
      from: 'team-tmpl',
      visible: true,
    },
  ] as NavigationItem[];
  expect(splitNavigationBySection(data)).toEqual([
    {
      title: 'Simple HTML Demo',
      component: 'minimalist-html-demo-1',
      id: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
      link: '/',
      from: 'yaml',
      visible: true,
      section: 'header',
    },
    {
      title: 'Component Demo',
      component: 'component-demo-1',
      id: 'z8iZsvZpMrfEwwbMM2BZxsZGbo4zmhbA7G3FV',
      items: [],
      link: '/',
      from: 'yaml',
      visible: true,
      section: 'header',
    },
    {
      title: 'Vote',
      component: 'vote-1',
      id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
      from: 'yaml',
      visible: true,
      section: 'sessionManager',
      items: [
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/manage',
          title: { en: 'Manage', zh: '管理' },
          icon: 'ion:settings-outline',
          link: '/admin',
          section: 'sessionManager',
          role: ['admin', 'owner'],
          visible: true,
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
      ],
    },
    {
      title: 'Vote',
      component: 'vote-1',
      id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
      from: 'yaml',
      visible: true,
      section: 'social',
      items: [
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/twitter',
          icon: 'mdi:twitter',
          link: 'https://twitter.com/ArcBlock_io',
          section: 'social',
          title: 'twitter',
          visible: true,
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/tg',
          icon: 'mdi:telegram',
          link: 'https://t.me/ArcBlock',
          section: 'social',
          title: 'telegram',
          visible: true,
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/github',
          icon: 'mdi:github',
          link: 'https://github.com/arcblock',
          section: 'social',
          title: 'github',
          visible: true,
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
      ],
    },
    {
      title: 'Vote',
      component: 'vote-1',
      id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
      from: 'yaml',
      visible: true,
      section: 'header',
      items: [
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/vote_all',
          title: { en: 'All Votes', zh: '投票列表' },
          link: '/admin/polls',
          icon: 'mdi:history',
          visible: true,
          component: '',
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
          section: 'header',
        },
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/comments_all',
          title: { en: 'All Comments', zh: '所有评论' },
          link: '/did-comments/objects',
          icon: 'ic:outline-insert-comment',
          role: ['admin', 'owner'],
          visible: true,
          component: '',
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
          section: 'header',
        },
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/comments_playground',
          title: { en: 'Playground', zh: '试验' },
          link: '/did-comments/playground',
          icon: 'ant-design:experiment-outlined',
          visible: true,
          component: '',
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
          section: 'header',
        },
      ],
    },
    {
      title: 'Vote',
      component: 'vote-1',
      id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
      from: 'yaml',
      visible: true,
      section: 'dashboard',
      items: [
        {
          id: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D/comments_my',
          title: { en: 'My Comments', zh: '我的评论' },
          link: '/did-comments/my-comments',
          icon: 'icon-park-outline:comments',
          section: 'dashboard',
          visible: true,
          component: '',
          parent: 'z8iZvX3XQAtdqFn9NEMVJhhVLnw5VZaJXFC5D',
          from: 'yaml',
        },
      ],
    },
    {
      id: '/team',
      title: { en: 'Access', zh: '访问控制' },
      role: ['owner', 'admin', 'member'],
      section: 'dashboard',
      link: '',
      from: 'team-tmpl',
      visible: true,
      items: [
        {
          id: '/access/member',
          title: { en: 'Members', zh: '成员' },
          icon: 'ant-design:user-outlined',
          link: '/.well-known/service/admin/members',
          from: 'team-tmpl',
          parent: '/team',
          visible: true,
          section: 'dashboard',
        },
        {
          id: '/access/passport',
          title: { en: 'Passport', zh: '通行证' },
          icon: 'icon-park-outline:passport',
          link: '/.well-known/service/admin/passports',
          from: 'team-tmpl',
          parent: '/team',
          visible: true,
          section: 'dashboard',
        },
      ],
    },
    {
      id: '/dashboard',
      title: 'Blocklet',
      role: ['owner', 'admin'],
      section: 'dashboard',
      link: '',
      from: 'team-tmpl',
      visible: true,
      items: [
        {
          id: '/dashboard/dashboard',
          title: { en: 'Dashboard', zh: '仪表盘' },
          icon: 'ant-design:dashboard-outlined',
          link: '/.well-known/service/admin',
          from: 'team-tmpl',
          parent: '/dashboard',
          visible: true,
          section: 'dashboard',
        },
      ],
    },
    {
      id: '/sessionManager',
      title: { en: 'Manage', zh: '管理' },
      section: 'sessionManager',
      icon: 'ion:settings-outline',
      link: '/.well-known/service/admin',
      role: ['owner', 'admin'],
      from: 'team-tmpl',
      visible: true,
      items: [],
    },
  ] as any);
});
