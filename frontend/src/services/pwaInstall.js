import { useEffect, useState } from 'react';

let deferredPrompt = null;
let installed = false;
const listeners = new Set();

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}

function getState() {
  return {
    installed: installed || isStandalone(),
    canInstall: Boolean(deferredPrompt),
    isIos: isIos(),
  };
}

function notify() {
  const state = getState();
  listeners.forEach((listener) => listener(state));
}

if (typeof window !== 'undefined') {
  installed = isStandalone();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });

  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', (event) => {
    installed = event.matches || window.navigator.standalone === true;
    notify();
  });
}

export function usePWAInstall() {
  const [state, setState] = useState(getState);

  useEffect(() => {
    listeners.add(setState);
    setState(getState());
    return () => listeners.delete(setState);
  }, []);

  async function install() {
    if (getState().installed) return { outcome: 'installed' };
    if (!deferredPrompt) return { outcome: isIos() ? 'ios' : 'unsupported' };

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (choice.outcome === 'accepted') installed = true;
    notify();
    return { outcome: choice.outcome };
  }

  return { ...state, install };
}
