// @ts-ignore
import { NAVIGATION_I18N_FIELDS } from '@abtnode/constant';
import { NAV_GROUP_SERVICES, NAV_GROUP_SYSTEM, NAV_GROUP_TEAM } from '@blocklet/constant';
import unionWith from 'lodash/unionWith';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import isNil from 'lodash/isNil';
import get from 'lodash/get';
import omit from 'lodash/omit';
import cloneDeep from 'lodash/cloneDeep';
import { joinURL } from 'ufo';
import path from 'path';
import isAbsoluteUrl from 'is-absolute-url';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import partition from 'lodash/partition';

import { hasStartEngine } from './engine';
import { checkLink } from './url-path-friendly';

const DEFAULT_SECTION = 'header';
const BASE_PATH = '/';
const DEFAULT_LINK = '/';
const ID_SEPARATE = '/';

type SectionType =
  | 'header'
  | 'footer'
  | 'bottom'
  | 'social'
  | 'dashboard'
  | 'sessionManager'
  | 'userCenter'
  | 'bottomNavigation';

interface DeepWalkCallbackOptions {
  index: number;
  level: number;
}

interface DeepWalkCallback {
  (current, parent, options: DeepWalkCallbackOptions): void;
}

/**
 *
 * @param tree The tree structure to traverse
 * @param cb Callback for each node; receives (node, parent, {index, key, level})
 * @param param Traversal options
 * @param param.key Key name for the children array
 * @param param.index Index of the current node in its parent's children array
 * @param param.parent Parent node of the current node
 * @param param.level Depth of the current node
 */
type TreeNode<K extends string> = Record<string, any> & {
  [key in K]?: TreeNode<K>[];
};

function deepWalk<K extends string>(
  tree: TreeNode<K>,
  cb: DeepWalkCallback,
  { key, order }: { key: K; order?: 'first' | 'last' }
): void;
function deepWalk(
  tree: TreeNode<'children'>,
  cb: DeepWalkCallback,
  { key, order }?: { key?: 'children'; order?: 'first' | 'last' }
): void;
function deepWalk(
  tree: TreeNode<'children'>,
  cb: DeepWalkCallback = () => {},
  { key = 'children', order = 'first' }: { key?: 'children'; order?: 'first' | 'last' } = {}
): void {
  function walk(current, { index = 0, parent = null, level = 0 } = {}) {
    if (Array.isArray(current)) {
      current.forEach((item, i) => {
        walk(item, { index: i, parent, level: level + 1 });
      });
    } else if (current) {
      if (order === 'first') {
        cb(current, parent, { index, level });
      }
      walk(current[key], { parent: current, level });
      if (order === 'last') {
        cb(current, parent, { index, level });
      }
    }
  }
  walk(tree);
}
/**
 * Determine whether a value belongs to the given section
 * @param sections The sections to check against
 * @param section The target section
 */
function isMatchSection(sections: SectionType[] | SectionType, section: SectionType) {
  if (section === DEFAULT_SECTION && isNil(sections)) {
    return true;
  }
  if (Array.isArray(sections)) {
    return sections.includes(section);
  }
  return sections === section;
}

function tryParseItem(item) {
  try {
    return JSON.parse(item);
  } catch {
    return item;
  }
}

export interface NavigationItem {
  id: string;
  role?: string;
  section?: SectionType;
  title?: string;
  description?: string;
  link?: string;
  items?: NavigationItem[];
  component?: string;
  child?: string;
  [key: string]: any;
}

function normalizeNavigationList(navigationList: NavigationItem[]) {
  return navigationList.map((item) => {
    const tempData = { ...item };
    if (tempData.role) {
      tempData.role = tryParseItem(tempData.role);
    }
    if (tempData.section) {
      tempData.section = tryParseItem(tempData.section);
    }
    if (tempData.title) {
      tempData.title = tryParseItem(tempData.title);
    }
    if (tempData.description) {
      tempData.description = tryParseItem(tempData.description);
    }
    if (tempData.link) {
      tempData.link = tryParseItem(tempData.link);
    }
    return tempData;
  });
}

