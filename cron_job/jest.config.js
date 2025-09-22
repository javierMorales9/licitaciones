/** @type {import("jest").Config} */
export default {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],

  // 👇 OJO: ya NO tratamos .ts como ESM
  // extensionsToTreatAsEsm: [],

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
        useESM: false,          // <-- ejecuta tests en CommonJS
        transpilation: true      // <-- requerido con ts-jest + NodeNext mix
      }
    ]
  },

  transformIgnorePatterns: ["/node_modules/"],

  resolver: "<rootDir>/jest.resolver.cjs",

  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/?(*.)+(spec|test).ts"]
};
