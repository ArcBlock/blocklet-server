import { useMemo } from 'react';
import { SUPPORTED_LANGUAGES } from '@blocklet/constant';
import { useBlockletContext } from '../contexts/blocklet';

export default function useAppLanguages(fallback = ['en', 'zh']) {
  const { blocklet } = useBlockletContext();

  const result = useMemo(() => {
    const config = blocklet.environments.find((x) => x.key === 'BLOCKLET_APP_LANGUAGES');
    const locales = config ? config.value.split(',') : fallback;
    const defaultLocale = locales[0] || 'en';

    const supportedLocales = locales.filter((x) => SUPPORTED_LANGUAGES[x]);
    const localeMap = supportedLocales.reduce((acc, x) => {
      acc[x] = SUPPORTED_LANGUAGES[x].nativeName;
      return acc;
    }, {});

    const languages = supportedLocales.map((x) => ({
      code: x,
      name: SUPPORTED_LANGUAGES[x].nativeName,
    }));

    return { locales, localeMap, defaultLocale, languages };
  }, [blocklet.environments, fallback]);

  return result;
}
