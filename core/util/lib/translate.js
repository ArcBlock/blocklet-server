/* eslint-disable no-prototype-builtins */
const replace = (template, data) =>
  template.replace(/{(\w*)}/g, (m, key) => (data.hasOwnProperty(key) ? data[key] : ''));

const createTranslator = ({ translations, fallbackLocale = 'en' }) => {
  return (key, locale = fallbackLocale, data = {}) => {
    if (!translations[locale] || !translations[locale][key]) {
      if (fallbackLocale && translations[fallbackLocale]?.[key]) {
        return replace(translations[fallbackLocale]?.[key], data);
      }

      return key;
    }

    return replace(translations[locale][key], data);
  };
};

module.exports = createTranslator;
