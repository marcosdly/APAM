// Will load fake indexedDB into global scope
import 'fake-indexeddb/auto';
import 'core-js/actual/structured-clone';
import {
  DatabaseProvider,
  DatabaseState,
  Row,
  dbManager,
} from './PaginatedTableDatabaseProvider';
import { HTMLAttributes } from 'react';
import { act, cleanup } from '@testing-library/react';
import * as IDBPromises from '../lib/IDBPromises';

const defaultProps: HTMLAttributes<HTMLElement> = {};

const internalDatabase = 'PaginatedTableDB';
const storeName = 'testdb';

const dbExists = () => IDBPromises.hasDatabase(internalDatabase);

const getStores = (): Promise<string[]> =>
  new Promise((resolve) => {
    dbManager.withLock((db) => {
      const stores = IDBPromises.getStores(db);
      resolve(stores);
    });
  });

const dummy = {
  headers: ['first', 'second', 'third', 'fourth'] as string[],
} as const;

const deleteDatabase = async () => {
  await dbManager.close();
  if (await dbExists()) await IDBPromises.deleteDatabase(internalDatabase);
};

const useDatabase = async (): Promise<DatabaseProvider> => {
  const db = new DatabaseProvider(defaultProps);
  await act(() => db);
  return db;
};

const useManyDatabases = async (
  amount: number
): Promise<DatabaseProvider[]> => {
  const dbs = Array(amount)
    .fill(null)
    .map(() => new DatabaseProvider(defaultProps));
  await act(() => dbs);
  return dbs;
};

beforeEach(deleteDatabase);
beforeEach(cleanup);

test('Name consistency', async () => {
  const db = await useDatabase();
  expect(db.internalDatabaseName).toEqual(internalDatabase);
});

describe('Initializing database', () => {
  test('indexedDB database created', async () => {
    await expect(dbExists()).resolves.toBe(false);
    const db = await useDatabase();
    await expect(dbExists()).resolves.toBe(false);
    await expect(db.init('testdb', dummy.headers)).resolves.toBeUndefined();
    await expect(dbExists()).resolves.toBe(true);
  });

  test('Object store created', async () => {
    const db = await useDatabase();
    await expect(getStores()).resolves.toHaveLength(0);
    const attempt = db.init(storeName, dummy.headers);
    await expect(attempt).resolves.toBeUndefined();
    await expect(getStores()).resolves.toHaveLength(1);
  });

  test('Object store already exists', async () => {
    const dbs = await useManyDatabases(10);
    const successfulDB = dbs[0].init(storeName, dummy.headers);
    await expect(successfulDB).resolves.toBeUndefined();
    for (let i = 1; i < dbs.length; ++i) {
      const attempt = dbs[i].init(storeName, dummy.headers);
      await expect(attempt).rejects.toThrow(SyntaxError);
    }
  });

  test('Every provider has its own object store', async () => {
    const dbs = await useManyDatabases(10);
    const namesUsed: string[] = [];

    for (let i = 0; i < dbs.length; ++i) {
      const name = `testdb_${i}`;
      namesUsed.push(name);
      const attempt = dbs[i].init(name, dummy.headers);
      await expect(attempt).resolves.toBeUndefined();
    }

    const stores = await getStores();
    expect(stores).toEqual(namesUsed);

    const allThere = stores.every((name) => namesUsed.includes(name));
    expect(allThere).toBe(true);
  });

  test("Assume it's being re-rendered", async () => {
    const db = await useDatabase();
    for (let i = 0; i < 10; ++i)
      await expect(db.init(storeName, dummy.headers)).resolves.toBeUndefined();
  });

  test('State updated after init', async () => {
    const db = await useDatabase();
    await expect(db.init(storeName, dummy.headers)).resolves.toBeUndefined();
    expect(db.state).toStrictEqual({
      name: storeName,
      isEmpty: true,
      isReady: true,
      headers: dummy.headers,
      columns: dummy.headers.length,
    } as DatabaseState);
  });

  test('Allows many calls if previous ones failed', async () => {
    const db = await useDatabase();
    for (let i = 0; i < 10; ++i) {
      await expect(db.init('', [])).rejects.toThrow(expect.anything());
    }
    await expect(db.init('testdb', dummy.headers)).resolves.toBeUndefined();
  });

  describe('Valid function arguments', () => {
    test('Object store name', async () => {
      const db = await useDatabase();
      await expect(db.init('', dummy.headers)).rejects.toThrow(TypeError);
      await expect(db.init('   ', dummy.headers)).rejects.toThrow(TypeError);
    });

    test('Empty headers array', async () => {
      const db = await useDatabase();
      await expect(db.init('testdb', [])).rejects.toThrow(TypeError);
    });

    test('Same name, different arguments', async () => {
      const db = await useDatabase();
      const differentHeaders = Array.from(dummy.headers);
      differentHeaders.reverse();
      await expect(db.init(storeName, dummy.headers)).resolves.toBeUndefined();
      await expect(db.init(storeName, differentHeaders)).rejects.toThrow(
        SyntaxError
      );
    });
  });
});

