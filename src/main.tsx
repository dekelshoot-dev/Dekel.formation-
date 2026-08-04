import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import { initializeCacheManager, startDeploymentWatcher } from './services/cacheManager';

// Prevent uncaught top-level promises from causing blank screens
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Global unhandled rejection caught:', event.reason);
});

// Run immediate cache invalidation check on platform access
initializeCacheManager().then((cleared) => {
  if (cleared) {
    console.log('🚀 [Dekel.Formation] Cache réinitialisé avec succès suite au nouveau déploiement !');
  }
}).catch(console.warn);

// Start background watcher for active sessions on Firebase App Hosting
try {
  startDeploymentWatcher();
} catch (e) {
  console.warn('Deployment watcher initialization error:', e);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} else {
  console.error("Critical error: Unable to find '#root' DOM element.");
}

