/**
 * Register service worker for offline shell.
 * Skips localhost; unregisters broken v1 workers.
 */

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Dev HMR fights SW
  if (process.env.NODE_ENV !== "production") {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => void r.unregister());
    });
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Force update check so deploys don't stick on old SW
        void reg.update();
      })
      .catch((err) => {
        console.warn("[NeuraBinder] SW registration failed", err);
      });
  });
}

/** Call from Settings if the PWA shell acts broken after a deploy */
export async function unregisterServiceWorkers() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}
