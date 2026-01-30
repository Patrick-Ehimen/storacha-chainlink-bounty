import { nextJsConfig } from "./packages/eslint-config/next.js";

export default [
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  },
  ...nextJsConfig.map((config) => ({
    ...config,
    files: ["apps/frontend/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
  })),
];
