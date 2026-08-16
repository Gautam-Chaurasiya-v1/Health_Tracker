module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@nozbe/watermelondb|zustand)',
  ],
  moduleNameMapper: {
    '^react-native/setup-env$': '<rootDir>/jest/setup-env.js',
    '^test-renderer$': '<rootDir>/node_modules/react-test-renderer',
    '^test-renderer/(.*)$': '<rootDir>/node_modules/react-test-renderer/$1',
  },
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/theme/**',
  ],
};
