/**
 * Test order is very important!
 */

// Will load it into the global scope
import 'fake-indexeddb/auto';
import * as lib from './IDBPromises';

const dbname = 'testdb';

const stores = Array(10)
  .fill('store_')
  .map((prefix, i) => prefix + i.toString());

const defaultStoreOptions: IDBObjectStoreParameters = {
  keyPath: 'id',
  autoIncrement: true,
};

const config = (db: IDBDatabase) => {
  for (const name of stores) {
    db.createObjectStore(name, defaultStoreOptions);
  }
};

beforeAll(
  (): Promise<void> =>
    new Promise((resolve, reject) => {
      indexedDB
        .databases()
        .then((dbs) => dbs.map((info) => info.name))
        .then((names) => {
          if (!names.includes(dbname)) {
            resolve();
            return;
          }

          const request = indexedDB.deleteDatabase(dbname);
          request.onsuccess = () => resolve();
        })
        .catch((err) => reject(err));
    })
);

test('Create', async () => {
  await expect(indexedDB.databases()).resolves.toHaveLength(0);
  await expect(lib.createDatabase(dbname)).resolves.toBeUndefined();
  const databases = await indexedDB.databases();
  expect(databases).toHaveLength(1);
  expect(databases.map((info) => info.name)).toContain(dbname);
});

test('Already exists', async () => {
  await expect(lib.createDatabase(dbname)).rejects.toThrow(SyntaxError);
});

test('Does database exist', async () => {
  await expect(lib.hasDatabase(dbname)).resolves.toBe(true);
});

test('Delete', async () => {
  await expect(indexedDB.databases()).resolves.toHaveLength(1);
  await expect(lib.deleteDatabase(dbname)).resolves.toBeUndefined();
  await expect(indexedDB.databases()).resolves.toHaveLength(0);
});

test("Doesn't exist yet", async () => {
  await expect(indexedDB.databases()).resolves.toHaveLength(0);
  await expect(lib.deleteDatabase(dbname)).rejects.toThrow(SyntaxError);
});

test('Open connection', async () => {
  const db = await lib.open(dbname);
  expect(db).toBeInstanceOf(IDBDatabase);
  expect(db.name).toBe(dbname);
  db.close();

  // clean up
  const databases = await indexedDB.databases();
  if (databases.length > 0) {
    for (const info of databases) await lib.deleteDatabase(info.name!);
  }
});

test('Opening database creates database', async () => {
  await expect(indexedDB.databases()).resolves.toHaveLength(0);
  const db = await lib.open(dbname);
  await expect(indexedDB.databases()).resolves.toHaveLength(1);
  db.close();
  await lib.deleteDatabase(dbname);
});

test('Configuring database during creation', async () => {
  await expect(indexedDB.databases()).resolves.toHaveLength(0);
  await expect(lib.createDatabase(dbname, config)).resolves.toBeUndefined();
  await expect(indexedDB.databases()).resolves.toHaveLength(1);
  const db = await lib.open(dbname);
  expect(Array.from(db.objectStoreNames)).toEqual(stores);
  db.close();
  await lib.deleteDatabase(dbname);
});

test('Upgrade', async () => {
  await expect(lib.createDatabase(dbname)).resolves.toBeUndefined();
  await expect(
    lib.openThenUpgradeWith(dbname, config)
  ).resolves.toBeUndefined();
  const db = await lib.open(dbname);
  expect(Array.from(db.objectStoreNames)).toEqual(stores);
  db.close();
  await lib.deleteDatabase(dbname);
});

describe('With single database instance', () => {
  let db: IDBDatabase;

  beforeAll(async () => {
    await lib.createDatabase(dbname, config);
    db = await lib.open(dbname);
  });

  afterAll(async () => {
    db.close();
    await lib.deleteDatabase(dbname);
  });

  test('List stores', () => {
    expect(lib.getStores(db)).toEqual(stores);
  });

  test('Store exists', () => {
    for (const name of stores) expect(lib.hasStore(db, name)).toBe(true);
  });
});
