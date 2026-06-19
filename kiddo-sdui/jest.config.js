/** Lightweight unit-test runner for the pure engine logic
 *  (payload parser, overlay resolver, cart reducer). No native modules. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
};
