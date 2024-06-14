// Will load fake indexedDB into global scope
import 'fake-indexeddb/auto';
import {
  DatabaseProvider,
  DatabaseState,
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
