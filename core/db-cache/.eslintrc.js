const path = require('node:path');

module.exports = {
  root: true,
  extends: ['@arcblock/eslint-config-ts/base'],
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.eslint.json'),
  },
  rules: {
    '@typescript-eslint/comma-dangle': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    'import/prefer-default-export': 'off',
    'no-use-before-define': ['error', 'nofunc'],
    'import/no-unresolved': ['error', { ignore: ['^bun:', '@arcblock/event-hub/single'] }],
    // 'padding-line-between-statements': ['error', { blankLine: 'always', prev: 'const', next: '*' }],
  },
};
