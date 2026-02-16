import { config } from "@storacha-chainlink/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: [
      "ignition/deployments/**",
      "artifacts/**",
      "cache/**",
      "typechain-types/**",
      "coverage/**",
    ],
  },
];
