const path = require('path');

module.exports = {
  root: true,
  extends: ['@arcblock/eslint-config-ts/base'],
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.eslint.json'),
  },
  rules: {
    'no-use-before-define': ['error', 'nofunc'],
    'import/no-unresolved': ['error', { ignore: ['^bun:'] }],
    'import/prefer-default-export': 'off',
    // 'padding-line-between-statements': ['error', { blankLine: 'always', prev: 'const', next: '*' }],
  },
};
