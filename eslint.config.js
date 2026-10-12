import js from '@eslint/js'
import globals from 'globals'
import jsxA11yX from 'eslint-plugin-jsx-a11y-x'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier/flat'
import { defineConfig, globalIgnores } from 'eslint/config'

const sharedRules = {
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/consistent-type-imports': 'error',
}

export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    'backend/dist',
    'backend/node_modules',
    'backend/prisma/migrations',
  ]),
  {
    name: 'frontend',
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11yX.configs.recommended,
      prettier,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: sharedRules,
  },
  {
    name: 'backend',
    files: ['backend/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: sharedRules,
  },
])
