module.exports = {
  root: true,
  extends: [
    'expo',
    'prettier',
  ],
  rules: {
    // Allow require() in config files
    '@typescript-eslint/no-require-imports': 'off',
    // New in eslint-config-expo 58; they flag the latest-value ref pattern (CLAUDE.md, Known Pitfalls).
    'react-hooks/refs': 'off',
    'react-hooks/globals': 'off',
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/'],
};
