/** Jest config for unit tests (NestJS / CommonJS + ts-jest).
 *  Run:  npx jest      (add "test": "jest" to package.json scripts if desired) */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  testEnvironment: 'node',
  clearMocks: true,
};
