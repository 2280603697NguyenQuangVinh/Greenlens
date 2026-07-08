const SW_URL = "/sw.js"

function isChildAppPath(pathname: string): boolean {
  return !pathname.startsWith("/admin")
}

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return
  if (!isChildAppPath(window.location.pathname)) return
  if (import.meta.env.DEV) return

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(SW_URL).catch((error) => {
      console.error("Service worker registration failed", error)
    })
  })
}
