const flat = require('flat');

/**
 * Represents the language code.
 * @typedef {'ai'|'de'|'en'|'es'|'fr'|'hi'|'id'|'ja'|'ko'|'pt'|'ru'|'th'|'vi'|'zh'|'zh-TW'} LanguageCode
 */

/**
 * @typedef {Object} LocaleMap
 * @property {string} ai
 * @property {string} de
 * @property {string} en
 * @property {string} es
 * @property {string} fr
 * @property {string} hi
 * @property {string} id
 * @property {string} ja
 * @property {string} ko
 * @property {string} pt
 * @property {string} ru
 * @property {string} th
 * @property {string} vi
 * @property {string} zh
 */

/**
 * @typedef {Object} LocaleLanguages
 * @property {Record<string, string>} ai
 * @property {Record<string, string>} de
 * @property {Record<string, string>} en
 * @property {Record<string, string>} es
 * @property {Record<string, string>} fr
 * @property {Record<string, string>} hi
 * @property {Record<string, string>} id
 * @property {Record<string, string>} ja
 * @property {Record<string, string>} ko
 * @property {Record<string, string>} pt
 * @property {Record<string, string>} ru
 * @property {Record<string, string>} th
 * @property {Record<string, string>} vi
 * @property {Record<string, string>} zh
 */

/**
 * @typedef {Object} CreateLocaleMethodProps
 * @property {LocaleLanguages} localesMap
 * @property {boolean} [flatten]
 */

/**
 * @callback GetLocale
 * 获取某个语言的某个key的值
 * @param {string} key
 * @param {LanguageCode} code
 * @param {Record<string, string>} [data]
 * @returns {string}
 */

/**
 * @callback GetLocaleMap
 * 获取某个key的所有语言的 value
 * @param {string} key
 * @param {Record<string, string>} [data]
 * @param {string} [fallbackLocale]
 * @returns {LocaleMap}
 */

function flattenObject(obj) {
  const keys = Object.keys(obj);
  return keys.reduce((map, key) => {
    map[key] = flat(obj[key]);
    return map;
  }, {});
}

const createEmptyMap = (languageKeys) => {
  return languageKeys.reduce((map, key) => {
    map[key] = '';
    return map;
  }, {});
};

const extractSubObjectWithKey = ({ keys, data, key, defaultKey }) => {
  return keys.reduce((map, subKey) => {
    map[subKey] = data[subKey] ? data[subKey][key] : data[defaultKey][key];
    return map;
  }, {});
};

const mapSubKeysToExtractedData = ({ topKeys, subKeys, data }) => {
  return subKeys.reduce((map, key) => {
    map[key] = extractSubObjectWithKey({
      keys: topKeys,
      data,
      key,
    });
    return map;
  }, {});
};

/* eslint-disable no-prototype-builtins */
const replaceTemplate = (template, data) => {
  if (typeof template !== 'string' && !data) {
    return template;
  }

  return template.replace(/{(\w*)}/g, (_, key) => (data.hasOwnProperty(key) ? data[key] : `{${key}}`));
};

/**
 * @param {CreateLocaleMethodProps} props
 * @returns {{getLocaleMap: GetLocaleMap, getLocale: GetLocale}}
 */
function createLocaleMethod({ localesMap, flatten = false }) {
  const locales = flatten ? flattenObject(localesMap) : localesMap;
  const languageKeys = Object.keys(locales);
  const localesKeys = Object.keys(locales.en);

  const allLocalesMap = mapSubKeysToExtractedData({
    topKeys: languageKeys,
    subKeys: localesKeys,
    data: locales,
    defaultKey: 'en',
  });
  const emptyMap = createEmptyMap(languageKeys);

  const getLocaleMap = (key, data, fallbackLocale = 'en') => {
    if (data) {
      return languageKeys.reduce(
        (obj, languageKey) => {
          obj[languageKey] = replaceTemplate(
            allLocalesMap[key][languageKey] || allLocalesMap[key][fallbackLocale],
            data
          );
          return obj;
        },
        { ...emptyMap }
      );
    }
    return allLocalesMap[key] || { ...emptyMap };
  };

  const getLocale = (key, code, data, fallbackLocale = 'en') => {
    const local = locales[code] || locales[fallbackLocale];
    if (local[key] === undefined) {
      return '';
    }
    return data ? replaceTemplate(local[key], data) : local[key];
  };

  return { getLocaleMap, getLocale };
}

module.exports = createLocaleMethod;
