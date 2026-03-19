import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'app',
  typescript: true,
  react: true,
  jsonc: true,

  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },

  ignores: [
    'android/',
    'ios/',
    'coverage/',
    '.expo/',
    'dist/',
    'node_modules/',
    'website/',
    'expo-env.d.ts',
    'docs/',
  ],
}, {
  // React Native: StyleSheet.create at bottom of file is idiomatic
  rules: {
    'ts/no-use-before-define': ['error', {
      functions: false,
      classes: false,
      variables: false,
    }],
  },
}, {
  // Test files: allow require() and relaxed rules
  files: ['__tests__/**'],
  rules: {
    'ts/no-require-imports': 'off',
  },
})
