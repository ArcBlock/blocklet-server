/* eslint-disable react/prop-types */
import { createContext, useContext, useMemo, useCallback } from 'react';
import { useReactive } from 'ahooks';
import cloneDeep from 'lodash/cloneDeep';
import isNil from 'lodash/isNil';
import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import { joinURL } from 'ufo';
import { Chip } from '@mui/material';
import {
  deepWalk,
  parseNavigation,
  isMatchSection,
  nestNavigationList,
  filterNavigation,
  joinLink,
  flattenNavigation,
  cleanOldNavigationHistory,
  sortRootNavigation,
} from '@blocklet/meta/lib/parse-navigation-from-blocklet';
import { nanoid } from '@blocklet/meta/lib/util';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { NAV_GROUP_SYSTEM, NAV_GROUP_SERVICES, NAV_GROUP_TEAM } from '@blocklet/constant';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useBlockletContext } from './blocklet';

const NavigationContext = createContext(null);

const BASE_LINK = '/';
const DEFAULT_SECTION = 'header';

// 默认注入的数据
// 需要指定一些内置的 id
const injectNavigationData = {
  userCenter: [
    {
      id: '/userCenter/notification',
      title: {
        en: 'Notifications',
        zh: '通知',
      },
      icon: 'ant-design:bell-outlined',
      link: joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/user/notifications'),
      from: 'team-tmpl',
      section: ['userCenter'],
    },
    {
      id: '/userCenter/orgs',
      title: {
        en: 'Organizations',
        zh: '组织',
      },
      icon: 'ant-design:team-outlined',
      link: joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/user/orgs'),
      from: 'team-tmpl',
      section: ['userCenter'],
      shouldDisplay: (blocklet) => blocklet.settings?.org?.enabled,
    },
    {
      id: '/userCenter/nfts',
      title: {
        en: 'NFTs',
        zh: 'NFTs',
      },
      icon: 'ant-design:gold-outlined',
      link: joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/user/nfts'),
      from: 'team-tmpl',
      section: ['userCenter'],
    },
    {
      id: '/userCenter/settings',
      title: {
        en: 'Settings',
        zh: '设置',
      },
      icon: 'ant-design:setting-outlined',
      link: joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/user/settings'),
      from: 'team-tmpl',
      section: ['userCenter'],
    },
    {
      id: '/userCenter/did-spaces',
      title: {
        en: 'DID Spaces',
        zh: 'DID Spaces',
      },
      icon: 'ant-design:cloud-outlined',
      link: joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/user/did-spaces'),
      from: 'team-tmpl',
      section: ['userCenter'],
    },
    {
      id: '/userCenter/user-followers',
      title: {
        en: 'Follow',
        zh: '关注',
      },
      icon: 'ant-design:user-outlined',
      link: joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/user/user-followers'),
      from: 'team-tmpl',
      section: ['userCenter'],
    },
  ],
};

function isSameNavigation(a, b) {
  if (a.section && b.section) {
    return a.section === b.section && a.id === b.id;
  }
  return a.id === b.id;
}

const createNavigationItem = (id, title, icon, link, visible = true) => ({
  id,
  from: 'team-tmpl',
  title,
  icon,
  link: joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, link),
  visible,
});

const createNavigationSection = (id, title, items) => ({
  id,
  from: 'team-tmpl',
  title,
  role: ['owner', 'admin', 'member'],
  section: ['dashboard'],
  link: '',
  items,
});

// 让 Navigation 功能支持显示内置的 Dashboard 链接
const ensureServiceNavigation = (t, input) => {
  const navigation = cleanOldNavigationHistory(input);

  // @compatibility 移除旧版 /team 数据
  const teamIndex = navigation.findIndex((x) => x.id === NAV_GROUP_TEAM);
  if (teamIndex >= 0) {
    navigation.splice(teamIndex, 1);
  }

  // 添加内置的 Services 导航
  const servicesIndex = navigation.findIndex((x) => x.id === NAV_GROUP_SERVICES);
  if (servicesIndex === -1) {
    navigation.unshift(
      createNavigationSection(NAV_GROUP_SERVICES, t('navigation.services'), [
        createNavigationItem('did-connect', t('navigation.didConnect'), 'tabler:users', '/admin/did-connect'),
        createNavigationItem('website', t('navigation.website'), 'icon-park-twotone:upload-web', '/admin/website'),
        createNavigationItem(
          'notification',
          t('navigation.notification'),
          'ant-design:bell-outlined',
          '/admin/notification'
        ),
        createNavigationItem('aigne', t('navigation.aigne'), 'hugeicons:artificial-intelligence-04', '/admin/aigne'),
        createNavigationItem(
          'did-spaces',
          t('navigation.didSpaces'),
          'icon-park-outline:cloud-storage',
          '/admin/did-spaces'
        ),
        createNavigationItem(
          'studio',
          t('navigation.studio'),
          'eos-icons:subscriptions-created-outlined',
          '/admin/publish/publish'
        ),
      ])
    );
  }

  // 添加内置的 System 导航
  const systemIndex = navigation.findIndex((x) => x.id === NAV_GROUP_SYSTEM);
  if (systemIndex === -1) {
    navigation.unshift(
      createNavigationSection(NAV_GROUP_SYSTEM, t('navigation.system'), [
        createNavigationItem('dashboard', t('navigation.dashboard'), 'ant-design:dashboard-outlined', '/admin'),
        createNavigationItem('operation', t('navigation.operations'), 'grommet-icons:configure', '/admin/operations'),
        createNavigationItem('integration', t('navigation.integration'), 'hugeicons:webhook', '/admin/integrations'),
      ])
    );
  }

  return navigation;
};

