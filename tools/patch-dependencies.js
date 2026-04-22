/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const { glob } = require('glob');
const fs = require('fs-extra');

const patchesDir = path.join(__dirname, './patches/');
const patches = glob.sync('**/*.js', {
  cwd: patchesDir,
  nodir: true,
  absolute: false,
});

const targetDir = path.join(__dirname, '../node_modules/');

patches.forEach((x) => {
  const source = path.join(patchesDir, x);
  const target = path.join(targetDir, x);
  fs.copyFileSync(source, target);
  // eslint-disable-next-line no-console
  console.log(`Patched file ${target}`);
});
