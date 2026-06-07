import { getPlayer, updatePlayer, getWrongWords, addSyncLog, getSyncLogs } from './db';

const SYNC_API_BASE = 'http://localhost:8202/api';

export async function checkOnline() {
  return navigator.onLine;
}

export async function syncProgress() {
  if (!navigator.onLine) {
    return { success: false, reason: 'offline' };
  }

  try {
    const player = await getPlayer();
    const wrongWords = await getWrongWords();
    
    const localData = {
      player,
      wrongWords,
      lastSync: Date.now()
    };

    const response = await fetch(`${SYNC_API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localData)
    });

    if (!response.ok) {
      throw new Error('Sync failed');
    }

    const serverData = await response.json();
    
    if (serverData.player && serverData.player.updatedAt > player.updatedAt) {
      await updatePlayer(serverData.player);
    }

    await addSyncLog('sync', { direction: 'up', success: true });
    
    return { success: true, serverData };
  } catch (error) {
    await addSyncLog('sync', { direction: 'up', success: false, error: error.message });
    return { success: false, error: error.message };
  }
}

export function setupAutoSync() {
  let syncTimeout = null;

  const scheduleSync = () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      if (navigator.onLine) {
        await syncProgress();
      }
    }, 5000);
  };

  window.addEventListener('online', scheduleSync);
  
  window.addEventListener('beforeunload', async () => {
    if (navigator.onLine) {
      await syncProgress();
    }
  });

  return () => {
    window.removeEventListener('online', scheduleSync);
    if (syncTimeout) clearTimeout(syncTimeout);
  };
}
