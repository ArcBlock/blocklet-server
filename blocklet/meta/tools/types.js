// eslint-disable-next-line import/no-extraneous-dependencies
const { convertFromDirectory } = require('joi-to-typescript');
const fs = require('fs-extra');

const SOURCE_TYPE_DIR = 'joi-types';
const TARGET_TYPE_DIR = 'src/types';

async function types() {
  // eslint-disable-next-line no-console
  console.log('Running joi-to-typescript...');

  fs.removeSync(TARGET_TYPE_DIR);

  // Configure your settings here
  const result = await convertFromDirectory({
    fileHeader: '/* eslint-disable @typescript-eslint/indent */',
    schemaDirectory: './src',
    inputFileFilter: /(schema.ts|extension.ts)/,
    typeOutputDirectory: SOURCE_TYPE_DIR,
    debug: true,
  });

  if (result) {
    // eslint-disable-next-line no-console
    console.log('Completed joi-to-typescript');
    fs.removeSync(`${SOURCE_TYPE_DIR}/payment`);
    fs.removeSync(`${SOURCE_TYPE_DIR}/service-configs`);
    fs.moveSync(SOURCE_TYPE_DIR, TARGET_TYPE_DIR);
  } else {
    // eslint-disable-next-line no-console
    console.log('Failed to run joi-to-typescript');
  }
}

types();
