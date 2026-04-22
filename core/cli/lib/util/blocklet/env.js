const fs = require('fs');
const debug = require('debug');
const chalk = require('chalk');
const inquirer = require('inquirer');
const dotenv = require('dotenv-flow');
const mask = require('maskdata');
const uniqBy = require('lodash/uniqBy');
const { CHAIN_INFO_CONFIG } = require('@blocklet/meta/lib/constants');
const { forEachBlockletSync, getComponentName, getComponentMissingConfigs } = require('@blocklet/meta/lib/util');

const { print, printInfo } = require('../index');

const askQuestions = (requiredEnvs) => {
  const questions = requiredEnvs.map((env) => ({
    type: 'text',
    name: env.name,
    message: `Please input ${env.name}`,
    validate: (v) => (v ? true : `${env.name} is required`),
  }));

  return inquirer.prompt(questions);
};

const mergeBlockletConfigEntry = (blocklet, key, value, result, id, ancestors, skipUnknown = true) => {
  let configEntry;
  const envConfig = (blocklet.meta.environments || []).find((x) => x.name === key);
  if (envConfig) {
    configEntry = { ...envConfig, key, value };
    delete configEntry.name;
  } else if (skipUnknown === false) {
    configEntry = { key, value, required: false, shared: true, custom: true };
  }

  if (configEntry) {
    if (!result[id]) {
      result[id] = {
        name: getComponentName(blocklet, ancestors),
        did: [...ancestors.map((y) => y.meta.did), blocklet.meta.did],
        configs: [configEntry],
      };
    } else {
      const index = result[id].configs.findIndex((x) => x.key === key);
      if (index >= 0) {
        result[id].configs[index].value = value;
      } else {
        result[id].configs.push(configEntry);
      }
    }
  }
};

const getMetaDefinedEnv = (blocklet) => {
  const env = {};

  // only read env in blocklet.meta.environments.
  const environments = blocklet && blocklet.meta && blocklet.meta.environments;
  if (Array.isArray(environments)) {
    environments.forEach((item) => {
      if (process.env[item.name]) {
        env[item.name] = process.env[item.name];
      }
    });
  }

  return env;
};

const ensureBlockletEnv = async (node, blocklet, dir) => {
  const envFiles = dotenv.listFiles({ path: dir, node_env: 'development' });
  let env = {};
  envFiles.forEach((x) => {
    if (fs.existsSync(x)) {
      env = Object.assign(env, dotenv.parse(x));
    }
  });

  debug('ensureBlockletEnv', envFiles, env);

  Object.assign(env, getMetaDefinedEnv(blocklet));

  // merge blocklet.yml config from dotenv files
  const pickedEnvs = Object.entries(env).reduce((obj, [key, value]) => {
    forEachBlockletSync(blocklet, (b, { id, ancestors }) => {
      mergeBlockletConfigEntry(b, key, value, obj, id, ancestors, true);
    });
    return obj;
  }, {});

  // merge chainInfo config from dotenv files
  Object.entries(CHAIN_INFO_CONFIG).forEach(([key, [, value]]) => {
    if (typeof env[key] === 'undefined') return;
    mergeBlockletConfigEntry(blocklet, key, env[key] || value, pickedEnvs, blocklet.meta.did, [], false);
  });

  if (Object.keys(pickedEnvs).length) {
    print('');
    printInfo(`Use the values from ${chalk.cyan('.env[.development][.local]')} as environment variables\n`);
    for (const { name, configs } of Object.values(pickedEnvs)) {
      print(`${name}:`);
      configs.forEach((f) => print(`- ${f.key}: ${chalk.cyan(f.secure ? mask.maskPassword(f.value) : f.value)}`));
      print('\n');
    }

    for (const { did, configs } of Object.values(pickedEnvs)) {
      // eslint-disable-next-line no-await-in-loop
      await node.configBlocklet({ did, configs });
    }
  }

  const requiredEnvs = {};
  forEachBlockletSync(blocklet, (b, { id, ancestors }) => {
    const envs = getComponentMissingConfigs(b, ancestors[0])
      .map((x) => {
        const o = (b.meta.environments || []).find((y) => y.name === x.key);
        return o;
      })
      .filter(Boolean)
      .filter((d) => !Object.prototype.hasOwnProperty.call(env, d.name));
    if (envs.length) {
      requiredEnvs[id] = {
        name: getComponentName(b, ancestors),
        did: [...ancestors.map((y) => y.meta.did), b.meta.did],
        envs,
      };
    }
  });

  if (Object.keys(requiredEnvs).length) {
    const questions = uniqBy(
      Object.values(requiredEnvs)
        .map((x) => x.envs)
        .flat(),
      'name'
    );
    printInfo('Missing following required configuration to continue\n');
    questions.forEach((f) => print('-', f.name));
    print('');
    const answers = await askQuestions(questions);

    if (Object.entries(requiredEnvs).length) {
      print('');
      printInfo('Use the values as environment variables\n');
    }
    for (const [, { name, did, envs }] of Object.entries(requiredEnvs)) {
      const configs = Object.entries(answers)
        .map(([key, value]) => {
          const envConfig = envs.find((x) => x.name === key);
          if (!envConfig) {
            return null;
          }
          const config = {
            ...envConfig,
            key,
            value,
          };
          delete config.name;
          return config;
        })
        .filter(Boolean);

      print(`${name}:`);
      configs.forEach((f) => print(`- ${f.key}: ${chalk.cyan(f.value)}`));
      print('\n');

      // eslint-disable-next-line no-await-in-loop
      await node.configBlocklet({
        did,
        configs,
      });
    }
  }
};

module.exports = ensureBlockletEnv;
module.exports.mergeBlockletConfigEntry = mergeBlockletConfigEntry;
