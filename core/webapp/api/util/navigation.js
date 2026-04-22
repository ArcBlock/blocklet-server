const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { WELLKNOWN_SERVICE_PATH_PREFIX, WELLKNOWN_BLOCKLET_ADMIN_PATH } = require('@abtnode/constant');
const { NAV_GROUP_SERVICES, NAV_GROUP_SYSTEM, NAV_GROUP_TEAM } = require('@blocklet/constant');
const {
  joinLink,
  parseNavigation,
  filterNavigation,
  cleanOldNavigationHistory,
  sortRootNavigation,
  splitNavigationBySection,
} = require('@blocklet/meta/lib/parse-navigation-from-blocklet');
const { parseNavigation: parseNavigationOld } = require('@blocklet/meta/lib/parse-navigation');
const { joinURL } = require('ufo');
const { getLocaleMap: t } = require('../locales');

const isDashboardNavigation = x => (Array.isArray(x.section) ? x.section : [x.section]).includes('dashboard');
const ADMIN_ROLES = ['owner', 'admin'];
const ALL_ROLES = ['owner', 'admin', 'member'];

const createNavigationItem = (role, id, title, icon, link, isPrivate = false, visible = true) => ({
  id,
  from: 'team-tmpl',
  title,
  icon,
  role,
  link: joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, link),
  isPrivate,
  visible,
});

const createUserCenterNavigationItem = (id, title, icon, link, isPrivate = false) => ({
  id,
  from: 'team-tmpl',
  title,
  icon,
  role: [],
  link: joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, link),
  section: ['userCenter'],
  isPrivate,
});

const createNavigationSection = (id, title, items) => ({
  id,
  from: 'team-tmpl',
  title,
  role: ALL_ROLES,
  section: ['dashboard'],
  link: '',
  items,
});

const ensureServiceNavigation = input => {
  const navigation = cleanOldNavigationHistory(input);

  const teamIndex = navigation.findIndex(x => x.id === NAV_GROUP_TEAM);

  // @compatibility 移除旧版 /team 数据
  if (teamIndex >= 0) {
    navigation.splice(teamIndex, 1);
  }

  // 添加内置 Services 服务
  const servicesIndex = navigation.findIndex(x => x.id === NAV_GROUP_SERVICES);
  const servicesNavigation = createNavigationSection(NAV_GROUP_SERVICES, t('navigation.services'), [
    createNavigationItem(ADMIN_ROLES, 'did-connect', t('navigation.didConnect'), 'tabler:users', '/admin/did-connect'),
    createNavigationItem(
      ADMIN_ROLES,
      'website',
      t('navigation.website'),
      'icon-park-twotone:upload-web',
      '/admin/website'
    ),
    createNavigationItem(
      ADMIN_ROLES,
      'notification',
      t('navigation.notification'),
      'ant-design:bell-outlined',
      '/admin/notification'
    ),
    createNavigationItem(
      ADMIN_ROLES,
      'aigne',
      t('navigation.aigne'),
      'hugeicons:artificial-intelligence-04',
      '/admin/aigne'
    ),
    createNavigationItem(
      ADMIN_ROLES,
      'did-spaces',
      t('navigation.didSpaces'),
      'icon-park-outline:cloud-storage',
      '/admin/did-spaces'
    ),
    createNavigationItem(
      ALL_ROLES,
      'studio',
      t('navigation.studio'),
      'eos-icons:subscriptions-created-outlined',
      '/admin/publish/publish',
      false
    ),
  ]);

  if (servicesIndex === -1) {
    navigation.unshift(servicesNavigation);
  } else {
    navigation.splice(servicesIndex, 1, servicesNavigation);
  }

  // 添加内置 System 服务
  const systemIndex = navigation.findIndex(x => x.id === NAV_GROUP_SYSTEM);
  const systemNavigation = createNavigationSection(NAV_GROUP_SYSTEM, t('navigation.system'), [
    createNavigationItem(
      ALL_ROLES,
      'dashboard',
      t('navigation.dashboard'),
      'ant-design:dashboard-outlined',
      '/admin/overview'
    ),
    createNavigationItem(
      ADMIN_ROLES,
      'operations',
      t('navigation.operations'),
      'grommet-icons:configure',
      '/admin/operations'
    ),
    createNavigationItem(
      ADMIN_ROLES,
      'integration',
      t('navigation.integration'),
      'hugeicons:webhook',
      '/admin/integrations'
    ),
  ]);
  if (systemIndex === -1) {
    navigation.unshift(systemNavigation);
  } else {
    navigation.splice(systemIndex, 1, systemNavigation);
  }

  return navigation;
};

