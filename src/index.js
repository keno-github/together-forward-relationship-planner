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

// Create React Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // Data considered fresh for 5 minutes
      gcTime: 30 * 60 * 1000,        // Cache kept for 30 minutes (formerly cacheTime)
      retry: 1,                       // Retry failed requests once
      refetchOnWindowFocus: false,    // Don't refetch on tab focus
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
