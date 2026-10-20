import { localDb } from './db';
import { fetchApi } from './api';

let isSyncing = false;

export async function processSyncQueue(onToast?: (msg: string) => void) {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;

  try {
    const queue = await localDb.syncQueue.toArray();
    if (queue.length === 0) {
      isSyncing = false;
      return;
    }

    if (onToast) onToast('Syncing offline changes...');

    for (const item of queue) {
      try {
        if (item.table_name === 'sales' && item.operation === 'CREATE') {
          await fetchApi('/sales', {
            method: 'POST',
            body: JSON.stringify(item.payload),
          });
          // Update local sale status
          await localDb.sales.update(item.record_id, { _syncStatus: 'synced' });
        } else if (item.table_name === 'products' && item.operation === 'CREATE') {
          await fetchApi('/products', {
            method: 'POST',
            body: JSON.stringify(item.payload),
          });
          await localDb.products.update(item.record_id, { _syncStatus: 'synced' });
        } else if (item.table_name === 'products' && item.operation === 'UPDATE') {
          await fetchApi(`/products/${item.record_id}`, {
            method: 'PUT',
            body: JSON.stringify(item.payload),
          });
          await localDb.products.update(item.record_id, { _syncStatus: 'synced' });
        }

        if (item.id) {
          await localDb.syncQueue.delete(item.id);
        }
      } catch (err) {
        console.error('Failed to sync item:', item, err);
        if (item.id) {
          await localDb.syncQueue.update(item.id, { retry_count: (item.retry_count || 0) + 1 });
        }
      }
    }

    if (onToast) onToast('Sync complete. Refreshing page.');
  } finally {
    isSyncing = false;
  }
}

// Initialise window network status listeners
export function initOfflineSync(onToast: (msg: string) => void) {
  window.addEventListener('online', () => {
    onToast('Back online! Syncing data...');
    processSyncQueue(onToast);
  });

  window.addEventListener('offline', () => {
    onToast('Offline mode active. Changes are saved locally.');
  });
}
