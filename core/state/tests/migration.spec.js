/* eslint-disable global-require */
/* eslint-disable no-console */
const { test, expect, describe, beforeAll, afterAll, mock } = require('bun:test');

mock.module('@abtnode/util/lib/can-pkg-rw', () => {
  return {
    __esModule: true,
    default: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');
const semver = require('semver');

describe('getMigrationScripts', () => {
  const { getMigrationScripts } = require('../lib/migrations');
  test('should throw error when duplicate version', () => {
    const scriptsDir = path.join(os.tmpdir(), `${Date.now()}-scripts`);
    fs.mkdirSync(scriptsDir);

    fs.writeFileSync(path.join(scriptsDir, '0.0.1-a.js'), '');
    fs.writeFileSync(path.join(scriptsDir, '0.0.1-b.js'), '');

    expect(() => getMigrationScripts(scriptsDir)).toThrowError();
    fs.removeSync(path.join(scriptsDir));
  });

  test('should return filtered and sorted scripts', () => {
    const scriptsDir = path.join(os.tmpdir(), `${Date.now()}-scripts`);
    fs.mkdirSync(scriptsDir);

    fs.writeFileSync(path.join(scriptsDir, 'test.js'), '');
    fs.writeFileSync(path.join(scriptsDir, 'JKAdfksdfj.js'), '');
    fs.writeFileSync(path.join(scriptsDir, '0.0.1-a.js'), '');
    fs.writeFileSync(path.join(scriptsDir, '0.0.2-b.js'), '');
    fs.writeFileSync(path.join(scriptsDir, '1.0.3-a.js'), '');
    fs.writeFileSync(path.join(scriptsDir, '0.1.3-a.js'), '');
    fs.writeFileSync(path.join(scriptsDir, '0.0.3-a.js'), '');

    const result = getMigrationScripts(scriptsDir);
    expect(result).toEqual([
      { script: '0.0.1-a.js', version: '0.0.1' },
      { script: '0.0.2-b.js', version: '0.0.2' },
      { script: '0.0.3-a.js', version: '0.0.3' },
      { script: '0.1.3-a.js', version: '0.1.3' },
      { script: '1.0.3-a.js', version: '1.0.3' },
    ]);

    fs.removeSync(path.join(scriptsDir));
  });
});

describe('runMigrationScripts', () => {
  const { runMigrationScripts } = require('../lib/migrations');
  const createUpdateFn = (file) => `const fs = require('fs');
const path = require('path');
module.exports = async ({ dataDir }) => {
  fs.writeFileSync(path.join(dataDir, 'result-${file}'), "${file}");
};`;

  const createErrorFn = () => `module.exports = async ({ dataDir }) => {
    throw new Error("some error occurred");
};`;

  test('should run all scripts if non executed', async () => {
    const scriptsDir = path.join(os.tmpdir(), `${Date.now()}-scripts1`);
    fs.mkdirSync(scriptsDir);

    fs.writeFileSync(path.join(scriptsDir, '0.0.1-a.js'), createUpdateFn('1a'));
    fs.writeFileSync(path.join(scriptsDir, '0.0.2-b.js'), createUpdateFn('2b'));
    fs.writeFileSync(path.join(scriptsDir, '1.0.3-a.js'), createUpdateFn('103a'));
    fs.writeFileSync(path.join(scriptsDir, '0.1.3-a.js'), createUpdateFn('13a'));
    fs.writeFileSync(path.join(scriptsDir, '0.0.3-a.js'), createUpdateFn('3a'));

    const node = {
      dataDir: scriptsDir,
      isMigrationExecuted: () => false,
      markMigrationExecuted: () => {},
      printInfo: () => {},
    };

    const config = { node: { version: '0.0.0' } };

    const assertResult = (file) => {
      expect(fs.readFileSync(path.join(scriptsDir, `result-${file}`)).toString()).toEqual(file);
    };

    try {
      await runMigrationScripts({ node, config, dataDir: scriptsDir, scriptsDir, printInfo: () => {} });
      ['1a', '2b', '103a', '13a', '3a'].forEach((x) => assertResult(x));
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    fs.removeSync(path.join(scriptsDir));
  });

  test('should run filtered scripts if some executed', async () => {
    const scriptsDir = path.join(os.tmpdir(), `${Date.now()}-scripts2`);
    fs.mkdirSync(scriptsDir);

    fs.writeFileSync(path.join(scriptsDir, '0.0.1-a.js'), createUpdateFn('1a'));
    fs.writeFileSync(path.join(scriptsDir, '0.0.2-b.js'), createUpdateFn('2b'));
    fs.writeFileSync(path.join(scriptsDir, '1.0.3-a.js'), createUpdateFn('103a'));
    fs.writeFileSync(path.join(scriptsDir, '0.1.3-a.js'), createUpdateFn('13a'));
    fs.writeFileSync(path.join(scriptsDir, '0.0.3-a.js'), createUpdateFn('3a'));

    const config = { node: { version: '0.0.0' } };

    const node = {
      dataDir: scriptsDir,
      isMigrationExecuted: ({ version }) => semver.lte(version, '0.0.1'),
      markMigrationExecuted: () => {},
    };

    const assertResult = (file) => {
      expect(fs.readFileSync(path.join(scriptsDir, `result-${file}`)).toString()).toEqual(file);
    };
    const assertNoResult = (file) => {
      expect(fs.existsSync(path.join(scriptsDir, `result-${file}`))).toBeFalsy();
    };

    try {
      await runMigrationScripts({ node, config, dataDir: scriptsDir, scriptsDir, printInfo: () => {} });
      ['2b', '103a', '13a', '3a'].forEach((x) => assertResult(x));
      ['1a'].forEach((x) => assertNoResult(x));
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    fs.removeSync(path.join(scriptsDir));
  });

  test('should run scripts which version is higher than node version', async () => {
    const scriptsDir = path.join(os.tmpdir(), `${Date.now()}-scripts2`);
    fs.mkdirSync(scriptsDir);

    fs.writeFileSync(path.join(scriptsDir, '0.0.1-a.js'), createUpdateFn('1a'));
    fs.writeFileSync(path.join(scriptsDir, '0.0.2-b.js'), createUpdateFn('2b'));
    fs.writeFileSync(path.join(scriptsDir, '1.0.3-a.js'), createUpdateFn('103a'));
    fs.writeFileSync(path.join(scriptsDir, '0.1.3-a.js'), createUpdateFn('13a'));
    fs.writeFileSync(path.join(scriptsDir, '0.0.3-a.js'), createUpdateFn('3a'));

    const config = { node: { version: '0.1.0' } };

    const node = {
      dataDir: scriptsDir,
      isMigrationExecuted: () => false,
      markMigrationExecuted: () => {},
    };

    const assertResult = (file) => {
      expect(fs.readFileSync(path.join(scriptsDir, `result-${file}`)).toString()).toEqual(file);
    };
    const assertNoResult = (file) => {
      expect(fs.existsSync(path.join(scriptsDir, `result-${file}`))).toBeFalsy();
    };

    try {
      await runMigrationScripts({ node, config, dataDir: scriptsDir, scriptsDir, printInfo: () => {} });
      ['103a', '13a'].forEach((x) => assertResult(x));
      ['1a, 2b, 3a'].forEach((x) => assertNoResult(x));
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    fs.removeSync(path.join(scriptsDir));
  });

  test('should abort on scripts error', async () => {
    const scriptsDir = path.join(os.tmpdir(), `${Date.now()}-scripts3`);
    fs.mkdirSync(scriptsDir);

    fs.writeFileSync(path.join(scriptsDir, '0.0.1-a.js'), createUpdateFn('1a'));
    fs.writeFileSync(path.join(scriptsDir, '0.0.2-b.js'), createErrorFn());
    fs.writeFileSync(path.join(scriptsDir, '0.0.3-c.js'), createUpdateFn('3c'));

    const node = {
      dataDir: scriptsDir,
      isMigrationExecuted: ({ version }) => semver.lte(version, '0.0.1'),
      markMigrationExecuted: () => {},
    };

    const config = { node: { version: '0.0.0' } };

    const assertNoResult = (file) => {
      expect(fs.existsSync(path.join(scriptsDir, `result-${file}`))).toBeFalsy();
    };

    try {
      const result = await runMigrationScripts({
        node,
        config,
        dataDir: scriptsDir,
        scriptsDir,
        printError: console.info,
      });
      expect(result).toBeFalsy();
      ['1a', '2b', '3c'].forEach((x) => assertNoResult(x));
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    fs.removeSync(path.join(scriptsDir));
  });

  test('should back and restore work as expected', async () => {
    const scriptsDir = path.join(os.tmpdir(), `${Date.now()}-scripts3`);
    fs.mkdirSync(scriptsDir);

    fs.writeFileSync(path.join(scriptsDir, '0.0.1-a.js'), createUpdateFn('1a'));
    fs.writeFileSync(path.join(scriptsDir, '0.0.2-b.js'), createErrorFn());
    fs.writeFileSync(path.join(scriptsDir, '0.0.3-c.js'), createUpdateFn('3c'));

    const node = {
      dataDir: scriptsDir,
      isMigrationExecuted: ({ version }) => semver.lte(version, '0.0.1'),
      markMigrationExecuted: () => {},
    };

    const config = { node: { version: '0.0.0' } };

    const assertNoResult = (file) => {
      expect(fs.existsSync(path.join(scriptsDir, `result-${file}`))).toBeFalsy();
    };

    try {
      const result = await runMigrationScripts({
        node,
        config,
        dataDir: scriptsDir,
        scriptsDir,
        printError: console.info,
      });
      expect(result).toBeFalsy();
      ['1a', '2b', '3c'].forEach((x) => assertNoResult(x));
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    fs.removeSync(path.join(scriptsDir));
  });
});

describe('MigrationScriptSmokeTest', () => {
  const { getMigrationScripts, runMigrationScripts } = require('../lib/migrations');
  const { setupInstance, tearDownInstance } = require('../tools/fixture');
  let instance = null;

  beforeAll(async () => {
    process.env.ABT_IGNORE_ACME_INIT = 'true';
    instance = await setupInstance('migration');
    delete process.env.ABT_IGNORE_ACME_INIT;
  });

  const list = [
    { script: '1.0.21-update-config.js', version: '1.0.21' },
    { script: '1.0.22-max-memory.js', version: '1.0.22' },
    { script: '1.0.25.js', version: '1.0.25' },
    { script: '1.0.32-update-config.js', version: '1.0.32' },
    { script: '1.0.33-blocklets.js', version: '1.0.33' },
  ];

  test('should all migration run successfully', async () => {
    const dir = path.resolve(__dirname, '../lib/migrations');
    const scripts = await getMigrationScripts(dir);
    list.forEach((x) => expect(scripts.some((s) => s.script === x.script)).toEqual(true));
    // set node version to 0.0.0 to run all migration scripts
    const config = {
      ...instance.options,
      node: {
        ...instance.options.node,
        version: '0.0.0',
      },
    };

    const mockedMode = {
      ...instance,
      handleSystemRouting: () => 'mock hash',
      handleBlockletRouting: () => 'mock hash',
      handleAllRouting: () => 'mock hash',
      isMigrationExecuted: () => false,
      markMigrationExecuted: () => true,
    };

    const configFile = path.join(instance.dataDir, 'abtnode.yml');
    fs.writeFileSync(configFile, yaml.dump(config));

    const result = await runMigrationScripts({
      node: mockedMode,
      config,
      configFile,
      dataDir: instance.dataDir,
      printInfo: console.info, // eslint-disable-line
      printSuccess: console.info, // eslint-disable-line
      printError: console.error,
      scriptsDir: dir,
    });
    expect(result).toEqual(true);
  }, 10_000);

  afterAll(async () => {
    await tearDownInstance(instance);
  });
}, 10_000);
