import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './styles/global.css';

// Never use the PWA cache on the Vite development server, including LAN devices.
// A phone reaches dev through the PC's IP, so hostname-only localhost detection is insufficient.
const isDevelopmentServer = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
  || window.location.port === '5175';

if ('serviceWorker' in navigator && !isDevelopmentServer) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      if (registration.waiting) window.dispatchEvent(new Event('campushub:sw-update'));
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new Event('campushub:sw-update'));
          }
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  });
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {});
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes — keeps data fresh, eliminates redundant API calls
      gcTime: 30 * 60 * 1000,         // 30 minutes in memory cache
      retry: 1,
      refetchOnWindowFocus: false,    // No unnecessary background refetching on tab switch
      refetchOnReconnect: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface-raised)',
                  color: 'var(--ink)',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
