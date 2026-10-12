import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, WifiOff, Download, X, Share } from 'lucide-react';
import './PWAInstallPrompt.css';

const DISMISS_KEY = 'campushub_pwa_install_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PWAInstallPrompt() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [updateReady, setUpdateReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  // Check if previously dismissed within 7 days
  const isDismissedRecently = useCallback(() => {
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (!dismissed) return false;
      return Date.now() - Number(dismissed) < DISMISS_DURATION_MS;
    } catch {
      return false;
    }
  }, []);

  const dismissInstall = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // storage unavailable
    }
    setShowInstallBanner(false);
    setShowIosPrompt(false);
    setDeferredPrompt(null);
  }, []);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    const handleUpdate = () => setUpdateReady(true);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('campushub:sw-update', handleUpdate);

    // Check if already running in standalone display mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    // Listen for beforeinstallprompt event (Chromium, Edge, Android)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      if (isStandalone || isDismissedRecently()) return;
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Detect iOS Safari if not already installed
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari =
      /Safari/.test(navigator.userAgent) &&
      !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);

    if (isIos && isSafari && !isStandalone && !isDismissedRecently()) {
      // Slight delay so it doesn't immediately interrupt page load
      const iosTimer = setTimeout(() => {
        setShowIosPrompt(true);
      }, 3000);
      return () => clearTimeout(iosTimer);
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('campushub:sw-update', handleUpdate);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [isDismissedRecently]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setShowInstallBanner(false);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      } else {
        dismissInstall();
      }
    } catch {
      dismissInstall();
    }
  };

  const updateApp = () => {
    navigator.serviceWorker?.getRegistration().then((registration) => {
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      setUpdateReady(false);
    });
  };

  return (
    <>
      {offline && (
        <div className="pwa-offline-bar" role="status">
          <WifiOff size={14} />
          <span>Offline Mode — cached data active</span>
        </div>
      )}

      {updateReady && (
        <div className="pwa-notice pwa-update-notice" role="status">
          <div>
            <strong>CampusHub Update Ready</strong>
            <span>A new version is available with latest features.</span>
          </div>
          <button type="button" onClick={updateApp} aria-label="Update app">
            <RefreshCw size={14} /> Update Now
          </button>
        </div>
      )}

      {showInstallBanner && deferredPrompt && (
        <div className="pwa-notice pwa-install-notice" role="dialog" aria-label="Install CampusHub">
          <div>
            <strong>Install CampusHub App</strong>
            <span>Add to home screen for faster, offline-ready campus access.</span>
          </div>
          <div className="pwa-notice-actions">
            <button
              type="button"
              className="pwa-btn-primary"
              onClick={handleInstallClick}
              aria-label="Install CampusHub"
            >
              <Download size={14} /> Install
            </button>
            <button
              type="button"
              className="pwa-btn-dismiss"
              onClick={dismissInstall}
              aria-label="Dismiss installation prompt"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {showIosPrompt && (
        <div className="pwa-notice pwa-ios-notice" role="dialog" aria-label="Add CampusHub to Home Screen">
          <div>
            <strong>Install CampusHub on iOS</strong>
            <span>
              Tap <Share size={12} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> Share, then select <strong>Add to Home Screen</strong>.
            </span>
          </div>
          <button type="button" onClick={dismissInstall} aria-label="Dismiss iOS install hint">
            Got it
          </button>
        </div>
      )}
    </>
  );
}