function optionalJoin(prefix: string = '/', url: string = '') {
  if (isAbsoluteUrl(url || '')) {
    return url;
  }
  // remove last slash
  const resultUrl = path.join(prefix, url || DEFAULT_LINK);
  if (resultUrl.length > 1 && resultUrl.endsWith('/')) {
    return resultUrl.slice(0, resultUrl.length - 1);
  }
  return resultUrl;
}

function smartJoinLink(
  _parentLink: string,
  _childLink: string,
  {
    strict = true,
  }: {
    strict?: boolean;
  } = {}
) {
  let parentLink = _parentLink;
  let childLink = _childLink;
  if (!strict) {
    parentLink = parentLink || '/';
    childLink = childLink || '/';
  }
  if (isObject(parentLink) && isString(childLink) && checkLink(childLink)) {
    return Object.keys(parentLink).reduce((res, key) => {
      res[key] = optionalJoin(parentLink[key], childLink);
      return res;
    }, {});
  }
  if (isString(parentLink) && checkLink(parentLink) && isObject(childLink)) {
    return Object.keys(childLink).reduce((res, key) => {
      res[key] = optionalJoin(parentLink, childLink[key]);
      return res;
    }, {});
  }
  if (isString(parentLink) && isString(childLink)) {
    if (checkLink(parentLink) || checkLink(childLink)) {
      return optionalJoin(parentLink, childLink);
    }
    return childLink;
  }
  if (isObject(parentLink) && isObject(childLink)) {
    const keys = [...new Set([...Object.keys(parentLink), ...Object.keys(childLink)])];
    return keys.reduce((res, key) => {
      res[key] = optionalJoin(parentLink[key], childLink[key]);
      return res;
    }, {});
  }
  return childLink;
}

interface ComponentItem {
  name: string;
  link: string;
}

function joinLink(navigation: NavigationItem, components: ComponentItem[]) {
  const copyNavigation = cloneDeep(navigation);
  deepWalk(
    copyNavigation,
    (item, parent) => {
      const component = item.component || item.child;
      if (component) {
        const findComponent = components.find((v) => v.name === component);
        if (findComponent) {
          item.link = smartJoinLink(findComponent.link, item.link, { strict: false });
        }
      } else if (parent) {
        item.link = smartJoinLink(parent.link, item.link);
      }
    },
    { key: 'items' }
  );
  return copyNavigation;
}

interface FlatternNavigationOption {
  transform?: (current: any, parent?: any) => any;
  depth?: number;
}

/**
 * Flatten a tree-structured navigation list
 * @param navigationList Tree-structured navigation list
 * @param params Traversal options
 * @param params.depth Flatten depth; default 1 (fully flat)
 * @param params.transform Transform function called during flattening
 * @returns Flattened navigation list
 */
function flattenNavigation(
  list: NavigationItem[] = [],
  { depth = 1, transform = (v) => v }: FlatternNavigationOption = {}
) {
  const copyList = cloneDeep(list);
  const finalList = [];
  deepWalk(
    copyList,
    (item, parent, { level }) => {
      if (level >= depth) {
        const { items = [] } = item;
        if (items && Array.isArray(items) && items.length > 0) {
          delete item.items;
          const transformedItems = items.map((v) => transform(v, item));
          if (parent) {
            parent.items.push(...transformedItems);
          } else {
            const tmpItem = transform(omit(item, ['items']), parent);
            finalList.push(tmpItem, ...transformedItems);
          }
        } else if (level === 1) {
          const tmpItem = transform(omit(item, ['items']), parent);
          finalList.push(tmpItem);
        }
      } else if (level === 1) {
        finalList.push(item);
      }
    },
    { key: 'items', order: 'last' }
  );
  return finalList;
}

