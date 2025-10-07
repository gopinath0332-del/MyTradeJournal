import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'

export default [
  // Ignore files (replaces .eslintignore)
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-ssr/**',
      'build/**',
      '.env*',
      '*.log',
      '.cache/**',
      '.vscode/**',
      '.idea/**',
      '.DS_Store',
      'coverage/**',
      '*.tmp',
      '*.temp',
      'public/**'
    ]
  },

  // Apply recommended JavaScript rules
  js.configs.recommended,

  // Apply recommended Vue 3 rules
  ...pluginVue.configs['flat/recommended'],

  // TypeScript configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.node.json']
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Disable conflicting JS rules for TS files
      'no-unused-vars': 'off',
      'no-undef': 'off' // TypeScript handles this
    }
  },

  // Vue TypeScript configuration
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // TypeScript-specific rules for Vue files
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Disable conflicting JS rules for TS in Vue files
      'no-unused-vars': 'off',
      'no-undef': 'off' // TypeScript handles this
    }
  },

  // Global configuration
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        localStorage: 'readonly',
        confirm: 'readonly',
        // Node globals for config files
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Vite globals
        import: 'readonly'
      }
    },

    rules: {
      // JavaScript Rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      'no-undef': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': 'error',
      'arrow-spacing': 'error',
      'comma-dangle': ['error', 'never'],
      'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
      'semi': ['error', 'never'],
      'indent': ['error', 2, { 'SwitchCase': 1 }],
      'eol-last': 'error',
      'no-trailing-spaces': 'error',
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
      'comma-spacing': ['error', { 'before': false, 'after': true }],
      'space-before-function-paren': ['error', 'never'],
      'keyword-spacing': 'error',
      'space-infix-ops': 'error',

      // Vue.js Rules
      'vue/html-self-closing': ['error', {
        'html': {
          'void': 'never',
          'normal': 'always',
          'component': 'always'
        },
        'svg': 'always',
        'math': 'always'
      }],
      'vue/max-attributes-per-line': ['error', {
        'singleline': { 'max': 3 },
        'multiline': { 'max': 1 }
      }],
      'vue/html-indent': ['error', 2, {
        'attribute': 1,
        'baseIndent': 1,
        'closeBracket': 0,
        'alignAttributesVertically': true,
        'ignores': []
      }],
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/component-name-in-template-casing': ['error', 'PascalCase', {
        'registeredComponentsOnly': false
      }],
      'vue/html-closing-bracket-newline': ['error', {
        'singleline': 'never',
        'multiline': 'always'
      }],
      'vue/html-closing-bracket-spacing': 'error',
      'vue/prop-name-casing': ['error', 'camelCase'],
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/multi-word-component-names': 'off', // Allow single-word component names
      'vue/no-v-html': 'warn',
      'vue/order-in-components': 'error',
      'vue/this-in-template': 'error',
      'vue/no-unused-components': 'warn',
      'vue/no-unused-vars': 'error',
      'vue/require-default-prop': 'error',
      'vue/require-prop-types': 'error',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'error',

      // Vue 3 Composition API specific
      'vue/no-multiple-template-root': 'off', // Vue 3 allows multiple root nodes

      // Accessibility Rules
      'vue/no-template-shadow': 'error'
    }
  },

  // File-specific overrides
  {
    files: ['**/*.vue'],
    rules: {
      'indent': 'off' // Let vue/html-indent handle Vue files
    }
  },

  {
    files: ['vite.config.js', '*.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  },

  {
    files: ['src/firebase/**/*.js'],
    rules: {
      'no-console': 'off' // Allow console logs in Firebase service files for debugging
    }
  }
]
