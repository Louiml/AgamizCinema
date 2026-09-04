export const POPUP_GUARD_FLAG = "__AGAMIZ_GUARD__";

export function installPopupGuard(): void {
  if ((window as unknown as Record<string, unknown>)[POPUP_GUARD_FLAG]) return;
  (window as unknown as Record<string, unknown>)[POPUP_GUARD_FLAG] = true;

  const log = (message: string) => {
    if (import.meta.env.DEV) console.debug("[popup-guard]", message);
  };

  try {
    Object.defineProperty(window, "open", {
      configurable: false,
      writable: false,
      value: () => {
        log("blocked window.open");
        return null;
      },
    });
  } catch {
  }

  document.addEventListener(
    "click",
    (event) => {
      if (event.defaultPrevented) return;
      const el = event.target;
      const anchor =
        el instanceof Element ? el.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor) return;
      const target = (anchor.getAttribute("target") ?? "").toLowerCase();
      const href = (anchor.getAttribute("href") ?? "").trim().toLowerCase();
      if (target === "_blank") {
        event.preventDefault();
        event.stopImmediatePropagation();
        log("blocked _blank link");
        return;
      }
      if (href.startsWith("javascript:")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        log("blocked javascript: link");
      }
    },
    true,
  );

  const style = document.createElement("style");
  style.setAttribute("data-agamiz-guard", "");
  style.textContent =
    "iframe[src*=ad], .ad-overlay, [id*=ad-container], [class*=adbox] { display:none !important; }";
  document.documentElement.appendChild(style);
}