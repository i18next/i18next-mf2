/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  reportUnusedDisableDirectives: true,
  env: {
    browser: true,
  },
  extends: ['airbnb-base', 'prettier'],
  rules: {
    'no-plusplus': 'off',
    'no-param-reassign': 'off',
    'prefer-destructuring': 'off',
    'default-param-last': 'off',
    'prefer-spread': 'off',
    'no-continue': 'off',
    'no-constructor-return': 'off',
    'consistent-return': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-use-before-define': 'off',
    'no-shadow': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
  },
  overrides: [
    {
      files: ['./test/**/*'],
      rules: {
        'no-console': 'off',
        'no-restricted-syntax': 'off',
      },
    },
  ],
};