const generateString = (size?: number) => {
  const buffer = new Uint8Array(size || 16);
  crypto.getRandomValues(buffer);
  return String.fromCodePoint(...buffer);
};

const generateRow = (): Row => {
  const keyValuePairs = dummy.headers.map((key) => [key, generateString()]);
  return Object.fromEntries(keyValuePairs);
};

const generateManyRows = (amount: number): Row[] => {
  return Array(amount)
    .fill(null)
    .map(() => generateRow());
};

describe('Adding to the database', () => {
  test("Empty argument doesn't throw", async () => {
    const db = await useDatabase();
    await db.init(storeName, dummy.headers);
    await expect(db.create()).resolves.toEqual([]);
    await expect(db.create(...[])).resolves.toEqual([]);
  });

  test('Database not ready yet', async () => {
    const db = await useDatabase();
    const rows = generateManyRows(10);
    await expect(db.create(...rows)).rejects.toThrow(SyntaxError);
  });

  test('_id key included in user data', async () => {
    const db = await useDatabase();
    const row = generateRow();
    row._id = generateString();

    await db.init(storeName, dummy.headers);
    await expect(db.create(row)).rejects.toThrow(TypeError);
  });

  test('Row data validated', async () => {
    const db = await useDatabase();
    await db.init(storeName, dummy.headers);
    const baseRow = generateRow();
    for (let i = 0; i < dummy.headers.length; ++i) {
      const entries = Object.entries(baseRow);
      // A key that is not among the headers
      entries[i] = ['differentKey', generateString()];
      const row = Object.fromEntries(entries);
      await expect(db.create(row)).rejects.toThrow(TypeError);
    }
  });

  test('Excessive keys are discarted', async () => {
    const db = await useDatabase();
    await db.init(storeName, dummy.headers);
    const row = generateRow();

    for (let i = 0; i < 5; ++i) {
      row[generateString(5)] = generateString();
    }

    const result = await db.create(row);
    const totalKeys = dummy.headers.length + 1;
    expect(Object.keys(result[0])).toHaveLength(totalKeys);
  });

  test('Many calls accross many providers', async () => {
    const databases = await useManyDatabases(10);
    for (let i = 0; i < databases.length; ++i)
      await databases[i].init(`${storeName}_${i}`, dummy.headers);
    for (const db of databases)
      await expect(db.create(generateRow())).resolves.toHaveLength(1);
  });

  test('Objects are correctly added to database', async () => {
    const db = await useDatabase();
    await db.init(storeName, dummy.headers);

    const len = 25;
    const rows = generateManyRows(len);
    const totalKeys = dummy.headers.length + 1;
    const docs = await db.create(...rows);

    expect(docs).toHaveLength(len);
    expect(docs.every((obj) => '_id' in obj)).toBe(true);
    expect(
      docs.every((obj) => {
        return dummy.headers.every((key) => key in obj);
      })
    ).toBe(true);
    expect(
      docs.every((obj) => {
        return Object.keys(obj).length === totalKeys;
      })
    ).toBe(true);

    let count: number = 0;
    await dbManager.withTransaction(storeName, async (tran) => {
      const store = tran.objectStore(storeName);
      count = (await IDBPromises.asyncRequest(store.count())) as number;
    });

    expect(count).toEqual(len);
  });
});

describe('Non-complex utilities', () => {
  const len = 25;
  // const totalKeys = dummy.headers.length + 1;
  const rows = generateManyRows(len);

  test('Get all elements as array of objects', async () => {
    const db = await useDatabase();
    await db.init(storeName, dummy.headers);
    await db.create(...rows);
    const docs = await db.getAll();
    expect(docs).toHaveLength(len);
    for (let i = 0; i < len; ++i) {
      expect(docs[i]).toMatchObject(rows[i]);
      expect('_id' in docs[i]).toBe(true);
      expect(docs[i]._id).toEqual(expect.any(Number));
      expect(typeof docs[i]._id).toEqual('number'); // double sure
    }
  });

  test('Count total amount of objects', async () => {
    const db = await useDatabase();
    await db.init(storeName, dummy.headers);
    await db.create(...rows);
    await expect(db.count()).resolves.toEqual(len);
  });

  test('Clear all objects from store', async () => {
    const db = await useDatabase();
    await db.init(storeName, dummy.headers);
    await db.create(...rows);
    await expect(db.count()).resolves.toEqual(len);
    await expect(db.clear()).resolves.toEqual(len);
    await expect(db.count()).resolves.toEqual(0);
  });
});
