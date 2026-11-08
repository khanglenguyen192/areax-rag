import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Builds a `no-restricted-imports` rule from [pattern group, message] pairs. */
function restrict(...entries) {
  return {
    "no-restricted-imports": [
      "error",
      { patterns: entries.map(([group, message]) => ({ group, message })) },
    ],
  };
}

const NO_SERVER = [["@/server/**"], "Client code must never import from src/server (section 7)."];
const ONLY_COMMON_HOOKS = [
  ["@/hooks/*", "!@/hooks/common", "!@/hooks/common/*"],
  "Only generic hooks from @/hooks/common may be used here (section 6.3).",
];
const NO_FEATURES = [["@/features/**"], "Presentational tiers must not import from features."];
const NO_LIB = [["@/lib/**"], "Only pages, features and hooks may use lib/ (section 11)."];
const NO_MUI_CORE = [
  ["@mui/material", "@mui/material/*", "@mui/material-nextjs/*"],
  "Wrap MUI in an atom; import @mui/material only in atoms and providers (section 9).",
];
const NO_UPWARD_FROM = (tiers) => [
  tiers.map((tier) => `@/components/${tier}`).concat(tiers.map((tier) => `@/components/${tier}/*`)),
  "Imports must go downward: atoms <- molecules <- organisms <- templates <- pages (section 6.3).",
];
const NO_MODEL = [
  ["@/model/**"],
  "Atoms, molecules and templates take generic props, not DTOs (section 6.7).",
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/server/**", "src/app/api/**"],
    rules: restrict(NO_SERVER),
  },
  {
    files: ["src/components/atoms/**/*.{ts,tsx}"],
    rules: restrict(
      NO_SERVER,
      ONLY_COMMON_HOOKS,
      NO_FEATURES,
      NO_LIB,
      NO_MODEL,
      NO_UPWARD_FROM(["molecules", "organisms", "templates", "providers"]),
    ),
  },
  {
    files: ["src/components/molecules/**/*.{ts,tsx}"],
    rules: restrict(
      NO_SERVER,
      ONLY_COMMON_HOOKS,
      NO_FEATURES,
      NO_LIB,
      NO_MODEL,
      NO_MUI_CORE,
      NO_UPWARD_FROM(["organisms", "templates", "providers"]),
    ),
  },
  {
    files: ["src/components/organisms/**/*.{ts,tsx}"],
    rules: restrict(
      NO_SERVER,
      ONLY_COMMON_HOOKS,
      NO_FEATURES,
      NO_LIB,
      NO_MUI_CORE,
      NO_UPWARD_FROM(["templates", "providers"]),
    ),
  },
  {
    files: ["src/components/templates/**/*.{ts,tsx}"],
    rules: restrict(
      NO_SERVER,
      ONLY_COMMON_HOOKS,
      NO_FEATURES,
      NO_LIB,
      NO_MODEL,
      NO_MUI_CORE,
      NO_UPWARD_FROM(["organisms", "providers"]),
    ),
  },
  {
    files: ["src/hooks/**/*.{ts,tsx}"],
    rules: restrict(NO_SERVER, [
      [
        "@/components/atoms/**",
        "@/components/molecules/**",
        "@/components/organisms/**",
        "@/components/templates/**",
      ],
      "A hook never imports a component (section 8.7).",
    ]),
  },
]);
