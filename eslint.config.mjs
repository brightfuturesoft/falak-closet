import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client — gitignored output from an earlier generator
    // config that nothing imports (the app uses `@prisma/client`). Linting it
    // buries real findings under thousands of generated-code warnings.
    "src/generated/**",
  ]),
]);

export default eslintConfig;
