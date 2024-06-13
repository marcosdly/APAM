export function open(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onblocked = reject;
    request.onerror = reject;
    request.onupgradeneeded = () => {};
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

export function onError(db: IDBDatabase, callback: () => void) {
  db.onabort = callback;
  db.onclose = callback;
  db.onerror = callback;
}

export function onNotSuccessful(db: IDBDatabase, callback: () => void) {
  db.onabort = callback;
  db.onclose = callback;
  db.onerror = callback;
  db.onversionchange = callback;
}

export function openThenUpgradeWith(
  name: string,
  callback: (db: IDBDatabase) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open(name);
    opening.onblocked = reject;
    opening.onerror = reject;
    opening.onupgradeneeded = reject;
    opening.onsuccess = () => {
      const db = opening.result;
      const version = db.version;

      db.onabort = reject;
      db.onclose = reject;
      db.onerror = reject;
      db.onversionchange = reject;
      db.close();

      const upgrading = indexedDB.open(name, version + 1);
      upgrading.onblocked = reject;
      upgrading.onerror = reject;

      upgrading.onupgradeneeded = () => {
        const db = upgrading.result;
        db.onabort = reject;
        db.onclose = reject;
        db.onerror = reject;
        db.onversionchange = reject;

        callback(db);
      };

      upgrading.onsuccess = () => {
        const db = upgrading.result;
        db.close();
        resolve();
      };
    };
  });
}

/**
 * A transaction that takes extra care when ensuring data will persist in disk
 * before assuming it's safe to report data as successfully stored. This method is
 * generally slower.
 */
export function getSafeTransaction(db: IDBDatabase, store: string) {
  return db.transaction(store, 'readwrite', { durability: 'strict' });
}

/**
 * A transaction that considers data as successfully stored as soon as it becomes
 * the operating system's responsability to ensure it will be written to disk. This
 * method is generally faster and recommended for cache and quickly changing records.
 */
export function getFastTransaction(db: IDBDatabase, store: string) {
  return db.transaction(store, 'readwrite', { durability: 'relaxed' });
}

export function onTrasactionError(tr: IDBTransaction, callback: () => void) {
  tr.onabort = callback;
  tr.onerror = callback;
}

export function createDatabase(
  name: string,
  configDatabase?: (db: IDBDatabase) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    indexedDB
      .databases()
      .then((dbs) => dbs.map((info) => info.name))
      .then((names) => {
        if (names.includes(name))
          throw new SyntaxError(`Database '${name}' already exists`);

        const request = indexedDB.open(name);
        request.onblocked = reject;
        request.onerror = reject;
        request.onupgradeneeded = () => configDatabase?.(request.result);
        request.onsuccess = () => {
          request.result.close();
          resolve();
        };
      })
      .catch((err) => reject(err));
  });
}

export async function hasDatabase(name: string): Promise<boolean> {
  return (await indexedDB.databases()).some((info) => info.name === name);
}

export function hasStore(db: IDBDatabase, store: string): boolean {
  return db.objectStoreNames.contains(store);
}

export function getStores(db: IDBDatabase): string[] {
  return Array.from(db.objectStoreNames);
}

export function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    indexedDB
      .databases()
      .then((dbs) => dbs.map((info) => info.name))
      .then((names) => {
        if (!names.includes(name))
          throw new SyntaxError(`Database '${name}' already doesn't exist`);

        const request = indexedDB.deleteDatabase(name);
        request.onblocked = reject;
        request.onerror = reject;
        request.onupgradeneeded = reject;
        request.onsuccess = () => resolve();
      })
      .catch((err) => reject(err));
  });
}
