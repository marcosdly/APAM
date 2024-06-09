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

interface DBInit extends TableSettings {
  name: string;
  version: number;
}

// TODO: improve type signatures
export type RowData = Record<string, string | number>;

interface TableDBState {
  options: DBInit;
  isEmpty: boolean;
  isReady: boolean;
}

interface TableDBAPI extends TableDBState {
  /**
   * Can only be called once per PaginatedTableProvider. Database always takes
   * a fixed minimum amount of time to initialize.
   * @see {@link https://developer.mozilla.org/en-US/docs/Glossary/IndexedDB}
   * @param name Database name
   * @param version Database version
   * @param tableSettings Configuration options used by the table component
   * @returns Database configuration **after** it's creation and initialization
   */
  setDB: (
    name: string,
    version: number,
    tableSettings: TableSettings
  ) => Promise<DBInit>;
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
  const db = useRef<IDBDatabase | undefined>(undefined);
  const initLocked = useRef(false);
  const [state, setState] = useState<TableDBState>({
    options: {
      name: '',
      version: 0,
      headers: [],
    },
    isEmpty: true,
    isReady: false,
  });

  const setDB = useCallback(
    async (
      name: string,
      version: number,
      tableSettings: TableSettings
    ): Promise<DBInit> => {
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

      if (version <= 0) {
        initLocked.current = false;
        throw new TypeError(
          dbErrorPrefix + 'Database version has to be positive'
        );
      }

      const dbname = name + '_PaginatedTableDB';
      let dbVersionConflicting: number;
      const alreadyExists = (await indexedDB.databases()).some((info) => {
        if (info.name === dbname) {
          dbVersionConflicting = info.version!;
          return true;
        }
        return false;
      });

      if (alreadyExists) {
        initLocked.current = false;
        throw new TypeError(
          dbErrorPrefix +
            `Database '${name}' of version ${dbVersionConflicting!} already exists`
        );
      }

      setState({
        options: {
          name: name,
          version,
          ...tableSettings,
        },
        isEmpty: true,
        isReady: false,
      });

      const request = indexedDB.open(dbname, version);
      request.onsuccess = () => {
        db.current = request.result;
        setState(assign({}, state, { isReady: true }));
      };

      // eslint says this is more "production ready" than while(true) so I guess it is
      for (;;) {
        // NOTE: Waiting time is referenced in this callback's documentation.
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (db.current) break;
      }

      return state.options;
    },
    [state, setState, db, initLocked]
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
