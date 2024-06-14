import { createContext, Component, useContext, HTMLAttributes } from 'react';
import * as IDBPromises from '../lib/IDBPromises';
import SimpleLock from '../lib/SimpleLock';
import AsyncUniqueIDB from '@/lib/AsyncUniqueIDB';

export interface DatabaseState {
  name: string;
  isEmpty: boolean;
  isReady: boolean;
  headers: string[];

  /** Amount of headers. */
  columns: number;
}

export type Row = Record<string, unknown>;

export type Document = { _id: number } & Row;

export interface DatabaseAPI {
  state: DatabaseState;
  init: (name: string, headers: string[]) => Promise<void>;
  create: (...data: Row[]) => Promise<Document[]>;
  createOne: (data: Row) => Promise<Document>;
}

const ContextDatabase = createContext<DatabaseAPI>({} as DatabaseAPI);

const databaseName = 'PaginatedTableDB';

export const dbManager = new AsyncUniqueIDB(databaseName);

export class DatabaseProvider extends Component<
  HTMLAttributes<HTMLElement>,
  DatabaseState
> {
  public internalDatabaseName: string = databaseName;
  public isMounted: boolean = false;
  public initLock = new SimpleLock();

  public constructor(props: HTMLAttributes<HTMLElement>) {
    super(props);
    this.state = {
      name: '',
      isEmpty: true,
      isReady: false,
      headers: [],
      columns: 0,
    };
  }

  public async init(name: string, headers: string[]): Promise<void> {
    const storeName = name.trim();

    const headersEqual = () =>
      headers.length === this.state.headers.length &&
      this.state.headers.every((value, i) => value === headers[i]);

    if (this.initLock.active)
      throw new SyntaxError(
        "Another initialization attempt hasn't been fullfiled yet"
      );

    this.initLock.acquire();

    if (storeName === '') {
      this.initLock.release();
      throw new TypeError('Database name cannot be empty nor blank');
    }

    if (headers.length === 0) {
      this.initLock.release();
      throw new TypeError('Amount of table headers cannot be zero');
    }

    if (storeName === this.state.name) {
      // By the time state is updated this Promise has been resolved once

      if (!headersEqual()) {
        this.initLock.release();
        throw new SyntaxError(
          'Trying to initialize again with different arguments'
        );
      }

      if (this.state.isReady) {
        this.initLock.release();
        // - Assume the component it's just being rendered.
        // - Function short circuit, since being successfully called once
        //   is the same as being ready.
        return;
      }
    }

    await dbManager.withLock((db) => {
      if (IDBPromises.hasStore(db, storeName))
        throw new SyntaxError(`Database '${storeName}' already exist`);
    });

    const configStore = (db: IDBDatabase) => {
      const store = db.createObjectStore(storeName, {
        keyPath: '_id',
        autoIncrement: true,
      });
      for (const key of headers) store.createIndex(key, key);
    };

    await dbManager.withLockCreateStore(storeName, configStore);

    const newState = {
      name: storeName,
      isEmpty: true,
      isReady: true,
      headers: Array.from(headers),
      columns: headers.length,
    };

    if (this.isMounted) this.setState(newState);
    // eslint-disable-next-line react/no-direct-mutation-state
    else this.state = newState;

    this.initLock.release();
  }

  public hasCorrectKeys(data: Row): boolean | never {
    return this.state.headers.every((key) => key in data);
  }

  public removeOtherKeys(data: Row): Row {
    const filteredPairs = Object.entries(data).filter(([key]) =>
      this.state.headers.includes(key)
    );
    return Object.fromEntries(filteredPairs);
  }

  public async create(...data: Row[]): Promise<Document[]> {
    if (!this.state.isReady) throw new SyntaxError('Database not yet ready');
    if (data.length === 0) return [];
    const added: Document[] = [];

    await dbManager.withTransaction(
      this.state.name,
      async (tran: IDBTransaction) => {
        const store = tran.objectStore(this.state.name);
        for (const row of data) {
          if ('_id' in row)
            throw new TypeError(
              "The key '_id' is reserved and cannot be used as data"
            );

          if (!this.hasCorrectKeys(row))
            throw new TypeError('Invalid structure of provided row data');

          const trimmed = this.removeOtherKeys(row);

          const request = store.add(trimmed);
          await IDBPromises.asyncRequest(request);
          added.push({ _id: request.result as number, ...trimmed });
        }
      }
    );

    return added;
  }

  public async createOne(data: Row): Promise<Document> {
    return (await this.create(data))?.[0];
  }

  render() {
    return (
      <ContextDatabase.Provider
        value={{
          state: this.state,
          init: this.init,
          create: this.create,
          createOne: this.createOne,
        }}
      >
        {this.props.children}
      </ContextDatabase.Provider>
    );
  }

  componentDidMount() {
    this.isMounted = true;
  }

  componentWillUnmount() {
    this.isMounted = false;
  }
}

export const useDatabase = () => useContext(ContextDatabase);