const ensureUserCenterNavigation = (navigation, blocklet = {}) => {
  // 添加 notification, profile(base info), setting.
  navigation.push(
    createUserCenterNavigationItem(
      '/userCenter/notification',
      t('navigation.notifications'),
      'ant-design:bell-outlined',
      '/user/notifications',
      true // 不需要对外公开
    )
  );
  // 如果没有开启 org，则不显示 orgs 菜单
  if (blocklet.settings?.org?.enabled) {
    navigation.push(
      createUserCenterNavigationItem(
        '/userCenter/orgs',
        t('navigation.orgs'),
        'ant-design:team-outlined',
        '/user/orgs',
        true // 不需要对外公开
      )
    );
  }

  // 个人中心处默认菜单 [nftTab, settingsTab, didSpacesTab, userFollowersTab]
  navigation.push(
    createUserCenterNavigationItem(
      '/userCenter/nfts',
      t('navigation.nfts'),
      'ant-design:gold-outlined',
      '/user/nfts',
      false // 可以对外公开
    )
  );
  navigation.push(
    createUserCenterNavigationItem(
      '/userCenter/settings',
      t('navigation.settings'),
      'ant-design:setting-outlined',
      '/user/settings',
      true // 不需要对外公开
    )
  );
  navigation.push(
    createUserCenterNavigationItem(
      '/userCenter/did-spaces',
      t('navigation.didSpaces'),
      'ant-design:cloud-outlined',
      '/user/did-spaces',
      true // 不需要对外公开
    )
  );
  navigation.push(
    createUserCenterNavigationItem(
      '/userCenter/user-followers',
      t('navigation.userFollowers'),
      'ant-design:user-outlined',
      '/user/user-followers',
      false // 可以对外公开
    )
  );
};

const ensureSessionManagerNavigation = navigation => {
  if (!navigation.some(x => (x.section || []).includes('sessionManager'))) {
    navigation.push({
      id: '/sessionManager',
      from: 'team-tmpl',
      title: t('navigation.dashboard'),
      section: ['sessionManager'],
      icon: 'ion:settings-outline',
      link: `${WELLKNOWN_BLOCKLET_ADMIN_PATH}/overview`,
      role: ['owner', 'admin'],
    });
  }
};

const cleanDirtyData = navigation => {
  const accessIndex = navigation.findIndex(x => x.id === '/access');
  if (accessIndex >= 0) {
    navigation.splice(accessIndex, 1);
  }
};

const getBlockletNavigation = (blocklet, groupPathPrefix = '/') => {
  let navigation = [];
  const { navigationList, components } = parseNavigation(blocklet, {
    beforeProcess(rawList) {
      const copyList = ensureServiceNavigation(cloneDeep(rawList));
      ensureUserCenterNavigation(copyList, blocklet);
      if (!copyList.some(x => x.id && (x.section || []).includes('sessionManager'))) {
        ensureSessionManagerNavigation(copyList);
      }
      return copyList;
    },
  });

  // HACK: 如果新的方案未找到任何 navigations，则回滚回原有的方式找 navigation（新的方案需要每一个菜单都有 id，没有 id 的会自动过滤掉，此方案为一个过渡方案）
  const cleanList = navigationList.filter(item => item.from !== 'team-tmpl');
  if (cleanList.length === 0) {
    navigation = parseNavigationOld(blocklet.meta?.navigation || [], blocklet, groupPathPrefix);
    navigation = ensureServiceNavigation(navigation);
    ensureUserCenterNavigation(navigation, blocklet);
    ensureSessionManagerNavigation(navigation);
    navigation = splitNavigationBySection(navigation);
  } else {
    navigation = filterNavigation(navigationList, components);
    navigation = joinLink(navigation, components);
  }
  cleanDirtyData(navigation);
  // HACK: 兼容之前 notification 没有设置 private 的情况
  // 不知道在什么情况更新 blocklet.settings 时把 private 丢失，这里强制设置为私有
  navigation.forEach(x => {
    if (
      ['/userCenter/orgs', '/userCenter/notification', '/userCenter/settings', '/userCenter/did-spaces'].includes(x.id)
    ) {
      x.isPrivate = true;
    }
  });
  return sortRootNavigation(navigation);
};

module.exports = {
  ensureServiceNavigation,
  ensureSessionManagerNavigation,
  ensureUserCenterNavigation,
  isDashboardNavigation,
  getBlockletNavigation,
};
