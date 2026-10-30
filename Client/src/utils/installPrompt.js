// "Install app" support. Browsers fire `beforeinstallprompt` once, often before
// React has mounted, so it is captured here at start-up and replayed to any
// component that subscribes later.

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

export const isInstalledApp = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

// iPhone/iPad Safari has no install prompt; users add it from the Share menu.
export const isIosSafari = () => {
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return isIos && !/CriOS|FxiOS|EdgiOS/.test(ua);
};

export const initInstallPrompt = () => {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });

  // The push service worker also makes the site installable on Android/desktop.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/push-sw.js").catch(() => {});
    });
  }
};

export const canPromptInstall = () => Boolean(deferredPrompt);

export const promptInstall = async () => {
  if (!deferredPrompt) return false;
  const event = deferredPrompt;
  deferredPrompt = null;
  notify();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === "accepted";
};

export const subscribeInstallPrompt = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
