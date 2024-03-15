import { serverOnly$ } from "vite-env-only";
import { AppGlobals } from "./AppGlobals";
import fs from "node:fs/promises";
import path from "node:path";

// define a type for your app globals
type AppGlobalsType = {
  APP_NAME: string;
  NODE_ENV: string;
  VITE_TEST: string;
  CLIENT_KEY: string;
  ENV_FILE: string[];
};

// export a function that returns the app globals with the correct type
export function getAppGlobals(): AppGlobalsType {
  return AppGlobals.get<AppGlobalsType>();
}

// export a function that initializes the app globals
// this uses serverOnly$ to ensure it only runs on the server
// and it supports async code
export const init = serverOnly$(async () =>
  AppGlobals.set<AppGlobalsType>({
    APP_NAME: "Remix App",
    NODE_ENV: process.env.NODE_ENV,
    VITE_TEST: import.meta.env.VITE_TEST,
    CLIENT_KEY: String(process.env.CLIENT_KEY),
    ENV_FILE: (await readEnvFile()).split("\n"),
  })
);

function readEnvFile() {
  return fs.readFile(path.resolve(process.cwd(), ".env"), "utf-8");
}
