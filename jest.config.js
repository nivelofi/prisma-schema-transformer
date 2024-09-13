module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/**jest.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/lib/'],
  moduleDirectories: ['src', 'node_modules'],
  maxWorkers: '50%'
}
