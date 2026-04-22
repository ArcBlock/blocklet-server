module.exports = {
  root: true,
  extends: '@arcblock/eslint-config',
  globals: {
    Cypress: true,
    cy: true,
  },
  rules: {
    'react/jsx-uses-react': 'error',
    'no-use-before-define': ['error', 'nofunc'],
    'import/prefer-default-export': 'off',
    'import/no-unresolved': ['error', { ignore: ['^bun:'] }],
    'react/require-default-props': [
      'error',
      {
        functions: 'defaultArguments',
        forbidDefaultForRequired: false,
      },
    ],
  },
};
