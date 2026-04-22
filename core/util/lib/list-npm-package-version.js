const semverClean = require('to-semver');
const semverSort = require('semver-sort');
const sortBy = require('lodash/sortBy');
const axios = require('./axios');

module.exports = async (name, { includePrereleases = false, limit = 60 } = {}) => {
  const {
    data: { time, versions },
  } = await axios.get(`https://registry.npmjs.org/${name}?t=${Date.now()}`);
  const valid = semverSort.desc(semverClean(Object.keys(time), { includePrereleases, clean: true }));

  const result = valid
    .filter((x) => !versions[x].deprecated)
    .map((version) => ({ version, publishedAt: time[version] }))
    .slice(0, limit);

  return sortBy(result, 'publishedAt').reverse();
};
