const createLocalesMethod = require('./create-locale-method');

describe('test language', () => {
  const { getLocale, getLocaleMap } = createLocalesMethod({
    localesMap: {
      en: {
        navigation: {
          access: 'Access',
        },
        my: {
          name: 'My name is {name}',
        },
      },
      zh: {
        navigation: {
          access: '访问',
        },
        my: {
          name: '我叫 {name}',
        },
      },
    },
    flatten: true,
  });
  it('get locale map', () => {
    expect(getLocaleMap('navigation.access')).toEqual({
      en: 'Access',
      zh: '访问',
    });

    expect(getLocaleMap('navigation.access', { name: 'Pillar' })).toEqual({
      en: 'Access',
      zh: '访问',
    });
  });

  it('get locale', () => {
    expect(getLocale('navigation.access', 'en')).toEqual('Access');
    expect(getLocale('navigation.access', 'zh')).toEqual('访问');
  });

  it('get locale with data', () => {
    expect(getLocale('my.name', 'en', { name: 'Pillar' })).toEqual('My name is Pillar');
    expect(getLocale('my.name', 'zh', { name: 'Pillar' })).toEqual('我叫 Pillar');

    expect(getLocale('my.name', 'en', { error: 'Pillar' })).toEqual('My name is {name}');
    expect(getLocale('my.name', 'zh', { error: 'Pillar' })).toEqual('我叫 {name}');
  });

  it('get localeMap with data', () => {
    expect(getLocaleMap('my.name', { name: 'Pillar' })).toEqual({
      en: 'My name is Pillar',
      zh: '我叫 Pillar',
    });
    expect(getLocaleMap('my.name', { error: 'Pillar' })).toEqual({
      en: 'My name is {name}',
      zh: '我叫 {name}',
    });
  });

  it('get localMap empty', () => {
    expect(getLocaleMap('navigation.access2')).toEqual({
      en: '',
      zh: '',
    });
  });

  it('get locale empty', () => {
    expect(getLocale('navigation.access2')).toEqual('');
  });
});
