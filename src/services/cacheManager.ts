/**
 * Automatic Cache Invalidation Service for Firebase App Hosting & SPA deployments.
 * Automatically purges stale browser caches, service worker registrations, 
 * and local storage snapshots whenever a new deployment is detected.
 */

export const APP_BUILD_ID: string = (import.meta as any).env?.VITE_APP_BUILD_ID || `build-${Date.now()}`;

export interface VersionInfo {
  version: string;
  buildTime: string;
  environment: string;
}

/**
 * Purges all browser level caches (Cache API & Service Workers)
 */
export async function clearAllBrowserCaches(): Promise<void> {
  try {
    // 1. Clear CacheStorage API
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
      console.log('[CacheManager] Cleaned CacheStorage keys:', keys);
    }

    // 2. Unregister Service Workers if present
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[CacheManager] Unregistered ServiceWorker:', registration);
      }
    }

    // 3. Clear non-essential cached session items from localStorage/sessionStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('cache_') || key.startsWith('vite_') || key.startsWith('app_page_cache_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();

  } catch (error) {
    console.warn('[CacheManager] Warning during cache purge:', error);
  }
}

/**
 * Initializes Deployment Version Checker on app launch.
 * Clears cache immediately if deployment version is newer than stored version.
 */
export async function initializeCacheManager(onNewDeploymentDetected?: () => void): Promise<boolean> {
  const STORAGE_KEY = 'app_deployment_build_id';
  const lastBuildId = localStorage.getItem(STORAGE_KEY);

  let hasClearedCache = false;

  // Check remote server version endpoint to detect live deployments
  try {
    const res = await fetch('/api/version?t=' + Date.now(), {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    if (res.ok) {
      const data: VersionInfo = await res.json();
      const serverVersion = data.version;

      if (serverVersion) {
        if (lastBuildId && serverVersion !== lastBuildId) {
          console.log(`[CacheManager] New deployment detected (${lastBuildId} -> ${serverVersion}). Purging cache...`);
          await clearAllBrowserCaches();
          localStorage.setItem(STORAGE_KEY, serverVersion);
          localStorage.setItem('app_last_cache_reset', new Date().toISOString());
          hasClearedCache = true;
          
          if (onNewDeploymentDetected) {
            onNewDeploymentDetected();
          }
        } else if (!lastBuildId) {
          localStorage.setItem(STORAGE_KEY, serverVersion);
        }
      }
    }
  } catch (err) {
    // Ignore offline or initial load network hiccups
  }

  return hasClearedCache;
}

/**
 * Periodically polls the server version to auto-reset cache on new Firebase App Hosting deployments
 */
export function startDeploymentWatcher(intervalMs = 300000) { // Every 5 minutes
  if (typeof window === 'undefined') return;

  const checkVersion = async () => {
    try {
      const res = await fetch('/api/version?t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      if (res.ok) {
        const data: VersionInfo = await res.json();
        const storedBuildId = localStorage.getItem('app_deployment_build_id');
        if (data.version && storedBuildId && data.version !== storedBuildId) {
          console.log('[CacheManager] New version deployed on Firebase App Hosting! Reloading...');
          localStorage.setItem('app_deployment_build_id', data.version);
          await clearAllBrowserCaches();
          window.location.reload();
        }
      }
    } catch (e) {
      // Ignore network errors
    }
  };

  // Interval check every 5 minutes (no aggressive window focus listener)
  const timer = setInterval(checkVersion, intervalMs);
  return () => {
    clearInterval(timer);
  };
}
