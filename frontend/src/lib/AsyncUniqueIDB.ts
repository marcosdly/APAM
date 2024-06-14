import SimpleLock from './SimpleLock';
import * as IDBPromises from './IDBPromises';
import { AsyncFunction } from './constants';

/**
 * Managed instance of an indexedDB connection. You should not use the
 * database instance outside of the class' scope, that's why operations
 * involve passing a callback.
 */
export default class AsyncUniqueIDB {
  public name: string;
  private _instance?: IDBDatabase;

  private lock = new SimpleLock();
  private _exists: boolean | null = null;
  public isShutdown = false;
  public isClosed = false;

  public constructor(name: string) {
    this.name = name;
  }

  public get exists() {
    return new Boolean(this._exists);
  }

  public async waitRelease(): Promise<void> {
    if (!this.lock.active) return;

    while (!this.lock.active)
      await new Promise((resolve) => setTimeout(resolve, 20));
  }

  public async ensureExists(): Promise<void> {
    this._exists = await IDBPromises.hasDatabase(this.name);

    if (this._exists) return;

    await IDBPromises.createDatabase(this.name);
    this._exists = true;
    this._instance = await IDBPromises.open(this.name);
  }

  /**
   * Prevent any other operation until the passed callback has returned of resolved.
   */
  public async withLock(
    callback: (db: IDBDatabase) => void | Promise<void>
  ): Promise<void> {
    await this.waitRelease();
    this.lock.acquire();
    this.checkShutdown();
    await this.ensureExists();
    if (this.isClosed) await this.reopen();
    if (callback instanceof AsyncFunction) await callback(this._instance!);
    else callback(this._instance!);
    this.lock.release();
  }

  /**
   * Should be called BEFORE any other operation and not IN THE MIDDLE OF one.
   */
  public async withLockCreateStore(
    store: string,
    configCallback: (db: IDBDatabase) => void
  ): Promise<void> {
    await this.waitRelease();
    this.lock.acquire();
    this.checkShutdown();
    await this.ensureExists();
    if (this.isClosed) await this.reopen();
    if (IDBPromises.hasStore(this._instance!, store))
      throw new SyntaxError('Trying to create object store twice');
    this._instance!.close();
    await IDBPromises.openThenUpgradeWith(this.name, configCallback);
    this._instance = await IDBPromises.open(this.name);
    this.lock.release();
  }

  private checkShutdown() {
    if (!this.isShutdown) return;
    throw new SyntaxError(
      'Unique connection shutdown: manager instance should be discarted'
    );
  }

  public async shutdown(): Promise<void> {
    await this.waitRelease();
    this.lock.acquire();
    this.checkShutdown();
    this._instance?.close();
    this.isShutdown = true;
    this.lock.release();
  }

  private async reopen() {
    await this.waitRelease();
    this.lock.acquire();
    if (this.isClosed) {
      this._instance = await IDBPromises.open(this.name);
      this.isClosed = false;
    }
    this.lock.release();
  }

  public async close(): Promise<void> {
    await this.waitRelease();
    this.lock.acquire();
    this._instance?.close();
    this.isClosed = true;
    this.lock.release();
  }
}
