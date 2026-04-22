const chalk = require('chalk');
const fs = require('fs-extra');
const fuzzy = require('fuzzy');
const inquirer = require('inquirer');
const path = require('path');
const open = require('open');
const pickBy = require('lodash/pickBy');
const {
  BLOCKLET_GROUPS,
  BLOCKLET_META_FILE,
  BLOCKLET_DEFAULT_VERSION,
  BlockletGroup,
  BLOCKLET_LATEST_SPEC_VERSION,
} = require('@blocklet/constant');
const { select: getMetaFile, update: updateMetaFile, read: readMetaFile } = require('@blocklet/meta/lib/file');
const { fixInterfaces, parsePerson } = require('@blocklet/meta/lib/fix');
const { validateMeta } = require('@blocklet/meta/lib/validate');
const { fixRepository } = require('@blocklet/meta/lib/fix');
const { titleSchema, descriptionSchema } = require('@blocklet/meta/lib/schema');
const { isValid } = require('@arcblock/did');
const { convertToMoniker } = require('@abtnode/util/lib/transfer-to-moniker');

const { createConnect } = require('@blocklet/store');
const { PROCESS_NAME_DAEMON } = require('@abtnode/constant');

const {
  getNPMConfig,
  print,
  printError,
  printInfo,
  printSuccess,
  getUserName,
  fixFiles,
  printWarning,
  getDaemonAccessUrls,
  getProcessInfo,
} = require('../../util');
const { wrapSpinner } = require('../../ui');
const { getNode } = require('../../node');

const COMMON_KEYS = ['name', 'description', 'version', 'author', 'keywords', 'repository'];

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const pickCommonFieldsInBlockletAndPackage = (meta) =>
  pickBy(meta, (value, key) => value !== undefined && COMMON_KEYS.includes(key));

const doInit = ({ metaFilePath, blockletMeta }) => {
  updateMetaFile(metaFilePath, blockletMeta);
  printSuccess(`Meta file ${chalk.cyan(metaFilePath)} was created`);

  if (!fs.existsSync('blocklet.md')) {
    fs.writeFileSync('blocklet.md', `# ${blockletMeta.name}`);
    printSuccess(`Doc file ${chalk.cyan('blocklet.md')} was created`);
  }

  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
    printSuccess(`Screenshots dir ${chalk.cyan('screenshots/')} was created`);
  }

  if (!fs.existsSync('logo.png')) {
    fs.copyFileSync(path.join(__dirname, 'assets', 'logo.png'), 'logo.png');
    printSuccess(`${chalk.cyan('logo.png')} was created`);
  }

  if (blockletMeta.group === BlockletGroup.dapp) {
    if (!fs.existsSync('index.js')) {
      fs.copyFileSync(path.join(__dirname, 'assets', 'index.js'), 'index.js');
      printSuccess(`${chalk.cyan('index.js')} was created`);
    }
  }

  if (blockletMeta.group === BlockletGroup.static) {
    if (!fs.existsSync('index.html')) {
      fs.copyFileSync(path.join(__dirname, 'assets', 'index.html'), 'index.html');
      printSuccess(`${chalk.cyan('index.html')} was created`);
    }
  }

  // avoid bundle bug
  if (!fs.existsSync('.gitignore')) {
    fs.copyFileSync(path.join(__dirname, 'assets', 'git-ignore'), '.gitignore');
  }
};

const getPromptQuestions = (defaults) => {
  const questions = [
    {
      type: 'text',
      name: 'title',
      message: 'blocklet title',
      default: defaults.name,
      transformer: (name) => name.trim(),
      validate: async (input) => {
        try {
          if (!input || !input.trim()) {
            return 'title can not be empty';
          }
          await titleSchema.validateAsync(input);
        } catch (error) {
          return error.message;
        }

        return true;
      },
    },
    {
      type: 'text',
      name: 'description',
      message: 'Please write concise description:',
      default: defaults.description || '',
      validate: async (description) => {
        try {
          if (!description.trim()) {
            return 'Description can not be empty';
          }
          await descriptionSchema.validateAsync(description);
        } catch (error) {
          return error.message;
        }
        return true;
      },
    },
    {
      type: 'autocomplete',
      name: 'group',
      message: 'What\'s the group of the blocklet?', // prettier-ignore
      default: defaults.group,
      source: (_, inp) => {
        const input = inp || '';
        return new Promise((resolve) => {
          const result = fuzzy.filter(input, BLOCKLET_GROUPS);
          resolve(result.map((item) => item.original));
        });
      },
    },
    {
      type: 'text',
      name: 'main',
      message: 'What\'s the entry point of the blocklet?', // prettier-ignore
      default: (answers) => (answers.group === BlockletGroup.dapp ? 'index.js' : defaults.main || '.'),
      validate: (main) => (main.trim() ? true : 'The entry point can not be empty'),
      when: (answers) => answers.group !== BlockletGroup.gateway,
    },
  ];

  return questions;
};

function getNpmAuthor() {
  const npmAuthor = getNPMConfig('init.author.name');
  const npmEmail = getNPMConfig('init.author.email');
  let author = '';
  if (npmAuthor) {
    author = npmEmail ? `${npmAuthor} <${npmEmail}>` : npmAuthor;
  }

  return author;
}

function ensureMainDirPathWhenStatic(answers) {
  if (answers.group !== BlockletGroup.static || !answers.main) {
    return;
  }

  answers.main = path.dirname(answers.main) || '.';
}

