const path = require('path');

module.exports = {
  root: true,
  extends: ['@arcblock/eslint-config-ts/base'],
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.eslint.json'),
  },
  rules: {
    // 'padding-line-between-statements': ['error', { blankLine: 'always', prev: 'const', next: '*' }],
    '@typescript-eslint/comma-dangle': 'off',
    'import/prefer-default-export': 'off',
    'no-use-before-define': ['error', 'nofunc'],
  },
};
