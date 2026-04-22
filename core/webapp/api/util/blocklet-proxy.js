const isArray = require('lodash/isArray');
const { MimeType } = require('mime-type');
const uniq = require('lodash/uniq');

const db = require('mime-db');

const mime = new MimeType(db);

/**
 *
 *
 * @param {string} url
 * @return {string[]}
 */
function getMimeTypes(url) {
  // 提取URL的文件名部分（去掉查询参数）
  const cleanUrl = url.split('?')[0];
  const lookupResult = mime.lookup(cleanUrl);
  // eslint-disable-next-line no-nested-ternary
  const mimeTypes = isArray(lookupResult) ? lookupResult : lookupResult ? [lookupResult] : [];

  // 特别地，如果是图片，那么返回所有图片类型
  if (mimeTypes.some(type => type && type.includes('image/'))) {
    return uniq([mimeTypes, ...mime.glob('image/*'), 'image/x-icon']);
  }

  if (mimeTypes.some(type => type && type.includes('/javascript'))) {
    return mime.glob('*/javascript');
  }

  return uniq(mimeTypes);
}

module.exports = {
  getMimeTypes,
};
