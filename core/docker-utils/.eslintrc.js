const path = require('node:path');

module.exports = {
  root: true,
  extends: ['@arcblock/eslint-config-ts/base'],
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.eslint.json'),
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'import/prefer-default-export': 0,
    'no-use-before-define': ['error', 'nofunc'],
    // 'padding-line-between-statements': ['error', { blankLine: 'always', prev: 'const', next: '*' }],
  },
};
