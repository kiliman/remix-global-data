# 🌎 Remix Global App Data

In a typical Remix app, data that is needed in a route component must be
returned from a loader. If you need global data in your app, it is recommended
that you return that data from the _root_ loader. This is even called out in the
Remix documentation for things like [environment
variables](https://remix.run/docs/en/main/guides/envvars#browser-environment-variables).

See example app: https://remix-global-data-production.up.railway.app/

## ⛔️ `ErrorBoundary`

However, there is one drawback to this process. Remix will render your
`ErrorBoundary` whenever there is an error in your application. Unfortunately,
you are unable to use the `useLoaderData` hook in your error boundary because
Remix assumes that `useLoaderData` returns data on the _happy path_. That is,
the loader executed successfully, and you should be able to access the data.

If an error occurs, Remix cannot guarantee that the error did not happen in one
of the loaders. To work around this, you should use the `useRouteLoaderData`
hook. This hook lets you specify the route ID to retrieve the loader data. Since
the data may not exist due to an error or an invalid ID, you should check for
`undefined` before accessing it. You are still stuck if you must access the
global data in your error boundary.

## 🔁 Redundant fetches

Another drawback of returning global data in your _root_ loader is that the
loader may be called multiple times throughout the life cycle of your
application. For example, the loader will be called during revalidation after
every mutation. In addition, the new _Single Data Fetch_ RFC will ensure that
the _root_ loader is called for _every_ navigation (unless you export the
`shouldRevalidate` function).

There should be a way to provide data that is truly global to your app and leave
the _root_ loader to handle user or request-specific data.

## 🎉 Solution

This repo shows a simple and effective way to manage global data that is
accessible from your loaders, route components, as well as your error boundary.
It uses a trick similar to how Remix serializes its own internal context in the
initial HTML payload.

### Initialize global data

There is a helper object named `AppGlobals` that enables you to set and get the
global data. In your root layout, you initialize the global data by calling
`AppGlobals.set`.

Use the `serverOnly$` helper from `vite-env-only` to ensure that the setter is
only included in the server bundle. Export the initialization function that is
to be called from your root layout.

This also supports async functions, so you can use things like `fetch` or
`fs/promises`.

```ts
// app/global-data.ts

// define a type for your app globals
type AppGlobalsType = {
  APP_NAME: string;
  NODE_ENV: string;
  VITE_TEST: string;
  CLIENT_KEY: string;
  ENV_FILE: string[];
};
a;
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
```

### `<AppGlobalsScript>`

Make sure you call the `init` function at the start of your root layout. If you
are using promises, you will need to use `await`.

Include the `<AppGlobalsScript>` before the `<Scripts>` tag in your root layout.
This will serialize the global data

```ts
// app/root.tsx
import { init, getAppGlobals } from "./global-data";
import { AppGlobalsScript } from "./AppGlobals";

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
```

### Usage

Now that you have initialized the app globals, you can use the data from any
loader, route component, and error boundary by simply calling `getAppGlobals`.

```ts
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
```

### Access Request Data in `ErrorBoundary`

Sometimes, you need to be able to access request-specific data inside your error
boundary. For example, you may have a single app that hosts multiple clients,
and you need to update the branding based on the host header.

Since the error boundary does not have access to the request, and if it is
rendered on the server, it will not have access to the browser URL. We need a
way to send that data to the error boundary _out-of-band_.

Remix allows you to export a custom `handleError` function in your
_entry.server.tsx_ file. This function provides the error object (or error
response data if it was a thrown response). This is the same object that is
passed to the error boundary via the`useRouteError` hook. Luckily, we are able
to _mutate_ this object to include the data we want. Unfortunately, you are not
able to add additional properties to the object. However, you can modify the
`error.message` and `error.data` properties.

By updating these properties with a JSON payload, we can _marshal_ our request
data to be parsed in the error boundary.

> NOTE: Since `handleError` is not called for client-side errors, be careful of
> what data you are using here. Data that can be derived on the client, like
> `document.location.hostname` is safe. For other data, you may consider using
> cookies. This is left as an excercise for the reader.

```ts
// app/entry.server.tsx

// since the ErrorBoundary can not access loader data, if we need to access
// any data that is dependent on the current request, we need to marshal
// that data into the error message so we can access it in the ErrorBoundary
// here, we are marshalling the hostname into the error message as JSON
// the error object is mutated and Remix simply returns the updated object
export function handleError(
  error: Error | ErrorResponse,
  { request }: LoaderFunctionArgs
) {
  const url = new URL(request.url);
  if ("data" in error) {
    const e = error as ErrorResponse;
    e.data = JSON.stringify({ message: e.data, hostname: url.hostname });
  } else {
    const e = error as Error;
    e.message = JSON.stringify({ message: e.message, hostname: url.hostname });
  }
}
```
