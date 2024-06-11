import { Provider, useHighLevel } from './PaginatedTableProvider';
import { act } from '@testing-library/react';
import { vi } from 'vitest';

// TODO: Introduce Faker to generate db data

const dummyTableSettings = { headers: [] };

const deleteAllDatabases = async () => {
  const databases = await indexedDB.databases();
  let remaining = databases.length;
  for (const db of databases) {
    if (!db.name) continue;
    const request = indexedDB.deleteDatabase(db.name);
    request.onsuccess = () => {
      // successfull deletion
      --remaining;
    };
  }
  await vi.waitUntil(() => remaining <= 0, { timeout: 1000, interval: 50 });
};

describe('Local database', () => {
  beforeAll(deleteAllDatabases);
  afterEach(deleteAllDatabases);

  describe('Database initialization', () => {
    test('Trying to init more than once', () => {
      const Consumer = () => {
        const { db } = useHighLevel();
        const anydb = db.setDB('anyName', dummyTableSettings);
        expect(anydb).resolves;
        const differentdb = db.setDB('differentName', dummyTableSettings);
        expect(differentdb).rejects.toThrow(SyntaxError);
        return <></>;
      };

      act(() => (
        <Provider>
          <Consumer />
        </Provider>
      ));
    });

    test("Trying to init after another's full initialization", () => {
      const Consumer = () => {
        const { db } = useHighLevel();
        const firstDB = db.setDB('first', dummyTableSettings);
        expect(firstDB)
          .resolves.toBe(expect.anything())
          .then(() => {
            const secondDB = db.setDB('second', dummyTableSettings);
            expect(secondDB).rejects.toThrow(SyntaxError);
          });
        return <></>;
      };

      act(() => (
        <Provider>
          <Consumer />
        </Provider>
      ));
    });

    test('Returns correct object', () => {
      const dbname = 'testDatabase';
      const version = 1;
      const settings = { headers: ['first', 'second', 'third', 'fourth'] };
      const wanted = {
        name: dbname,
        version: version,
        ...settings,
      };

      const Consumer = () => {
        const { db } = useHighLevel();
        const initResult = db.setDB(dbname, settings);
        expect(initResult).resolves.toEqual(wanted);
        return <></>;
      };

      act(() => (
        <Provider>
          <Consumer />
        </Provider>
      ));
    });

    test('Name valid', () => {
      const empty = '';
      const blank = '       ';

      const Consumer = () => {
        const { db } = useHighLevel();
        const first = db.setDB(empty, dummyTableSettings);
        expect(first).rejects.toThrow(TypeError);
        const second = db.setDB(blank, dummyTableSettings);
        expect(second).rejects.toThrow(TypeError);
        return <></>;
      };

      act(() => (
        <Provider>
          <Consumer />
        </Provider>
      ));
    });

    test('Database already exists', () => {
      const dbname = 'unique';

      const FirstConsumer = () => {
        const { db } = useHighLevel();
        const request = db.setDB(dbname, dummyTableSettings);
        expect(request).resolves.toBe(expect.anything());
        return <></>;
      };

      const SecondConsumer = () => {
        const { db } = useHighLevel();
        const request = db.setDB(dbname, dummyTableSettings);
        expect(request).rejects.toThrow(SyntaxError);
        return <></>;
      };

      act(() => (
        <>
          <Provider>
            <FirstConsumer />
          </Provider>
          <Provider>
            <SecondConsumer />
          </Provider>
        </>
      ));
    });
  });
});
