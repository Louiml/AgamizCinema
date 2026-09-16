import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import App from "./App";
import "./index.css";
import "flag-icons/css/flag-icons.min.css";

// NOTE: no frontend popup guard - patching window.open in the app frame only
// breaks our own "open in new tab" buttons (download, update, external links).
// Real popup-ad blocking: desktop injects blocker.rs into every frame; the
// web build sandboxes the player iframe (no allow-popups).

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