// 将 Uninstalled 组件移到外部
function Uninstalled({ name }) {
  return (
    <Chip
      label={`Uninstalled: ${name}`}
      color="error"
      size="small"
      variant="outlined"
      sx={{ fontSize: 10, height: 20 }}
    />
  );
}

export function NavigationProvider({ children }) {
  const { blocklet, actions } = useBlockletContext();
  const { t } = useLocaleContext();

  const { navigationList, components, builtinList } = parseNavigation(blocklet, {
    beforeProcess(rawList) {
      const copyList = cloneDeep(rawList);
      ['dashboard', 'userCenter'].forEach((section) => {
        if (Object.prototype.hasOwnProperty.call(injectNavigationData, section)) {
          injectNavigationData[section].forEach((item) => {
            const shouldDisplayFn =
              item.shouldDisplay && typeof item.shouldDisplay === 'function' ? item.shouldDisplay : () => true;
            if (shouldDisplayFn(blocklet) && !copyList.some((x) => x.id === item.id)) {
              copyList.push(item);
            }
          });
        }
      });
      return ensureServiceNavigation(t, copyList);
    },
  });

  const state = useReactive({
    rawNavigation: cloneDeep(navigationList),
    activeSection: DEFAULT_SECTION,
    components,
  });

  const navigation = useMemo(() => {
    return sortRootNavigation(nestNavigationList(cloneDeep(state.rawNavigation)));
  }, [state.rawNavigation]);

  const treeNavigation = useMemo(() => {
    const rawData = filterNavigation(cloneDeep(state.rawNavigation), components);
    const navigationWithLink = joinLink(rawData, components);
    return navigationWithLink;
  }, [components, state.rawNavigation]);

  const getNavigationFullLink = useCallback(
    (navigationItem) => {
      if (!navigationItem.id) return '';

      const fullList = flattenNavigation(joinLink(navigation, components));
      const findItem = fullList.find((item) => item.id === navigationItem.id);

      if (findItem?.component) {
        if (!components.some((x) => x.name === findItem.component)) {
          return <Uninstalled name={findItem.component} />;
        }
      } else if (findItem.parent) {
        const parent = fullList.find((x) => x.id === findItem.parent);
        if (parent?.component) {
          if (!components.some((x) => x.name === parent.component)) {
            return <Uninstalled name={parent.component} />;
          }
        }
      }
      return findItem?.link;
    },
    [navigation, components]
  );

  const updateActiveSection = useCallback(
    (activeSection) => {
      state.activeSection = activeSection;
    },
    [state]
  );

  const updateNavigationTree = useCallback(
    (tree) => {
      const list = [];

      deepWalk(tree, (treeItem, parent) => {
        const tmpData = {
          ...omit(treeItem, ['children', 'expand']),
          parent: parent?.id,
        };
        list.push(tmpData);
      });
      const unchangedNavigation = cloneDeep(state.rawNavigation).filter((item) => {
        if (!state.activeSection) {
          return false;
        }

        const findItem = list.find((v) => isSameNavigation(v, item));
        if (findItem) {
          return !isMatchSection(findItem.section, state.activeSection);
        }
        return true;
      });
      state.rawNavigation = [...unchangedNavigation, ...list];
    },
    [state]
  );

  const _saveNavigationChange = useCallback(
    (changed = []) => {
      const updatedNavigation = cloneDeep(state.rawNavigation).map((item) => {
        const findChanged = changed.find((changeItem) =>
          isSameNavigation({ ...changeItem, section: state.activeSection }, item)
        );
        if (findChanged) {
          return {
            ...item,
            ...findChanged,
          };
        }
        return item;
      });
      state.rawNavigation = updatedNavigation;
    },
    [state]
  );

  const navigation2tree = useCallback(
    (list, baseLink = BASE_LINK) => {
      const tree = list.map((item) => {
        const findComponent = components.find((componentItem) => componentItem.name === item.component);
        const base = findComponent?.link || baseLink;
        const items = item.items || [];
        const { link } = item;

        return {
          title: item.title,
          description: item.description,
          subtitle: getNavigationFullLink(item),
          link,
          icon: item.icon,
          children: navigation2tree(items, link || BASE_LINK),
          section: item.section,
          visible: item.visible,
          parent: item.parent,
          component: item.component,
          id: item.id,
          role: item.role,
          from: item.from,
          __base: base,
        };
      });
      return tree;
    },
    [components, getNavigationFullLink]
  );

  const updateNavigationItem = useCallback(
    (itemData) => {
      _saveNavigationChange([itemData]);
    },
    [_saveNavigationChange]
  );

  const delNavigationItem = useCallback(
    (id) => {
      const relatedNavigationId = state.rawNavigation
        .filter((item) => item.id === id || item.parent === id)
        .map((item) => item.id);

      state.rawNavigation = cloneDeep(state.rawNavigation).filter((item) => !relatedNavigationId.includes(item.id));
    },
    [state]
  );

  const addNavigationItem = useCallback(
    (params = {}, index = -1) => {
      const data = {
        ...params,
        id: nanoid(),
        section: state.activeSection,
        visible: true,
      };

      const newNavigation = [...state.rawNavigation];

      // index 是相对于当前 section 下的 navItems
      const activeNavItems = newNavigation.filter((item) => item.section === state.activeSection);
      if (index < 0 || index > activeNavItems.length - 1) {
        newNavigation.push(data);
      } else {
        const anchor = activeNavItems[index];
        const rawIndex = newNavigation.findIndex((item) => isSameNavigation(item, anchor));

        newNavigation.splice(rawIndex, 0, data);
      }

      state.rawNavigation = newNavigation;

      return data;
    },
    [state]
  );

  const getNavigation = useCallback(
    (section) => {
      const copyNavigation = cloneDeep(navigation);
      const filteredSectionNavigation = copyNavigation.filter((item) => {
        return isMatchSection(item.section, section);
      });
      return navigation2tree(filteredSectionNavigation);
    },
    [navigation, navigation2tree]
  );

  const saveNavigationList = useCallback(
    async (list) => {
      const data = list.map((item) => {
        return omitBy(item, isNil);
      });
      const formartedData = data.map((item) => {
        const tempData = { ...item };
        if (tempData.role && Array.isArray(tempData.role)) {
          tempData.role = JSON.stringify(tempData.role);
        }
        if (tempData.section && Array.isArray(tempData.section)) {
          tempData.section = JSON.stringify(tempData.section);
        }
        if (tempData.title && tempData.title instanceof Object) {
          tempData.title = JSON.stringify(tempData.title);
        }
        if (tempData.description && tempData.description instanceof Object) {
          tempData.description = JSON.stringify(tempData.description);
        }
        if (tempData.link && tempData.link instanceof Object) {
          tempData.link = JSON.stringify(tempData.link);
        }
        return tempData;
      });
      await actions.configNavigations(formartedData);
    },
    [actions]
  );

  const resetNavigation = useCallback(
    async (section) => {
      // 只重置指定 section 的导航数据
      if (section) {
        const sectionBuiltinItems = builtinList.filter((item) => isMatchSection(item.section, section));
        const otherNavigationItems = state.rawNavigation.filter((item) => !isMatchSection(item.section, section));

        await saveNavigationList(otherNavigationItems);
        state.rawNavigation = [...otherNavigationItems, ...sectionBuiltinItems];
      } else {
        // 重置所有导航数据
        await saveNavigationList([]);
        state.rawNavigation = cloneDeep(builtinList);
      }
    },
    [saveNavigationList, state, builtinList]
  );

  // 使用 useMemo 优化 Context value
  const value = useMemo(
    () => ({
      state,
      navigation: treeNavigation,
      components,
      getNavigationFullLink,
      updateActiveSection,
      updateNavigationItem,
      delNavigationItem,
      addNavigationItem,
      updateNavigationTree,
      getNavigation,
      saveNavigationList,
      resetNavigation,
    }),
    [
      state,
      treeNavigation,
      components,
      getNavigationFullLink,
      updateActiveSection,
      updateNavigationItem,
      delNavigationItem,
      addNavigationItem,
      updateNavigationTree,
      getNavigation,
      saveNavigationList,
      resetNavigation,
    ]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
