// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  globalIgnores(['dist/', '.expo/']),
  expoConfig,
  prettierConfig,
  {
    rules: {
      // Allow require() in config files
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['jest.setup.js'],
    languageOptions: { globals: { jest: 'readonly' } },
  },
  {
    // i18next's documented API is the default instance's methods, such as i18n.use().
    files: ['src/i18n/index.ts'],
    rules: { 'import/no-named-as-default-member': 'off' },
  },
]);
