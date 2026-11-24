import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The app renders empty on the server and first client pass, then fills in from
      // localStorage / the network after mount, so server and client HTML always match.
      // That is a deliberate use of setState in an effect, which this rule flags.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated or vendored, not our code:
    "public/monaco/**", // copied from node_modules by scripts/copy-monaco.mjs
    "public/models/**",
    "drizzle/**",
  ]),
]);

export default eslintConfig;
