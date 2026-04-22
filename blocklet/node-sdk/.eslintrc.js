const path = require('path');

module.exports = {
  root: true,
  extends: ['@arcblock/eslint-config-ts/base'],
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.eslint.json'),
  },
  rules: {
    'no-use-before-define': ['error', 'nofunc'],
    '@typescript-eslint/comma-dangle': 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
    ],
    'import/prefer-default-export': 'off',
  },
};
