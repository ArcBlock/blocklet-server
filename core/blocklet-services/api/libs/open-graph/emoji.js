/* eslint-disable consistent-return */
/* eslint-disable no-bitwise */
const fetch = require('node-fetch').default;

const U200D = String.fromCharCode(8205); // zero-width joiner
const UFE0Fg = /\uFE0F/g; // variation selector regex

const toCodePoint = (unicodeSurrogates) => {
  const r = [];
  let c = 0;
  let p = 0;
  let i = 0;
  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((65536 + ((p - 55296) << 10) + (c - 56320)).toString(16));
      p = 0;
    } else if (c >= 55296 && c <= 56319) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join('-');
};

const getIconCode = (char) => toCodePoint(char.indexOf(U200D) < 0 ? char.replace(UFE0Fg, '') : char);

const apis = {
  twemoji: (code) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code.toLowerCase()}.svg`,
  openmoji: 'https://cdn.jsdelivr.net/npm/@svgmoji/openmoji@2.0.0/svg/',
  blobmoji: 'https://cdn.jsdelivr.net/npm/@svgmoji/blob@2.0.0/svg/',
  noto: 'https://cdn.jsdelivr.net/gh/svgmoji/svgmoji/packages/svgmoji__noto/svg/',
  fluent: (code) => `https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode/assets/${code.toLowerCase()}_color.svg`,
  fluentFlat: (code) =>
    `https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode/assets/${code.toLowerCase()}_flat.svg`,
};

// https://github.com/svgmoji/svgmoji
const loadEmoji = (code, type) => {
  const api = apis[type] ?? apis.twemoji;
  if (typeof api === 'function') {
    return fetch(api(code));
  }
  return fetch(`${api}${code.toUpperCase()}.svg`);
};

const cache = new Map();
const loadDynamicAsset = (emojiType = 'twemoji') => {
  const fn = async (languageCode, text) => {
    if (languageCode === 'emoji') {
      const code = getIconCode(text);
      try {
        const emoji = await loadEmoji(code, emojiType);
        return `data:image/svg+xml;base64,${btoa(await emoji.text())}`;
      } catch (err) {
        console.error(`Failed to fetch emoji: ${text}:${code}`, err);
      }
    }
  };

  return async (...args) => {
    const key = JSON.stringify({ ...args, emojiType });
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    const font = await fn(...args);
    cache.set(key, font);
    return font;
  };
};

module.exports = {
  apis,
  getIconCode,
  loadEmoji,
  loadDynamicAsset,
};
