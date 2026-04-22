function ensureLocale({ methods = ['body', 'query', 'cookies'], force = false } = {}) {
  return (req, res, next) => {
    if (req.blockletLocale && !force) {
      next();
      return;
    }

    let locale = req.blockletLocale || 'en';
    if (methods.includes('body') && req.body?.locale) {
      locale = req.body?.locale;
    } else if (methods.includes('query') && req.query?.locale) {
      locale = req.query?.locale;
    } else if (methods.includes('cookies') && req.cookies?.nf_lang) {
      locale = req.cookies?.nf_lang;
    } else if (req.headers && req.headers['accept-language']) {
      const acceptLanguage = req.headers['accept-language'].split(',')[0].trim().split(';')[0];
      if (acceptLanguage) {
        locale = acceptLanguage;
      }
    }

    // normalize the language setting from the cookie into a standard locale code
    const localeMap = {
      'zh-CN': 'zh',
      'en-US': 'en',
    };
    req.blockletLocale = localeMap[locale] || locale;

    next();
  };
}

module.exports = { ensureLocale };
