const path = require('path');
const { glob } = require('glob');
const { writeFileSync, readFileSync } = require('fs');

const srcPath = path.join(__dirname, '../src');
const pkgPath = path.join(__dirname, '../package.json');

const EXPORTS = {
  '.': {
    import: './es/index.js',
    require: './lib/index.js',
  },
  './lib/': {
    import: './es/',
    require: './lib/',
  },
};

glob(path.join(srcPath, '*/**/index.{js,jsx}')).then((list) => {
  const components = list
    .sort()
    .filter((i) => !/demo/.test(i))
    .map((i) => path.relative(srcPath, path.parse(i).dir))
    .map((i) => ({
      [`./lib/${i}`]: {
        import: `./es/${i}/index.js`,
        require: `./lib/${i}/index.js`,
      },
    }));

  const json = JSON.parse(readFileSync(pkgPath).toString());
  json.exports = Object.assign({}, EXPORTS, ...components);
  writeFileSync(pkgPath, `${JSON.stringify(json, null, 2)}\n`);
});
