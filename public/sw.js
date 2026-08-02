// Minimal service worker: no offline caching (explicitly out of scope for
// the MVP), it only exists so Chrome's PWA install criteria are met.
self.addEventListener("fetch", () => {});
