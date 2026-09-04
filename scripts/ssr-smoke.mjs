import { createServer } from "vite";
import React from "react";
import { renderToString } from "react-dom/server";

globalThis.window = {
  location: { hash: "", replace: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout,
  clearTimeout,
};
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
globalThis.document = {
  body: { style: {} },
  getElementById: () => null,
  addEventListener: () => {},
  removeEventListener: () => {},
};

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const { default: App } = await server.ssrLoadModule("/src/App.tsx");
  const html = renderToString(React.createElement(App));
  console.log("RENDER_OK length=" + html.length);
  const checks = ["Agamiz", "Discover", "Watchlist", "Settings", "Search"];
  let missing = 0;
  for (const c of checks) {
    if (!html.includes(c)) {
      console.log("MISSING: " + c);
      missing++;
    }
  }
  if (missing === 0) console.log("CONTENT_OK");
  console.log("NOTE: dynamic rows (Trending/Popular) only render after data loads; expected to be absent in SSR first pass.");
} catch (err) {
  console.error("RENDER_FAILED");
  console.error(err && err.stack ? err.stack : err);
  process.exitCode = 1;
} finally {
  await server.close();
}
