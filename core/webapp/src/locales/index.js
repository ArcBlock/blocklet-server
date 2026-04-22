/* eslint-disable import/prefer-default-export */
import flat from 'flat';
import merge from 'lodash/merge';
import baseEn from '@abtnode/ux/lib/locales/en';

import en from './en';

const flatMerge = data => flat(merge(...data));

export const translations = {
  en: flat(merge(baseEn, en)),
  ar: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/ar').then(m => m.default),
      import('./ar').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  de: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/de').then(m => m.default),
      import('./de').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  es: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/es').then(m => m.default),
      import('./es').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  fr: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/fr').then(m => m.default),
      import('./fr').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  hi: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/hi').then(m => m.default),
      import('./hi').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  id: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/id').then(m => m.default),
      import('./id').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  ja: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/ja').then(m => m.default),
      import('./ja').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  ko: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/ko').then(m => m.default),
      import('./ko').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  pt: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/pt').then(m => m.default),
      import('./pt').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  ru: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/ru').then(m => m.default),
      import('./ru').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  th: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/th').then(m => m.default),
      import('./th').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  vi: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/vi').then(m => m.default),
      import('./vi').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  zh: async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/zh').then(m => m.default),
      import('./zh').then(m => m.default),
    ]);
    return flatMerge(data);
  },
  'zh-TW': async () => {
    const data = await Promise.all([
      import('@abtnode/ux/lib/locales/zh-tw').then(m => m.default),
      import('./zh-tw').then(m => m.default),
    ]);
    return flatMerge(data);
  },
};
