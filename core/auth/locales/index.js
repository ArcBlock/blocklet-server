const createLocaleMethod = require('./create-locale-method');

const ar = require('./ar');
const de = require('./de');
const es = require('./es');
const en = require('./en');
const fr = require('./fr');
const hi = require('./hi');
const id = require('./id');
const ja = require('./ja');
const ko = require('./ko');
const pt = require('./pt');
const ru = require('./ru');
const th = require('./th');
const vi = require('./vi');
const zh = require('./zh');
const zhTW = require('./zh-tw');

module.exports = createLocaleMethod({
  localesMap: {
    ar,
    de,
    en,
    es,
    fr,
    hi,
    id,
    ja,
    ko,
    pt,
    ru,
    th,
    vi,
    zh,
    'zh-TW': zhTW,
  },
  flatten: true,
});
