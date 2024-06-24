import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import pluginPrettier from 'eslint-plugin-prettier';

export default [
  { files: ['**/*.ts'] },
  { languageOptions: { globals: globals.browser } },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginImport.configs.recommended,
  ...pluginPrettier.configs.recommended,
];
