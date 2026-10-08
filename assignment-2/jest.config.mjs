export default {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "@swc/jest",
      {
        jsc: { parser: { syntax: "typescript" }, target: "es2023" },
        module: { type: "es6" },
      },
    ],
  },
  // Every suite resets the same PostgreSQL tables; do not run suites concurrently.
  maxWorkers: 1,
};