/**
 * Normalize i18n fields in bottomNavigation items to { locale: value } format
 * @param item The navigation item to normalize
 * @returns Normalized navigation item
 */
function normalizeI18nFields(item: NavigationItem): NavigationItem {
  // Return the item unchanged if it is not a bottomNavigation item
  if (item.section !== 'bottomNavigation') {
    return item;
  }

  const result = { ...item };
  NAVIGATION_I18N_FIELDS.forEach((field) => {
    const value = result[field];
    if (typeof value === 'string') {
      // If the value is a plain string, convert it to { en: value } format
      result[field] = { en: value };
    }
  });
  return result;
}

/**
 * Process blocklet data to produce navigation and component data for the current app
 * @param blocklet Blocklet app instance data
 * @returns Navigation and component data
 */
function parseBlockletNavigationList(blocklet = {}) {
  const components = [];

  /**
   *
   * @param current Current blocklet data
   * @param parent Parent component data of the current blocklet
   * @returns
   */
  function genNavigationListByBlocklet(
    current,
    parent: {
      name?: string;
      mountPoint?: string;
    } = {}
  ) {
    const targetList = [];
    const { children = [], meta = {} } = current;
    const navigation = cloneDeep(meta?.navigation || []);
    if (hasStartEngine(meta) && current.meta?.capabilities?.navigation !== false) {
      targetList.push(...navigation);
    }
    const parentName = parent.name || '';
    const parentBase = parent.mountPoint || BASE_PATH;
    const currentName = current === blocklet ? '' : meta.name || '';
    const currentBase = current === blocklet ? '' : current.mountPoint || BASE_PATH;

    for (const child of children) {
      if (!hasStartEngine(child.meta)) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const childName = child.meta.name;
      const childBase = child.mountPoint;
      const mergeName = [parentName, currentName, childName].filter(Boolean).join('.');
      const childNavigation = child.meta.navigation || [];
      const mergeBase = joinURL(parentBase, currentBase, childBase);
      if (child.meta?.capabilities?.navigation !== false) {
        components.push({
          did: child.meta.did,
          name: mergeName,
          link: mergeBase,
          title: child.meta.title || '',
          navigation: childNavigation.map((item) => ({
            // Assign a section to each navigation item as the basis for section-based filtering
            section: DEFAULT_SECTION,
            ...item,
          })),
        });
      }
      // Check if any existing navigation item references this component as a child
      const matchNavigation = navigation.find((item) => {
        if (item.component) {
          return item.component === childName;
        }
        return false;
      });
      // If a match exists and it has no link, assign the child's mount point
      if (matchNavigation) {
        if (!matchNavigation.link) {
          if (child.meta.navigation && child.meta.navigation.length > 0) {
            const items = genNavigationListByBlocklet(child, { mountPoint: currentBase, name: currentName });
            if (items.length > 0) {
              matchNavigation.items = matchNavigation.items ?? [];
              matchNavigation.items.push(...items);
            }
          } else {
            matchNavigation.link = DEFAULT_LINK;
          }
        }
      } else if (child.meta?.capabilities?.navigation !== false) {
        const childItems = genNavigationListByBlocklet(child, { mountPoint: currentBase, name: currentName });
        // Otherwise, dynamically inject a navigation item
        const tmpData: {
          title: string;
          component: string;
          id?: string;
          items?: any[];
          link?: string;
        } = {
          title: child.meta.title,
          component: childName,
          // Dynamically injected items need a default id; blocklet.meta.did is unique and suitable
          id: child.meta.did,
        };
        if (childItems.length > 0) {
          tmpData.items = childItems;
          tmpData.link = undefined;
        } else {
          tmpData.link = DEFAULT_LINK;
        }
        targetList.push(tmpData);
      }
    }
    return targetList;
  }
  const navigationList = genNavigationListByBlocklet(blocklet);

  return {
    navigationList,
    components,
  };
}

