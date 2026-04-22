/* eslint-disable import/prefer-default-export */
import flat from 'flat';
import merge from 'lodash/merge';
import baseEn from '@abtnode/ux/lib/locales/en';
import { translations as extraTranslations } from '@blocklet/payment-react';

import en from './en';

export const translations = {
  en: flat(merge(baseEn, en, extraTranslations.en)),
  ar: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/ar').then((m) => m.default),
      import('./ar').then((m) => m.default),
    ]);
    return flat(merge(...data));
  },
  de: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/de').then((m) => m.default),
      import('./de').then((m) => m.default),
    ]);
    return flat(merge(...data));
  },
  es: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/es').then((m) => m.default),
      import('./es').then((m) => m.default),
    ]);
    return flat(merge(...data, extraTranslations));
  },
  fr: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/fr').then((m) => m.default),
      import('./fr').then((m) => m.default),
    ]);
    return flat(merge(...data, extraTranslations));
  },
  hi: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/hi').then((m) => m.default),
      import('./hi').then((m) => m.default),
    ]);
    return flat(merge(...data));
  },
  id: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/id').then((m) => m.default),
      import('./id').then((m) => m.default),
    ]);
    return flat(merge(...data));
  },
  ja: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/ja').then((m) => m.default),
      import('./ja').then((m) => m.default),
    ]);
    return flat(merge(...data));
  },
  ko: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/ko').then((m) => m.default),
      import('./ko').then((m) => m.default),
    ]);
    return flat(merge(...data));
  },
  pt: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/pt').then((m) => m.default),
      import('./pt').then((m) => m.default),
    ]);
    return flat(merge(...data));
  },
  ru: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/ru').then((m) => m.default),
      import('./ru').then((m) => m.default),
    ]);
    return flat(merge(...data));
  },
  th: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/th').then((m) => m.default),
      import('./th').then((m) => m.default),
    ]);
    return flat(merge(...data));
  },
  vi: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/vi').then((m) => m.default),
      import('./vi').then((m) => m.default),
    ]);
    return flat(merge(...data));
  },
  zh: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/zh').then((m) => m.default),
      import('./zh').then((m) => m.default),
    ]);
    return flat(merge(...data, extraTranslations.zh));
  },
  'zh-TW': async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/zh-tw').then((m) => m.default),
      import('./zh-tw').then((m) => m.default),
    ]);
    return flat(merge(...data, extraTranslations.zh));
  },
};
