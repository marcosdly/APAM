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

export interface DatabaseAPI {
  state: DatabaseState;
  init: (name: string, headers: string[]) => Promise<void>;
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

  render() {
    return (
      <ContextDatabase.Provider
        value={{
          state: this.state,
          init: this.init,
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
