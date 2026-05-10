import type { Config } from 'jest'

// jose v6 is pure ESM — Jest must run with NODE_OPTIONS=--experimental-vm-modules
// See package.json "test" script.
const config: Config = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/lib/**/*.test.ts', '**/__tests__/api/**/*.test.ts'],
      preset: 'ts-jest/presets/default-esm',
      extensionsToTreatAsEsm: ['.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            useESM: true,
            tsconfig: {
              module: 'ES2020',
              target: 'ES2020',
              esModuleInterop: true,
            },
          },
        ],
      },
    },
  ],
}
export default config
