import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // regra nova do plugin (v7) com muitos falsos positivos em padroes legitimos de fetch
      'react-hooks/set-state-in-effect': 'off',
      // permite imports nao usados quando comecam com letra maiuscula (React em arquivos shadcn)
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['src/components/ui/**/*.jsx', 'src/context/**/*.jsx'],
    rules: {
      // shadcn agrupa primitivos + sub-componentes; AuthContext exporta provider + hook
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
