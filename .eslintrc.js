module.exports = {
  plugins: ['sonarjs', 'monorepo-cop'],
  extends: ['@arcblock/eslint-config', 'plugin:monorepo-cop/recommended'],
  parserOptions: {
    ecmaVersion: 2022,
  },
  rules: {
    // @see: https://github.com/SonarSource/eslint-plugin-sonarjs#rules
    'sonarjs/no-redundant-jump': 'error',
    'sonarjs/prefer-single-boolean-return': 'error',
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
  overrides: [
    {
      files: ['core/state/**'],
      rules: {
        'no-promise-executor-return': 'off',
        'default-param-last': 'off',
        'no-continue': 'off',
      },
    },
  ],
};
