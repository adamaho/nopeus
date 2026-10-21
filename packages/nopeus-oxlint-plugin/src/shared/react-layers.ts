/** Replaceable React layer lists, shared by the rule defaults and the `/react` preset. */
export const reactLayerDefaults = {
  files: ["src/**"],
  routes: ["src/routes/**"],
  adapters: ["src/navigation/**"],
  containers: ["src/features/**/page.{ts,tsx}", "src/features/**/*-container.{ts,tsx}"],
  data: ["src/data/**", "src/features/**/data/**"],
  routerModules: ["react-router", "react-router-dom", "@tanstack/react-router"],
  queryModules: ["@tanstack/react-query", "swr"],
  clientModules: [],
};
