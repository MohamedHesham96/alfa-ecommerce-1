import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next-docs/**",
      ".swc/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "public/sw.js",
      "public/sw-policies.js",
    ],
  },
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      // React Compiler is not enabled for this app. The upgraded
      // eslint-plugin-react-hooks exposes compiler diagnostics as errors,
      // which would otherwise flag the existing non-compiler codebase.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "warn",
    },
  },
];
