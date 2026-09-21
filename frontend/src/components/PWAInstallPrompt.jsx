import { useEffect, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import './PWAInstallPrompt.css';

export default function PWAInstallPrompt() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    const handleUpdate = () => setUpdateReady(true);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('campushub:sw-update', handleUpdate);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('campushub:sw-update', handleUpdate);
    };
  }, []);

  function updateApp() {
    navigator.serviceWorker?.getRegistration().then((registration) => {
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      setUpdateReady(false);
    });
  }

  return (
    <>
      {offline && <div className="pwa-offline-bar"><WifiOff size={15} /> You are offline</div>}
      {updateReady && (
        <div className="pwa-notice pwa-update-notice" role="status">
          <span>New version available</span>
          <button type="button" onClick={updateApp}><RefreshCw size={15} /> Update Now</button>
        </div>
      )}
    </>
  );
}
