const semver = require('semver');

let { version: actualServerVersion } = require('../../package.json');

const { version: actualNodejsVersion } = process;

const defaults = { abtnode: '>= 1.1.0', os: '*', cpu: '*', nodejs: '*' };

const isSatisfied = (requirements, throwOnUnsatisfied = true) => {
  if (!requirements || typeof requirements !== 'object') {
    return true;
  }

  const { platform: actualOs, arch: actualCpu } = process;
  const {
    os: expectedOs,
    cpu: expectedCpu,
    abtnode,
    server,
    nodejs: expectedNodejsVersion,
  } = Object.assign(defaults, requirements);
  const expectedServerVersion = server || abtnode;

  const isOsSatisfied =
    expectedOs === '*' || expectedOs === actualOs || (Array.isArray(expectedOs) && expectedOs.includes(actualOs));
  const isCpuSatisfied =
    expectedCpu === '*' || expectedCpu === actualCpu || (Array.isArray(expectedCpu) && expectedCpu.includes(actualCpu));

  const isServerVersionSatisfied = semver.satisfies(semver.coerce(actualServerVersion), expectedServerVersion);

  const isNodejsVersionSatisfied = semver.satisfies(semver.coerce(actualNodejsVersion), expectedNodejsVersion);

  if (throwOnUnsatisfied) {
    if (isOsSatisfied === false) {
      throw new Error(`Your blocklet is not supported on platform ${actualOs}`);
    }
    if (isCpuSatisfied === false) {
      throw new Error(`Your blocklet is not supported on architecture ${actualCpu}`);
    }
    if (isServerVersionSatisfied === false) {
      throw new Error(
        `Expected server version for the blocklet is ${expectedServerVersion}, but your server version is ${actualServerVersion}, please upgrade or downgrade your server to continue.`
      );
    }
    if (isNodejsVersionSatisfied === false) {
      throw new Error(
        `Expected Nodejs version for the blocklet is ${expectedNodejsVersion}, but your Nodejs version is ${actualNodejsVersion}, please upgrade or downgrade Nodejs and restart your server.`
      );
    }
  }

  return isOsSatisfied && isCpuSatisfied && isServerVersionSatisfied;
};

// Just for test
isSatisfied._setActualServerVersion = (d) => {
  actualServerVersion = d;
};
isSatisfied._actualNodejsVersion = actualNodejsVersion;

module.exports = isSatisfied;
