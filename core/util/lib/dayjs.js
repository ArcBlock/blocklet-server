const dayjs = require('dayjs');

require('dayjs/locale/en');
require('dayjs/locale/zh');

const relativeTime = require('dayjs/plugin/relativeTime');
const localizedFormat = require('dayjs/plugin/localizedFormat');
const duration = require('dayjs/plugin/duration');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone'); // dependent on utc plugin

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = dayjs;
