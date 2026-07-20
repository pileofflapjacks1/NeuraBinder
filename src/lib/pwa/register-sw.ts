/**
 * Register service worker for offline app shell (local-first).
 */

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Only in production builds (dev HMR fights SW)
  if (process.env.NODE_ENV !== "production") return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[NeuraBinder] SW registration failed", err);
    });
  });
}
