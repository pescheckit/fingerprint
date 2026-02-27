export async function getStorageSignals() {
  const result = {
    cookiesEnabled: navigator.cookieEnabled,
    localStorageEnabled: false,
    sessionStorageEnabled: false,
    indexedDBEnabled: !!window.indexedDB,
    cacheAPIEnabled: 'caches' in window,
    storageQuota: null,
    storageUsage: null,
  };

  try {
    localStorage.setItem('_fp', '1');
    localStorage.removeItem('_fp');
    result.localStorageEnabled = true;
  } catch { /* blocked */ }

  try {
    sessionStorage.setItem('_fp', '1');
    sessionStorage.removeItem('_fp');
    result.sessionStorageEnabled = true;
  } catch { /* blocked */ }

  if (navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      result.storageQuota = est.quota;
      result.storageUsage = est.usage;
    } catch { /* blocked */ }
  }

  return result;
}
