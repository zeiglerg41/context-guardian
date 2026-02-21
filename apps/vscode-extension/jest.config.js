module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^vscode$': '<rootDir>/tests/__mocks__/vscode.ts',
  },
};
