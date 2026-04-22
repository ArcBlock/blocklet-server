import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BlockletState, ComponentState } from '@blocklet/server-js';

import { normalizePathPrefix } from './normalize-path-prefix';
import { TNavigationItem } from './types';

const parseLinkString = (link: string, prefix: string = '') =>
  link.startsWith('/') ? normalizePathPrefix(`${prefix}${link || '/'}`) : link;

const parseLink = (input: string | Object, prefix: string): any => {
  if (Object.prototype.toString.call(input) === '[object Object]') {
    return Object.entries(input).reduce((o, [key, value]) => {
      o[key] = parseLinkString(value, prefix);
      return o;
    }, {});
  }

  return parseLinkString(<string>input, prefix);
};

const getGroups = (navigation: TNavigationItem[]): any => {
  const groups = {};

  for (const nav of navigation) {
    const sections = !nav.section || !nav.section.length ? ['__undefined__'] : nav.section;

    for (const sec of sections) {
      if (!groups[sec]) {
        groups[sec] = [];
      }

      const item = {
        ...nav,
      };

      if (nav.section) {
        // @ts-expect-error
        item.section = sec === '__undefined__' ? [] : [sec];
      }

      groups[sec].push(item);
    }
  }
  return Object.values(groups);
};

const getChildName = (nav) => nav.component || nav.child;

const doParseNavigation = (
  navigation: TNavigationItem[],
  blocklet: BlockletState | ComponentState,
  prefix: string = '/',
  _level: number = 1
): TNavigationItem[] => {
  const result = [];

  (navigation || []).forEach((nav) => {
    if (!getChildName(nav)) {
      if (_level > 1 && nav.items?.length) {
        const list = doParseNavigation(nav.items, blocklet, prefix, _level + 1);

        result.push(...list);
        return;
      }

      const item: TNavigationItem = {
        title: nav.title,
        id: undefined,
      };

      if (nav.description) {
        item.description = nav.description;
      }

      if (nav.section) {
        item.section = nav.section;
      }

      if (nav.icon) {
        item.icon = nav.icon;
      }

      if (nav.link) {
        item.link = parseLink(nav.link, prefix);
      } else {
        item.link = '';
      }

      if (nav.role) {
        item.role = nav.role;
      }

      if (nav.items?.length) {
        const list = doParseNavigation(nav.items, blocklet, prefix, _level + 1);

        if (list.length) {
          item.items = list;
        }
      }

      result.push(item);
      return;
    }

    if (!blocklet) {
      return;
    }

    // parse child
    const child = (blocklet.children || []).find((x) => [x.meta.name, x.meta.did].includes(getChildName(nav)));

    if (!child) {
      return;
    }
    const childTitle = child.meta.title || child.meta.name;

    const itemProto: TNavigationItem = {
      title: nav.title || childTitle,
      id: undefined,
    };

    if (nav.section) {
      itemProto.section = nav.section;
    }

    if (nav.icon) {
      itemProto.icon = nav.icon;
    }

    if (nav.role) {
      itemProto.role = nav.role;
    }

    // get groups by section
    const groups = getGroups(get(child, 'meta.navigation', []) as TNavigationItem[]);

    if (!groups.length) {
      // child does not declares menu
      const item = cloneDeep(itemProto);
      item.link = parseLink(child.mountPoint || '/', prefix);
      result.push(item);
    } else {
      for (const childNavigation of groups) {
        if (childNavigation.length === 1) {
          // child declares one menu
          const childNav = childNavigation[0];

          const item = cloneDeep(itemProto);

          item.title = nav.title || childNav.title || childTitle;

          if (childNav.icon) {
            item.icon = item.icon || childNav.icon;
          }

          if (childNav.role) {
            item.role = item.role || childNav.role;
          }

          if (childNav.section) {
            item.section = item.section || childNav.section;
          }

          item.link = parseLink(childNavigation[0].link || '/', normalizePathPrefix(`${prefix}${child.mountPoint}`));

          // doParseNavigation because child nav depth may be > 1
          const list = doParseNavigation(
            childNavigation,
            child,
            normalizePathPrefix(`${prefix}${child.mountPoint}`),
            _level + 1
          );

          if (list.length > 1) {
            // more than 1 child nav
            delete item.link;
            result.push({
              ...item,
              items: list,
            });
          } else {
            // only 1 child nav
            item.link = list[0].link;
            result.push(item);
          }
        } else {
          // child declares multiple menus
          const groupSection = childNavigation[0].section || [];

          const list = doParseNavigation(
            childNavigation,
            child,
            normalizePathPrefix(`${prefix}${child.mountPoint}`),
            _level + 1
          );

          if (_level === 1) {
            // primary menu
            const item = cloneDeep(itemProto);

            if (groupSection.length) {
              item.section = item.section || groupSection;
            }

            item.items = list;
            result.push({
              ...item,
              items: list,
            });
          } else {
            // secondary menu
            result.push(...list);
          }
        }
      }
    }
  });

  return result;
};

const markDuplicate = (navigation: any, compares: any[] = []) => {
  navigation.forEach((item) => {
    const compare = { link: item.link, section: item.section || [] };

    if (item.link && compares.some((x) => isEqual(x, compare))) {
      item.duplicate = true;
    }
    if (item.link) {
      compares.push(compare);
    }

    if (item.items) {
      markDuplicate(item.items, compares);
    }
  });

  return navigation;
};

const filterDuplicate = (navigation: any[]): any[] => {
  const res = navigation.filter((x) => !x.duplicate);

  res.forEach((item) => {
    if (item.items) {
      item.items = filterDuplicate(item.items);
    }
  });

  return res;
};

const uniq = (navigation) => {
  return filterDuplicate(markDuplicate(navigation));
};

const parseNavigation = (...args: any[]): TNavigationItem[] => {
  // @ts-expect-error
  const res = doParseNavigation(...args);
  return uniq(res).filter((x) => x.link || (x.items && x.items.length));
};

export { parseNavigation };
