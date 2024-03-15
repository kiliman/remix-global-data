import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import { init, getAppGlobals } from "./global-data";
import { AppGlobalsScript } from "./AppGlobals";
import React from "react";

// initialize the app globals
// this should only run on the server
// to support top-level await, update vite.config to build.target = "esnext"
if (init) {
  await init();
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        {/* this component serializes app globals as a script */}
        <AppGlobalsScript />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // we can access app globals from UI components
  const appGlobals = getAppGlobals();
  return (
    <>
      <Outlet />
      <h3>App Globals in App</h3>
      <pre>{JSON.stringify(appGlobals, null, 2)}</pre>
    </>
  );
}

export function ErrorBoundary() {
  // we can access app globals from ErrorBoundary
  const appGlobals = getAppGlobals();

  const error = useRouteError();
  let message = "";
  let hostname = "";
  let status = 500; // default to error 500
  if (isRouteErrorResponse(error)) {
    message = error.data;
    status = error.status;
  } else {
    message = (error as Error).message;
  }
  // hostname is marshalled in error message as JSON from handleError
  if (message.startsWith("{")) {
    const d = JSON.parse(message);
    message = d.message;
    hostname = d.hostname;
  }
  if (!hostname && typeof document !== "undefined") {
    hostname = document.location.hostname;
  }

  return (
    <>
      <h1>
        {message} @ {hostname}
      </h1>
      <h2>Error Status: {status}</h2>

      <h3>App Globals in ErrorBoundary</h3>
      <pre>{JSON.stringify(appGlobals, null, 2)}</pre>
    </>
  );
}
