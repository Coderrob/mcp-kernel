export default {
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'scripts/release.mjs'],
      exclude: ['src/**/*.test.ts', 'src/types/**'],
      thresholds: {
        perFile: true,
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
  },
};
