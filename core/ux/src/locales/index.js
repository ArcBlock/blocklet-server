/* eslint-disable import/prefer-default-export */
import flat from 'flat';

import en from './en';

export const translations = {
  en: flat(en),
  ar: () => import('./ar').then((m) => flat(m.default)),
  de: () => import('./de').then((m) => flat(m.default)),
  es: () => import('./es').then((m) => flat(m.default)),
  fr: () => import('./fr').then((m) => flat(m.default)),
  hi: () => import('./hi').then((m) => flat(m.default)),
  id: () => import('./id').then((m) => flat(m.default)),
  ja: () => import('./ja').then((m) => flat(m.default)),
  ko: () => import('./ko').then((m) => flat(m.default)),
  pt: () => import('./pt').then((m) => flat(m.default)),
  ru: () => import('./ru').then((m) => flat(m.default)),
  th: () => import('./th').then((m) => flat(m.default)),
  vi: () => import('./vi').then((m) => flat(m.default)),
  'zh-TW': () => import('./zh-tw').then((m) => flat(m.default)),
  zh: () => import('./zh').then((m) => flat(m.default)),
};
