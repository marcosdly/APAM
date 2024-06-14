// Will load fake indexedDB into global scope
import 'fake-indexeddb/auto';
import AsyncUniqueIDB from './AsyncUniqueIDB';
import * as IDBPromises from './IDBPromises';

const dbname = 'testdb';
const storename = 'teststore';

beforeEach(async () => {
  if (await IDBPromises.hasDatabase(dbname)) {
    await IDBPromises.deleteDatabase(dbname);
  }
});

describe('Database created on first access', () => {
  test('Generic operation', async () => {
    await expect(indexedDB.databases()).resolves.toHaveLength(0);
    const manager = new AsyncUniqueIDB(dbname);
    await expect(indexedDB.databases()).resolves.toHaveLength(0);
    await manager.withLock(() => {});
    await expect(indexedDB.databases()).resolves.toHaveLength(1);
    await manager.close();
  });

  test('Create store', async () => {
    await expect(indexedDB.databases()).resolves.toHaveLength(0);
    const manager = new AsyncUniqueIDB(dbname);
    await expect(indexedDB.databases()).resolves.toHaveLength(0);
    await manager.withLockCreateStore(storename, () => {});
    await expect(indexedDB.databases()).resolves.toHaveLength(1);
    await manager.close();
  });
});

describe('Shutting it down twice', () => {
  test('Throws after creating database', async () => {
    const manager = new AsyncUniqueIDB(dbname);
    await manager.ensureExists();
    await expect(manager.shutdown()).resolves.toBeUndefined();
    await expect(manager.shutdown()).rejects.toThrow(SyntaxError);
    await manager.close();
  });

  test('Throws before creating database', async () => {
    const manager = new AsyncUniqueIDB(dbname);
    await expect(manager.shutdown()).resolves.toBeUndefined();
    await expect(manager.shutdown()).rejects.toThrow(SyntaxError);
    await manager.close();
  });
});

describe('Mutex-like: Gatekeep order despite different contexts', () => {
  test.todo('Regular calls');

  test.todo('Shutdown');
});
