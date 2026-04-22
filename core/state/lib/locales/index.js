const flat = require('flat');
const ar = require('./ar');
const de = require('./de');
const en = require('./en');
const es = require('./es');
const fr = require('./fr');
const hi = require('./hi');
const id = require('./id');
const ja = require('./ja');
const ko = require('./ko');
const pt = require('./pt');
const ru = require('./ru');
const th = require('./th');
const vi = require('./vi');
const zhTW = require('./zh-tw');
const zh = require('./zh');

const translations = new Map([
  ['ar', flat(ar)],
  ['de', flat(de)],
  ['en', flat(en)],
  ['es', flat(es)],
  ['fr', flat(fr)],
  ['hi', flat(hi)],
  ['id', flat(id)],
  ['ja', flat(ja)],
  ['ko', flat(ko)],
  ['pt', flat(pt)],
  ['ru', flat(ru)],
  ['th', flat(th)],
  ['vi', flat(vi)],
  ['zh-TW', flat(zhTW)],
  ['zh', flat(zh)],
]);

const replace = (template, data) =>
  template.replace(/{(\w*)}/g, (_, key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : ''));

module.exports = {
  /**
   *
   * @param {'zh' | 'en'} locale
   * @param {string} key
   * @param {Record<string, string>} data
   * @returns {string}
   */
  translate: (locale, key, data) => {
    if (translations.has(locale)) {
      return replace(translations.get(locale)[key], data);
    }

    return replace(translations.get('en')[key], data);
  },
};
