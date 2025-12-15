import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import './index.css';
import './styles/glassmorphism.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeStorage } from './utils/storageManager';
import { registerServiceWorker } from './utils/serviceWorker';

// Initialize storage - clears cache if app version changed
const storageResult = initializeStorage();
if (storageResult.wasCleared) {
  console.log('📦 Fresh start - localStorage was cleared due to version change');
}

// Create React Query client with optimized caching
// PHILOSOPHY: Show cached data INSTANTLY, refresh in background
// This eliminates loading spinners on navigation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // INSTANT RENDER: Cached data shown immediately
      // 1 hour staleTime = data appears fresh for 1 hour, then background refresh
      // Individual queries can override for faster/slower refresh needs
      staleTime: 60 * 60 * 1000,        // 1 hour - balance between fresh and instant

      // MEMORY SAFE: Keep unused data for 4 hours max
      // Prevents memory bloat while maintaining good UX for active sessions
      gcTime: 4 * 60 * 60 * 1000,       // 4 hours - reasonable for active session

      // BACKGROUND REFRESH: Update silently without blocking UI
      // 'always' = fetch fresh data on every mount, but show cache instantly
      // This ensures users always see fresh data after mutations elsewhere
      refetchOnMount: 'always',          // Always refresh in background on mount
      refetchOnWindowFocus: false,       // Don't refetch on tab focus
      refetchOnReconnect: 'always',      // Always refresh when network reconnects

      // RESILIENT: Retry with exponential backoff (capped at 30s)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // SMOOTH TRANSITIONS: Keep previous data during refetch
      placeholderData: (previousData) => previousData,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Create persister for React Query cache
// Uses localStorage for persistence across page refreshes
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'tf-query-cache',  // Unique key for this app
  throttleTime: 1000,      // Throttle writes to avoid performance issues
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});

// Export for cache invalidation from other modules
export { queryClient };

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 24 * 60 * 60 * 1000, // Cache persists for 24 hours
          buster: storageResult.wasCleared ? Date.now().toString() : undefined, // Bust cache on version change
        }}
      >
        <App />
      </PersistQueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Register service worker for push notifications
// Only registers in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_SW === 'true') {
  registerServiceWorker().then((registration) => {
    if (registration) {
      console.log('📱 Service Worker registered for push notifications');
    }
  });
}
