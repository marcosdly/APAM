// Will load fake indexedDB into global scope
import 'fake-indexeddb/auto';
import {
  DatabaseProvider,
  DatabaseState,
} from './PaginatedTableDatabaseProvider';
import { HTMLAttributes } from 'react';
import { act, cleanup } from '@testing-library/react';

const defaultProps: HTMLAttributes<HTMLElement> = {};

const internalDatabase = 'PaginatedTableDB';

const dummy = {
  headers: ['first', 'second', 'third', 'fourth'] as string[],
} as const;

const deleteDatabase = (): Promise<void> =>
  new Promise((resolve, reject) => {
    indexedDB.databases().then((dbs) => {
      if (!dbs.some((info) => info.name === internalDatabase)) {
        resolve();
        return;
      }
      const request = indexedDB.deleteDatabase(internalDatabase);
      request.onblocked = reject;
      request.onupgradeneeded = reject;
      request.onerror = reject;
      request.onsuccess = () => resolve();
    });
  });

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

const getStores = (): Promise<string[]> =>
  new Promise((resolve, reject) => {
    indexedDB.databases().then((dbs) => {
      const fail = () => reject();

      if (!dbs.some((info) => info.name === internalDatabase)) {
        resolve([]);
        return;
      }

      const request = indexedDB.open(internalDatabase);
      request.onblocked = fail;
      request.onerror = fail;
      request.onupgradeneeded = fail;

      request.onsuccess = () => {
        const db = request.result;

        db.onabort = fail;
        db.onerror = fail;
        db.onversionchange = fail;
        db.onclose = fail;

        const names = Array.from(db.objectStoreNames);

        resolve(names);
        db.close();
      };
    });
  });

beforeAll(deleteDatabase);
afterEach(deleteDatabase);
afterEach(cleanup);

test('Name consistency', () => {
  const db = new DatabaseProvider(defaultProps);
  expect(db.internalDatabaseName).toEqual(internalDatabase);
});

describe('Initializing database', () => {
  test('indexedDB database created', async () => {
    const db = await useDatabase();

    const getDatabases = async () =>
      (await indexedDB.databases()).map((info) => info.name);

    const before = await getDatabases();
    expect(before).not.toContain(internalDatabase);

    await expect(db.init('testdb', dummy.headers)).resolves.toBeUndefined();

    const after = await getDatabases();
    expect(after).toContain(internalDatabase);
  });

  test('Object store created', async () => {
    const storeName = 'testdb';
    const db = await useDatabase();
    await expect(getStores()).resolves.toHaveLength(0);
    const attempt = db.init(storeName, dummy.headers);
    await expect(attempt).resolves.toBeUndefined();
    await expect(getStores()).resolves.toHaveLength(1);
  });

  test('Object store already exists', async () => {
    const dbs = await useManyDatabases(10);
    const storeName = 'testdb';
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
    expect(stores).toHaveLength(namesUsed.length);

    const allThere = stores.every((name) => namesUsed.includes(name));
    expect(allThere).toBe(true);
  });

  test("Assume it's being re-rendered", async () => {
    const db = await useDatabase();
    const storeName = 'testdb';
    await expect(db.init(storeName, dummy.headers)).resolves.toBeUndefined();
    await expect(db.init(storeName, dummy.headers)).resolves.toBeUndefined();
  });

  test('State updated after init', async () => {
    const db = await useDatabase();
    const storeName = 'testdb';
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
      const storeName = 'testdb';
      const differentHeaders = Array.from(dummy.headers);
      differentHeaders.reverse();
      await expect(db.init(storeName, dummy.headers)).resolves.toBeUndefined();
      await expect(db.init(storeName, differentHeaders)).rejects.toThrow(
        SyntaxError
      );
    });
  });
});
