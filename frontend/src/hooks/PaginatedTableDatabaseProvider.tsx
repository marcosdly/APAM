import { createContext, Component, useContext, HTMLAttributes } from 'react';

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

class SimpleLock {
  public active: boolean = false;

  public acquire(): void {
    this.active = true;
  }

  public release(): void {
    this.active = false;
  }
}

const ContextDatabase = createContext<DatabaseAPI>({} as DatabaseAPI);

export class DatabaseProvider extends Component<
  HTMLAttributes<HTMLElement>,
  DatabaseState
> {
  public internalDatabaseName: string = 'PaginatedTableDB';
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

  private createInternalDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.internalDatabaseName);
      request.onblocked = reject;
      request.onerror = reject;
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
    });
  }

  private createObjectStore(
    db: IDBDatabase,
    storeName: string,
    storeKeys: string[]
  ) {
    const store = db.createObjectStore(storeName, {
      keyPath: 'id',
      autoIncrement: true,
    });
    for (const key of storeKeys) store.createIndex(key, key);
  }

  /**
   * Prepares the internal database to allow creation of objects store and indexes,
   * then, create them.
   */
  private createLocalDatabase(
    storeName: string,
    storeKeys: string[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open(this.internalDatabaseName);
      open.onblocked = reject;
      open.onerror = reject;
      open.onsuccess = () => {
        const db = open.result;
        const version = db.version;
        db.onabort = reject;
        db.onerror = reject;
        // Nothing to do with .close() method
        db.onclose = reject;
        db.close();

        const upgrade = indexedDB.open(this.internalDatabaseName, version + 1);
        upgrade.onblocked = reject;
        upgrade.onerror = reject;
        upgrade.onsuccess = () => {
          const db = upgrade.result;
          db.onabort = reject;
          db.onerror = reject;
          // Nothing to do with .close() method
          db.onclose = reject;
          db.close();
          resolve();
        };
        upgrade.onupgradeneeded = () => {
          const upgradeDB = upgrade.result;
          this.createObjectStore(upgradeDB, storeName, storeKeys);
        };
      };
    });
  }

  private async internalDatabaseExists(): Promise<boolean> {
    const dbs = await indexedDB.databases();
    const exists = dbs.some((info) => info.name === this.internalDatabaseName);
    return exists;
  }

  /** Has to open the database to check store names. */
  private localDatabaseExists(storeName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.internalDatabaseName);
      request.onblocked = reject;
      request.onerror = reject;
      request.onsuccess = () => {
        const db = request.result;
        db.onabort = reject;
        // Nothing to do with .close() method
        db.onclose = reject;
        db.onerror = reject;
        const exists = db.objectStoreNames.contains(storeName);
        resolve(exists);
        db.close();
      };
    });
  }

  private async initializeStore(
    storeName: string,
    storeKeys: string[]
  ): Promise<void> {
    const internalExists = await this.internalDatabaseExists();
    if (!internalExists) {
      await this.createInternalDatabase();
    }

    const localExists = await this.localDatabaseExists(storeName);
    if (localExists)
      throw new SyntaxError(`Database '${storeName}' already exist`);

    await this.createLocalDatabase(storeName, storeKeys);
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

    try {
      await this.initializeStore(storeName, headers);
    } catch (err) {
      this.initLock.release();
      throw err;
    }

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
