import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import { initializeCacheManager, startDeploymentWatcher } from './services/cacheManager';

// Run immediate cache invalidation check on platform access
initializeCacheManager().then((cleared) => {
  if (cleared) {
    console.log('🚀 [Dekel.Formation] Cache réinitialisé avec succès suite au nouveau déploiement !');
  }
}).catch(console.warn);

// Start background watcher for active sessions on Firebase App Hosting
startDeploymentWatcher();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