function patchBuiltinNavigation(navigation: NavigationItem[]) {
  const copyNavigation = cloneDeep(navigation).filter((item) => item.id);
  deepWalk(
    copyNavigation,
    (item, parent) => {
      if (item.items && item.items.length) {
        for (let i = item.items.length - 1; i >= 0; i--) {
          if (!item.items[i].id) {
            item.items.splice(i, 1);
          }
        }
        // If none of the child items are valid, keep the parent item and assign a default link
        if (item.items.length === 0) {
          if (item.component) {
            item.link = item.link || DEFAULT_LINK;
          }
        }
      }
      if (parent) {
        item.parent = parent.id;
        // Prefixing with the parent ID greatly reduces ID collision risk
        item.id = [parent.id, item.id].join(ID_SEPARATE);
      }
      item.from = item.from || 'yaml';
      item.visible = item.visible ?? true;
    },
    { key: 'items' }
  );
  return copyNavigation;
}

/**
 * Compact a multi-level navigation list to the specified maximum depth
 * @param navigation Tree-structured navigation list
 * @param depth Maximum depth to compact to
 * @returns Compacted tree-structured navigation list
 */
function compactNavigation(navigation, depth = 2): NavigationItem[] {
  const copyNavigation = cloneDeep(navigation);
  const resData = flattenNavigation(copyNavigation, {
    depth,
    transform: (item, parent) => {
      if (parent) {
        if (!item._parent) {
          item._parent = parent.id;
          if (!parent.component) {
            item.link = smartJoinLink(parent.link, item.link);
          }
        }
        item.section = item.section || parent.section || [DEFAULT_SECTION];
        item.visible = item.visible ?? parent.visible;
        if (parent.role) {
          // Inherit the parent's role
          item.role = item.role || parent.role;
        }
      }
      item.component = [parent.component, item.component].filter(Boolean).join('.');
      return item;
    },
  });
  deepWalk(
    resData,
    (item) => {
      if (item.items && item.items.length > 0) {
        item.items.reduceRight((all, cur) => {
          if (cur._parent) {
            const index = item.items.findIndex((v) => v.id === cur._parent);
            if (index >= 0) {
              item.items.splice(index, 1);
            }
            delete cur._parent;
          }
          return null;
        }, null);
      }
    },
    { key: 'items' }
  );
  return resData;
}

/**
 * Get child menu items of a navigation item that belong to the specified section
 * @param navigationItem The navigation item to inspect
 * @param section The target section
 * @returns
 */
function getNavigationListBySection(navigationItem: NavigationItem, section: SectionType) {
  if (section && Array.isArray(navigationItem.items)) {
    return navigationItem.items
      .filter((item) => {
        // If a child item has no section, it inherits the parent's section
        if (isNil(item.section)) {
          return isMatchSection(navigationItem.section, section);
        }
        if (isMatchSection(item.section, section)) {
          return true;
        }
        return false;
      })
      .map((item) => ({ ...item, section }));
  }
  return [];
}

/**
 * Split a navigation item into multiple entries, one per section
 * @param navigation Navigation list (tree; currently only two-level trees are supported)
 * @returns
 */
