import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: { sourceType: 'module' },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  { ignores: ['dist/**', 'node_modules/**'] },
];
