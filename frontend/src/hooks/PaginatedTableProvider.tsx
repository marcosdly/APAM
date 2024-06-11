import {
  FC,
  HTMLAttributes,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

const { assign } = Object;

export const FillingParadigm = {
  Row: 'Row',
  Column: 'Column',
} as const;

export type ParadigmOption = keyof typeof FillingParadigm;

interface LowLevelMiddleware {
  clearData?: () => void;
}

interface LowLevelAPI {
  middleware: LowLevelMiddleware;
  setMiddleware: (state: LowLevelMiddleware) => void;
}

interface TableSettings {
  headers: string[];
}

// TODO: improve type signatures
export type RowData = Record<string, string | number>;

interface TableDBState {
  name: string;
  settings: TableSettings;
  isEmpty: boolean;
  isReady: boolean;
}

export interface TableDBAPI extends TableDBState {
  /**
   * Can only be called once per PaginatedTableProvider. Database always takes
   * a fixed minimum amount of milliseconds to initialize.
   * @see {@link https://developer.mozilla.org/en-US/docs/Glossary/IndexedDB}
   * @param name Database name
   * @param settings Configuration options used by the table component
   */
  setDB: (name: string, settings: TableSettings) => Promise<void>;
}

export interface PaginatedTableState {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  resultsPerPage: number;

  /** Amount of headers equals amount of columns. */
  headers: string[];
}

export interface PaginatedTableAPI {
  state: PaginatedTableState;
  nextPage: () => void | never;
  previousPage: () => void | never;
  toPage: (pageNumber: number) => void | never;
  setResultsPerPage: (resultsAmount: number) => void;
  setTotalResults: (resultsAmount: number) => void;
  clear: () => void;
  db: TableDBAPI;
}

export const RenderOptions = {
  NotRender: 'NotRender',
  Render: 'Render',
} as const;

// TODO: Add prefixes to all errors
const dbErrorPrefix = 'PaginatedTableDB: ';

export class DatabaseUndefined extends Error {
  constructor() {
    super(dbErrorPrefix + 'No database ever initialized.');
  }
}

export class DatabaseNotInitialized extends Error {
  public name;
  public dbname;
  constructor(name: string) {
    super(dbErrorPrefix + `Database '${name}' has not yet been initialized.`);
    this.name = name;
    this.dbname = name;
  }
}

export class PageIndexError extends Error {
  constructor(nextIndex: number, numberOfPages: number) {
    let specifier: string = '';
    if (nextIndex < 1) specifier = 'Too low.';
    else if (nextIndex > numberOfPages) specifier = 'Too high.';
    super(`Cannot switch to page ${nextIndex}. ${specifier}`.trimEnd());
  }
}

export class NonPositiveError extends Error {
  constructor(value: number) {
    super(`A numeric value that should be positive isn't. Received ${value}`);
  }
}

export const ContextLowLevel = createContext<LowLevelAPI>({} as LowLevelAPI);

const ContextHighLevel = createContext<PaginatedTableAPI>(
  {} as PaginatedTableAPI
);

const ContextDatabase = createContext<TableDBAPI>({} as TableDBAPI);

const DatabaseProvider: FC<HTMLAttributes<HTMLElement>> = ({ children }) => {
  const dbName = 'PaginatedTableDB';
  const initLocked = useRef(false);
  const [state, setState] = useState<TableDBState>({
    name: '',
    settings: {
      headers: [],
    },
    isEmpty: true,
    isReady: false,
  });

  const setDB = useCallback(
    async (name: string, settings: TableSettings): Promise<void> => {
      if (initLocked.current || state.isReady) {
        initLocked.current = false;
        throw new SyntaxError(
          dbErrorPrefix +
            'Only one database can be initialized per Provider instance'
        );
      }

      initLocked.current = true;
      name = name.trim();

      if (!name) {
        initLocked.current = false;
        throw new TypeError(
          dbErrorPrefix + 'Database name cannot be empty or blank'
        );
      }

      let alreadyExists = false;
      const databases = await indexedDB.databases();
      for (const info of databases) {
        if (info.name !== dbName) continue;
        const request = indexedDB.open(dbName);
        let locked = true;
        request.onsuccess = () => (locked = false);
        while (locked) await new Promise((resolve) => setTimeout(resolve, 20));
        const db = request.result;
        alreadyExists = db.objectStoreNames.contains(name);
        break;
      }

      if (alreadyExists) {
        initLocked.current = false;
        throw new TypeError(
          dbErrorPrefix + `Database '${name}' already exists`
        );
      }

      setState({
        name,
        settings,
        isEmpty: true,
        isReady: false,
      });

      const creationRequest = indexedDB.open(dbName);

      const createObjectStore = (database: IDBDatabase) => {
        database.createObjectStore(name, {
          keyPath: 'id',
          autoIncrement: true,
        });
        setState(assign({}, state, { isReady: true }));
      };

      const upgradeDatabase = (version: number) => {
        const request = indexedDB.open(dbName, version + 1);
        request.onupgradeneeded = () => createObjectStore(request.result);
        request.onsuccess = () => request.result.close();
      };

      creationRequest.onsuccess = () => {
        const database = creationRequest.result;
        database.onclose = () => upgradeDatabase(database.version);
        database.close();
      };

      while (!state.isReady)
        await new Promise((resolve) => setTimeout(resolve, 50));
    },
    [state, setState, initLocked]
  );

  return (
    <ContextDatabase.Provider value={{ ...state, setDB }}>
      {children}
    </ContextDatabase.Provider>
  );
};

const LowLevelAPIWrapper: FC<HTMLAttributes<HTMLElement>> = ({ children }) => {
  const [middleware, setMiddleware] = useState({} as LowLevelMiddleware);

  return (
    <ContextLowLevel.Provider value={{ middleware, setMiddleware }}>
      <DatabaseProvider>
        <HighLevelAPIWrapper>{children}</HighLevelAPIWrapper>
      </DatabaseProvider>
    </ContextLowLevel.Provider>
  );
};

const HighLevelAPIWrapper: FC<HTMLAttributes<HTMLElement>> = ({ children }) => {
  const [state, setState] = useState({} as PaginatedTableState);
  const { middleware } = useLowLevel();
  const db = useContext(ContextDatabase);

  const nextPage = useCallback((): void | never => {
    const newIndex = state.currentPage + 1;
    if (newIndex > state.totalPages)
      throw new PageIndexError(newIndex, state.totalPages);
    setState(assign({}, state, { currentPage: newIndex }));
  }, [state, setState]);

  const previousPage = useCallback((): void | never => {
    const newIndex = state.currentPage - 1;
    if (newIndex < 1) throw new PageIndexError(newIndex, state.totalPages);
    setState(assign({}, state, { currentPage: newIndex }));
  }, [state, setState]);

  const toPage = useCallback(
    (pageNumber: number): void | never => {
      if (pageNumber < 1)
        throw new PageIndexError(pageNumber, state.totalPages);
      if (pageNumber > state.totalPages)
        throw new PageIndexError(pageNumber, state.totalPages);
      setState(assign({}, state, { currentPage: pageNumber }));
    },
    [state, setState]
  );

  const setTotalResults = useCallback(
    (resultsAmount: number) => {
      if (resultsAmount < 1) throw new NonPositiveError(resultsAmount);
      setState(assign({}, state, { totalResults: resultsAmount }));
    },
    [state, setState]
  );

  const setResultsPerPage = useCallback(
    (resultsAmount: number) => {
      if (resultsAmount < 1) throw new NonPositiveError(resultsAmount);
      setState(assign({}, state, { resultsPerPage: resultsAmount }));
    },
    [state, setState]
  );

  const clear = useCallback(() => {
    middleware.clearData?.();
  }, [middleware]);

  return (
    <ContextHighLevel.Provider
      value={{
        state,
        nextPage,
        previousPage,
        toPage,
        setResultsPerPage,
        setTotalResults,
        clear,
        db,
      }}
    >
      {children}
    </ContextHighLevel.Provider>
  );
};

export const useLowLevel = () => useContext(ContextLowLevel);

export const useHighLevel = () => useContext(ContextHighLevel);

export const Provider = LowLevelAPIWrapper;