function splitNavigationBySection(navigation: NavigationItem[]) {
  const copyNavigation = cloneDeep(navigation);
  const allNavigationList = [];
  for (const navigationItem of copyNavigation) {
    const baseNavigation = cloneDeep(omit(navigationItem, ['items']));
    const itemNavigationList = [];
    // eslint-disable-next-line no-inner-declarations
    function patchNavigationItem(item, section) {
      const sectionNavigationList = getNavigationListBySection(item, section);
      itemNavigationList.push({
        ...baseNavigation,
        section,
        items: sectionNavigationList,
      });
    }
    if (Array.isArray(navigationItem.section)) {
      for (const section of navigationItem.section) {
        patchNavigationItem(navigationItem, section);
      }
    } else if (navigationItem.section) {
      const { section } = navigationItem;
      patchNavigationItem(navigationItem, section);
    } else if (navigationItem.items && navigationItem.items.length > 0) {
      const allSectionList = navigationItem.items.reduce((list, currentValue) => {
        const { section = [DEFAULT_SECTION] } = currentValue || {};
        list.push(...section);
        return list;
      }, []);
      const sectionList = [...new Set(allSectionList)];
      for (const section of sectionList) {
        patchNavigationItem(navigationItem, section);
      }
    } else {
      itemNavigationList.push({
        ...navigationItem,
        section: DEFAULT_SECTION,
      });
    }
    allNavigationList.push(...itemNavigationList);
  }
  return allNavigationList;
}

/**
 * Nest a flat navigation list back into a hierarchical structure
 * @param list Flat navigation list
 * @returns Nested navigation structure
 */
function nestNavigationList(list = []) {
  const cloneList = cloneDeep(list);
  cloneList.reduceRight((res, item, index) => {
    if (item.parent) {
      const parent = cloneList.find((i) => {
        if (item.section && i.section) {
          return i.section === item.section && i.id === item.parent;
        }
        return i.id === item.parent;
      });
      if (parent) {
        if (!parent.items) parent.items = [];
        // reduceRight traverses from back to front, so later-visited items end up at the front
        parent.items = [item, ...parent.items];
      }
      cloneList.splice(index, 1);
    }
    return null;
  }, null);
  return cloneList;
}

function filterNavigation(navigationList: NavigationItem[], components: ComponentItem[] = []) {
  const nestedNavigation = nestNavigationList(navigationList);
  deepWalk(
    nestedNavigation,
    (item) => {
      if (item?.component) {
        if (!components.some((x) => x.name === item.component)) {
          item.visible = false;
        }
      }
      if (item.items && item.items.length) {
        for (let i = item.items.length - 1; i >= 0; i--) {
          if (item.items[i].visible === false) {
            item.items.splice(i, 1);
          }
        }
      }
    },
    { key: 'items' }
  );
  const filteredNavigation = nestedNavigation.filter((item) => {
    if (item.visible === false) return false;
    // If all children are hidden, the parent item itself should also be hidden
    if (
      item.items &&
      Array.isArray(item.items) &&
      item.items.length > 0 &&
      item.items?.every((v) => v.visible === false)
    )
      return false;
    return true;
  });

  return filteredNavigation;
}

function cleanOrphanNavigation(list: NavigationItem[]) {
  // Promote a menu item with only one child to the parent level
  return list.map((item) => {
    if (item.items && Array.isArray(item.items) && item.items.length === 1) {
      if (['header', 'footer', '', undefined, null].includes(item.section)) {
        return item.items[0];
      }
    }
    return item;
  });
}

interface Blocklet {
  settings?: {
    navigations?: NavigationItem[];
  };
}
interface ParseNavigationOption {
  beforeProcess?: (data: any) => any;
}

const sortRootNavigation = (navigation: NavigationItem[]) => {
  const [system, rest] = partition(navigation, (x) => x.id === NAV_GROUP_SYSTEM);
  const [services, others] = partition(rest, (x) => x.id === NAV_GROUP_SERVICES);
  return [...system, ...services, ...others];
};

// FIXME: Pillar, this is a transitional workaround to clean up legacy navigation data; can be removed later
const cleanOldNavigationHistory = (navigation: NavigationItem[]) => {
  const [, other] = partition(navigation, (x) => {
    const title = typeof x.title === 'string' ? x.title : (x.title as { en: string })?.en;
    // No better discriminating field available here; falling back to title
    return x.id === NAV_GROUP_TEAM || (x.id === '/dashboard' && title === 'Blocklet');
  });

  return other;
};

