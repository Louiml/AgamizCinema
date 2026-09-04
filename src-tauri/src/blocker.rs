use tauri::webview::{NewWindowResponse, WebviewWindowBuilder};
use tauri::Url;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum WindowMode {
    App,
    Embedded,
}

const EMBED_ALLOWED_HOSTS: &[&str] = &[
    "vidsync.live",
    "vidsrc.to",
    "vidsrc.me",
    "vidsrc.net",
    "vidnest.fun",
    "videasy.net",
    "player.videasy.net",
    "cinesrc.st",
    "vidrocks.cc",
    "vidrock.net",
];

fn host_or_subdomain(host: &str, allowed: &str) -> bool {
    host == allowed || host.strip_suffix(allowed).is_some_and(|pre| pre.ends_with('.'))
}

fn host_allowed(host: &str, mode: WindowMode) -> bool {
    match mode {
        WindowMode::App => host == "localhost" || host.ends_with(".localhost"),
        WindowMode::Embedded => EMBED_ALLOWED_HOSTS
            .iter()
            .any(|allowed| host_or_subdomain(host, allowed)),
    }
}

pub fn allow_navigation(url: &Url, mode: WindowMode) -> bool {
    let scheme = url.scheme();
    if matches!(scheme, "tauri" | "ipc" | "asset" | "capacitor") {
        return true;
    }
    if scheme == "about" {
        return mode == WindowMode::Embedded;
    }
    if scheme == "data" {
        return mode == WindowMode::App;
    }
    if scheme == "http" || scheme == "https" {
        return url.host_str().is_some_and(|h| host_allowed(h, mode));
    }
    false
}

pub fn harden<M: tauri::Manager<tauri::Wry>>(
    builder: WebviewWindowBuilder<'_, tauri::Wry, M>,
    mode: WindowMode,
) -> WebviewWindowBuilder<'_, tauri::Wry, M> {
    builder
        .initialization_script_for_all_frames(POPUP_GUARD_SCRIPT)
        .initialization_script_for_all_frames(DOM_CLEAN_SCRIPT)
        .on_navigation(move |url| allow_navigation(url, mode))
        .on_new_window(move |_url, _features| NewWindowResponse::Deny)
}

pub const POPUP_GUARD_SCRIPT: &str = r#"(function () {
  'use strict';
  if (window.__AGAMIZ_GUARD__) return;
  window.__AGAMIZ_GUARD__ = true;
  var log = function (m) { try { console.debug('[guard]', m); } catch (e) {} };

  try {
    Object.defineProperty(window, 'open', {
      configurable: false,
      writable: false,
      value: function agamizBlockedOpen() {
        log('blocked window.open');
        return null;
      }
    });
  } catch (e) {}

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var el = e.target;
    var a = el && el.closest ? el.closest('a[href]') : null;
    if (!a) return;
    var target = (a.getAttribute('target') || '').toLowerCase();
    var href = (a.getAttribute('href') || '').trim().toLowerCase();
    if (target === '_blank') {
      e.preventDefault();
      e.stopImmediatePropagation();
      log('blocked _blank link');
      return;
    }
    if (href.indexOf('javascript:') === 0) {
      e.preventDefault();
      e.stopImmediatePropagation();
      log('blocked javascript: link');
    }
  }, true);

  var s = document.createElement('style');
  s.setAttribute('data-agamiz-guard', '');
  s.textContent = 'iframe[src*=ad], .ad-overlay, [id*=ad-container], [class*=adbox] { display:none !important; }';
  if (document.documentElement) document.documentElement.appendChild(s);
})();
"#;

pub const DOM_CLEAN_SCRIPT: &str = r#"(function () {
  'use strict';
  if (window.__AGAMIZ_CLEAN__) return;
  window.__AGAMIZ_CLEAN__ = true;

  var STYLE_ID = '__agamiz_clean_view__';
  var enabled = false;
  var styleEl = null;
  var observer = null;

  function rules() {
    return (
      /* Hide common clutter (sidebars, headers, banners, ad slots). */
      'aside, [class*="sidebar"], [class*="side-bar"], [class*="banner"],' +
      '[class*="advert"], [id*="ad-slot"], [class*="ad-container"], iframe[src*="ad"],' +
      '.ad, .ads { display:none !important; }' +
      /* Focus the media: kill surrounding layout so the video owns the view. */
      'html, body { margin:0 !important; padding:0 !important; overflow:hidden !important;' +
      'background:#000 !important; }' +
      'video { display:block !important; max-width:none !important; max-height:none !important;' +
      'width:100vw !important; height:100vh !important; object-fit:contain !important;' +
      'background:#000 !important; }'
    );
  }

  function applyStyle() {
    if (!enabled) return;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      if (document.head) document.head.appendChild(styleEl);
    }
    styleEl.textContent = rules();
  }

  function teardown() {
    enabled = false;
    if (styleEl) { styleEl.remove(); styleEl = null; }
    if (observer) { observer.disconnect(); observer = null; }
    if (document.documentElement) document.documentElement.style.cssText = '';
    if (document.body) document.body.style.cssText = '';
  }

  function ensureObserver() {
    if (observer || typeof MutationObserver === 'undefined') return;
    observer = new MutationObserver(function () {
      if (enabled && styleEl) styleEl.textContent = rules();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function setClean(on) {
    if (on === enabled) return;
    enabled = on;
    if (enabled) { applyStyle(); ensureObserver(); }
    else { teardown(); }
  }

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.__agamizCleanView !== true && d.__agamizCleanView !== false) return;
    setClean(d.__agamizCleanView);
  }, false);

  teardown();
})();
"#;

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    fn url(s: &str) -> Url {
        Url::from_str(s).unwrap()
    }

    #[test]
    fn app_mode_blocks_external() {
        assert!(allow_navigation(&url("http://tauri.localhost"), WindowMode::App));
        assert!(allow_navigation(&url("tauri://localhost/index.html"), WindowMode::App));
        assert!(!allow_navigation(&url("https://ads.example.com/redir"), WindowMode::App));
        assert!(!allow_navigation(&url("https://vidsync.live/embed/movie/1"), WindowMode::App));
    }

    #[test]
    fn embedded_allows_stream_hosts() {
        assert!(
            allow_navigation(
                &url("https://vidsync.live/embed/movie/1"),
                WindowMode::Embedded
            ),
            "vidsync block"
        );
        assert!(
            allow_navigation(
                &url("https://player.videasy.net/tv/1/1"),
                WindowMode::Embedded
            ),
            "videasy block"
        );
        assert!(
            !allow_navigation(&url("https://evil.example.com/"), WindowMode::Embedded),
            "external allowed unexpectedly"
        );
    }
}