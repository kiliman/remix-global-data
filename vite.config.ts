import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import viteEnvOnly from "vite-env-only";

installGlobals();

export default defineConfig({
  build: {
    target: "esnext",
  },
  plugins: [viteEnvOnly(), remix(), tsconfigPaths()],
});