function parseNavigation(blocklet: Blocklet = {}, options: ParseNavigationOption = {}) {
  const { beforeProcess = (v) => v } = options;
  const { navigationList: builtinNavigation, components } = parseBlockletNavigationList(blocklet);

  const navigationMap = new Map();

  builtinNavigation.forEach((item) => {
    item.items?.forEach((child) => {
      navigationMap.set(joinURL(item.id, child.id), child);
    });
  });

  const orgIsEnabled = get(blocklet, 'settings.org.enabled', false);
  const internalGroupPaths = [NAV_GROUP_TEAM, NAV_GROUP_SYSTEM, NAV_GROUP_SERVICES];

  // Remove default navigation entries already persisted in the database
  if (blocklet?.settings?.navigations) {
    if (!Array.isArray(blocklet.settings.navigations)) {
      blocklet.settings.navigations = [];
    } else {
      blocklet.settings.navigations = [...blocklet.settings.navigations]
        // Filter out built-in navigation entries
        .filter((item) => !(item.from === 'team-tmpl' && internalGroupPaths.includes(item?.parent)))
        .map((item) => {
          // Backward compat: if a stored item lacks 'private' but blocklet.yml defines it, apply blocklet.yml's value
          // The 'private' field is immutable at runtime and only defined in blocklet.yml
          if (item.section === 'userCenter' && !Object.prototype.hasOwnProperty.call(item, 'private')) {
            const target = navigationMap.get(item.id);
            if (target && Object.prototype.hasOwnProperty.call(target, 'private')) {
              item.private = target.private;
            }
          }
          // If orgs are disabled but the userCenter/orgs menu item still exists, remove it
          if (!orgIsEnabled && item.section === 'userCenter' && item.id === '/userCenter/orgs') {
            return null;
          }
          return item;
        })
        .filter(Boolean);
    }
  }

  const customNavigationList = normalizeNavigationList(
    cleanOldNavigationHistory(blocklet?.settings?.navigations || [])
  ).map(normalizeI18nFields);

  const compactedNavigation = compactNavigation(beforeProcess(builtinNavigation));
  const patchedNavigation = patchBuiltinNavigation(compactedNavigation);
  const splitNavigation = splitNavigationBySection(patchedNavigation);
  // Promote second-level items under footer-social, footer-bottom, sessionManager, userCenter to top level
  const levelUpNavigation = splitNavigation.reduce((all, cur) => {
    const shouldLevelUp = ['bottom', 'social', 'sessionManager', 'userCenter'].includes(cur.section);
    // Design update: only footer-social, footer-bottom, sessionManager, userCenter items are promoted; root-blocklet items are not
    if (shouldLevelUp) {
      if (cur.items && cur.items.length > 0) {
        all.push(
          ...cur.items.map((x) => {
            const { section } = cur;
            const link = smartJoinLink(cur.link, x.link);
            const component = [cur.component, x.component].filter(Boolean).join('.');
            return { ...x, section, link, component, parent: '' };
          })
        );
        return all;
      }
    }
    all.push(cur);
    return all;
  }, []);
  const flatNavigation = flattenNavigation(levelUpNavigation, {
    transform(item, parent) {
      let { component } = item;
      if (parent?.component) {
        component = [parent.component, item.component].filter(Boolean).join('.');
      }
      return normalizeI18nFields({ ...item, component });
    },
  });
  const rawNavigation = unionWith(customNavigationList, flatNavigation, (prev, next) => {
    const keys = ['id', 'section'];
    return isEqual(pick(prev, keys), pick(next, keys));
  });
  return { navigationList: rawNavigation, components, builtinList: flatNavigation };
}

export {
  parseNavigation,
  deepWalk,
  isMatchSection,
  nestNavigationList,
  filterNavigation,
  cleanOrphanNavigation,
  joinLink,
  checkLink,
  flattenNavigation,
  splitNavigationBySection,
  cleanOldNavigationHistory,
  sortRootNavigation,
};
