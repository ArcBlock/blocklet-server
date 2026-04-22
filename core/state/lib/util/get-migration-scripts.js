const fs = require('fs');
const semver = require('semver');
const uniqBy = require('lodash/uniqBy');

const getMigrationScripts = (scriptsDir, version) => {
  if (!fs.existsSync(scriptsDir)) {
    return [];
  }

  const files = fs.readdirSync(scriptsDir);
  const scripts = files
    .filter((x) => semver.coerce(x))
    .map((x) => ({
      script: x,
      version: semver.coerce(x).version,
    }));

  const sorted = scripts.sort((a, b) => semver.compare(a.version, b.version));

  const uniq = uniqBy(sorted, (x) => x.version);
  if (uniq.length !== sorted.length) {
    throw new Error('Migration scripts with same version is not allowed');
  }

  if (version && typeof version === 'string') {
    return uniq.filter((x) => semver.gte(x.version, version));
  }

  return uniq;
};

module.exports = getMigrationScripts;
