module.exports = {
  root: true,
  extends: [
    'expo',
    'prettier',
  ],
  rules: {
    // Allow require() in config files
    '@typescript-eslint/no-require-imports': 'off',
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/'],
};
