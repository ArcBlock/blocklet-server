import { joinURL, withoutLeadingSlash } from 'ufo';
import isUrl from 'is-url';
import { api } from '../../../util/api';

export const API_ENDPOINTS = ['https://api.iconify.design', 'https://api.unisvg.com', 'https://api.simplesvg.com'];

async function tryFetch(path, params, timeout = 5000) {
  for (const endpoint of API_ENDPOINTS) {
    const url = joinURL(endpoint, path);

    try {
      // eslint-disable-next-line no-await-in-loop
      return await api.get(url, { params, timeout });
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
    }
  }
  throw new Error(`All icon API endpoints ${path} failed`);
}

/**
 * 搜索图标
 * @note 目前 iconify search 功能有限，最多只能查询 999 条结果，不具备完整的分页功能
 * @param {Object} options
 * @param {string} options.keyword 关键词
 * @param {number} options.limit 限制数量
 * @param {number} options.start 起始位置
 * @param {number} options.palette 图标颜色 false 表示纯色图标
 * @returns {Promise<{icons: string[], limit: number, total: number}>} 包含图标ID数组、限制数量和总数的对象
 */
export async function searchIcons({ keyword, limit = 999, start = 0, palette = false }) {
  let prefix = '';
  let query = keyword;

  if (keyword.includes(':')) {
    [prefix, query] = keyword.split(':');
  }

  const { data } = await tryFetch('/search', {
    query: `${query} palette=${palette}` || keyword,
    start,
    limit,
    ...(prefix && { prefix }),
  });
  return data;
}

const collectionIconsCache = new Map();

/**
 * 获取指定分类下的图标
 * @param {string} prefix 图标集前缀,如 'mdi'
 * @returns {Promise<string[]>} 图标 ID 数组
 */
export async function fetchIconsByCollection(prefix) {
  // 命中缓存
  if (collectionIconsCache.has(prefix)) {
    return collectionIconsCache.get(prefix);
  }

  // 创建一个新的 Promise 并立即缓存
  const fetchPromise = (async () => {
    const { data } = await tryFetch('/collection', { prefix });
    const iconSet = new Set();
    // 将图标名称转换为完整的图标ID
    data.uncategorized?.forEach((name) => iconSet.add(`${prefix}:${name}`));
    Object.values(data.categories ?? {}).forEach((category) => {
      category.forEach((name) => iconSet.add(`${prefix}:${name}`));
    });

    return Array.from(iconSet);
  })();

  collectionIconsCache.set(prefix, fetchPromise);

  try {
    return await fetchPromise;
  } catch (error) {
    // 若失败，从缓存中移除
    collectionIconsCache.delete(prefix);
    throw error;
  }
}

/**
 * 获取图标预览 URL
 * @param {string} iconId 图标 ID
 * @returns {string} 图标预览 URL
 */
export function getIconPreviewUrl(iconId) {
  return joinURL(API_ENDPOINTS[0], `${iconId}.svg`);
}

/**
 * 尝试从 URL 中获取图标 ID
 * @param {string} url 图标 URL
 * @returns {string} 图标 ID
 */
export function tryGetIconId(url) {
  try {
    const urlObj = new URL(url);

    for (const endpoint of API_ENDPOINTS) {
      if (urlObj.origin === endpoint) {
        return withoutLeadingSlash(urlObj.pathname).replace('.svg', '');
      }
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * Hook 解析图标 ID
 * @param {string} value 图标值
 * @returns {Object} { isIconId 是否是图标 id，iconId 图标 ID }
 */
export function useIconifyId(value) {
  let isIconId = true;
  let iconId = value;
  if (value) {
    // 自定义上传的图片
    if (value.startsWith('/')) {
      isIconId = false;
      iconId = '';
    } else if (isUrl(value)) {
      iconId = tryGetIconId(value);
    }
  }

  return { isIconId, iconId };
}