async function getConnectUrl(connectDIDUrl) {
  if (connectDIDUrl) {
    return connectDIDUrl;
  }

  const defaultUrl = 'https://store.blocklet.dev';
  try {
    const info = await getProcessInfo(PROCESS_NAME_DAEMON);
    if (!info) {
      return defaultUrl;
    }

    const { node, getBaseUrls } = await getNode({ dir: process.cwd() });
    const nodeInfo = await node.getNodeInfo();
    if (info.pm2_env.status !== 'online') {
      return defaultUrl;
    }

    const accessUrls = await getDaemonAccessUrls({ info: nodeInfo, getBaseUrls, forceIntranet: true });
    const uri = accessUrls.find((x) => x.url?.startsWith('https')) || accessUrls[0];
    return uri?.url || defaultUrl;
  } catch (e) {
    return defaultUrl;
  }
}

async function generateDidFromWallet(connectUrl, { verbose = true, monikers = '' } = {}) {
  const infoList = await createConnect({
    connectUrl,
    verbose,
    monikers: convertToMoniker(monikers),
    connectAction: 'gen-key-pair',
    openPage: open,
    wrapSpinner,
  });
  return infoList.map((x) => x.address);
}

// Run the cli interactively
async function run({ yes = false, force = false, monikers = '', connectUrl: connectDIDUrl, did }) {
  const connectUrl = await getConnectUrl(connectDIDUrl);

  if (monikers) {
    const blockletDidList = await generateDidFromWallet(connectUrl, { verbose: false, monikers });
    print(blockletDidList.join(','));
    process.exit(0);
  }
  const dir = process.cwd();
  const metaFilePath = getMetaFile(dir, { throwOnError: false });

  const defaultName = path.basename(dir);

  // Do nothing if meta file found
  if (metaFilePath) {
    const metaData = readMetaFile(metaFilePath);
    if (isValid(metaData.did)) {
      printInfo(`Blocklet meta file found at: ${chalk.cyan(metaFilePath)}, skipping`);
      process.exit(0);
    } else {
      printWarning('Blocklet did is invalid, generate a new blocklet did');
      const [blockletDid] = await generateDidFromWallet(connectUrl, { monikers: defaultName });
      updateMetaFile(metaFilePath, {
        ...metaData,
        did: blockletDid,
      });
      process.exit(0);
    }
  }

  let packageJSON = {};
  const packageJSONPath = path.join(dir, 'package.json');
  if (fs.existsSync(packageJSONPath)) {
    try {
      packageJSON = JSON.parse(fs.readFileSync(packageJSONPath));
    } catch (error) {
      printError('Read package.json file failed.');
      printInfo('Please check if package.json is a valid json file.');
      process.exit(1);
    }
  }

  const defaultMeta = Object.assign(
    {
      name: defaultName,
      description: 'Blocklet Project',
      group: BLOCKLET_GROUPS[0],
      publicUrl: '/',
      main: '.',
      author: getNpmAuthor(),
      specVersion: BLOCKLET_LATEST_SPEC_VERSION,
    },
    pickCommonFieldsInBlockletAndPackage(packageJSON)
  );

  let answers = {};
  const questions = getPromptQuestions(defaultMeta);
  if (yes || force) {
    answers = questions.reduce((acc, item) => {
      if (item.default) {
        acc[item.name] = item.default;
      }

      return acc;
    }, {});
  } else {
    print('This utility will walk you through create such files and folders(if not exists):');
    print(`- ${BLOCKLET_META_FILE}`);
    print('- blocklet.md');
    print('- screenshots/');
    print('\nIt only covers common items, if you want to check all items, please visit:');
    print('https://github.com/ArcBlock/blocklets#keyinfo-blockletjson\n');
    print('Press ^C to quit.');
    answers = await inquirer.prompt(questions);
  }

  ensureMainDirPathWhenStatic(answers);
  const meta = Object.assign(defaultMeta, answers);

  fixFiles(meta, dir);
  fixInterfaces(meta);
  fixRepository(meta);

  const author = getUserName(meta.author);
  meta.author = parsePerson(author);
  let blockletDid = did;
  if (!blockletDid) {
    [blockletDid] = await generateDidFromWallet(connectUrl, { monikers: meta.title });
  }
  meta.did = blockletDid;
  meta.name = meta.did;
  meta.version = BLOCKLET_DEFAULT_VERSION;

  if (meta.group === BlockletGroup.gateway) {
    delete meta.main;
  } else if (meta.group === BlockletGroup.dapp) {
    meta.scripts = {
      dev: 'node index.js',
    };
  }

  if (yes === false && force === false) {
    const { isOK } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'isOK',
        message: 'Is this OK:',
        default: true,
      },
    ]);

    if (!isOK) {
      print('User aborted!');
      process.exit(0);
    }
  }

  meta.logo = 'logo.png';

  const blockletMeta = validateMeta(meta);

  doInit({ metaFilePath: path.join(dir, BLOCKLET_META_FILE), blockletMeta });
  process.exit(0);
}

exports.run = async (...args) => {
  try {
    await run(...args);
  } catch (err) {
    printError(`Failed to init blocklet: ${err.message}`);
    process.exit(1);
  }
};

exports.generateDidFromWallet = generateDidFromWallet;
exports.getConnectUrl = getConnectUrl;
