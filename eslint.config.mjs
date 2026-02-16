import { config as baseConfig } from "@storacha-chainlink/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  },
];
