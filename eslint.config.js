import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly'
      }
    },
    rules: {
      // Vue specific rules
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'vue/require-default-prop': 'off',
      'vue/require-prop-types': 'off',
      'vue/no-required-prop-with-default': 'off',
      
      // JavaScript rules
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^(props|emit)$'
      }],
      'prefer-const': 'error',
      'no-useless-catch': 'off',
      
      // Code quality
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-var': 'error'
    }
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.js']
  }
]