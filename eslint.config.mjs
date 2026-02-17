import { config as baseConfig } from "@storacha-chainlink/eslint-config/base";
import { nextJsConfig } from "@storacha-chainlink/eslint-config/next-js";

const frontendFiles = ["apps/frontend/**/*.{js,jsx,ts,tsx}"];
const packageFiles = ["packages/**/*.{js,jsx,ts,tsx}"];

function withFiles(configs, files) {
  return configs.map((cfg) => ({
    ...cfg,
    files: cfg.files ?? files,
  }));
}

export default [
  ...withFiles(nextJsConfig, frontendFiles),
  ...withFiles(baseConfig, packageFiles),
];
