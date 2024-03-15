let appGlobals: unknown = {};

declare global {
  interface Window {
    __AppGlobals__: unknown;
  }
}

export const AppGlobals = {
  get: getAppGlobals,
  set: setAppGlobals,
};

function setAppGlobals<T>(globals: T) {
  appGlobals = globals;
}

function getAppGlobals<T>(): T {
  if (typeof document !== "undefined") {
    return window.__AppGlobals__ as T;
  }
  return appGlobals as T;
}

// component to serialize app globals into the HTML
// this should be included in the <body> of your HTML
export function AppGlobalsScript() {
  const appGlobals = getAppGlobals();
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__AppGlobals__=${JSON.stringify(appGlobals)};`,
      }}
    ></script>
  );
}
