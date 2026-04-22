module.exports = {
  root: true,
  extends: '@arcblock/eslint-config',
  rules: {
    'react/jsx-uses-react': 'error',
    'no-use-before-define': ['error', 'nofunc'],
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
