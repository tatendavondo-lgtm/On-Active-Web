import { db } from './src/db/dexie.ts';

async function clearSyncQueue() {
  await db.syncQueue.clear();
  console.log('Sync queue cleared');
}

clearSyncQueue();
