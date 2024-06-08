import {
  FC,
  HTMLAttributes,
  RefObject,
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

interface LowLevelState {
  paradigm?: ParadigmOption;
  isInitialized: RefObject<boolean>;
  isEmpty: RefObject<boolean>;
}

interface LowLevelMiddleware {
  clearData?: () => void;
  configTableStructure?: (settings: TableSettings) => void | never;
}

interface LowLevelAPI {
  state: LowLevelState;
  middleware: LowLevelMiddleware;
  setState: (state: LowLevelState) => void;
  setMiddleware: (state: LowLevelMiddleware) => void;
}

interface TableSettings {
  totalResults?: number;

  /** Amount of headers equals amount of columns. */
  headers?: string[];
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
  config: (settings: TableSettings) => void | never;
  isInitialized: RefObject<boolean>;
  isEmpty: RefObject<boolean>;
}

export const RenderOptions = {
  NotRender: 'NotRender',
  Render: 'Render',
} as const;

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

const ContextLowLevel = createContext<LowLevelAPI>({} as LowLevelAPI);

const ContextHighLevel = createContext<PaginatedTableAPI>(
  {} as PaginatedTableAPI
);

const LowLevelAPIWrapper: FC<HTMLAttributes<HTMLElement>> = ({ children }) => {
  const isInitialized = useRef(false);
  const isEmpty = useRef(true);

  const [state, setState] = useState({
    isInitialized,
    isEmpty,
  } as LowLevelState);

  const [middleware, setMiddleware] = useState({} as LowLevelMiddleware);

  return (
    <ContextLowLevel.Provider
      value={{ state, setState, middleware, setMiddleware }}
    >
      <HighLevelAPIWrapper>{children}</HighLevelAPIWrapper>
    </ContextLowLevel.Provider>
  );
};

const HighLevelAPIWrapper: FC<HTMLAttributes<HTMLElement>> = ({ children }) => {
  const [state, setState] = useState({} as PaginatedTableState);
  const { state: lowLevelState, middleware } = useLowLevel();

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

  const config = useCallback(
    (settings: TableSettings) => {
      // May throw an Error. Dev should handle it further in the stack trace.
      middleware.configTableStructure?.(settings);
    },
    [middleware]
  );

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
        config,
        isInitialized: lowLevelState.isInitialized,
        isEmpty: lowLevelState.isEmpty,
      }}
    >
      {children}
    </ContextHighLevel.Provider>
  );
};

export const useLowLevel = () => useContext(ContextLowLevel);

export const useHighLevel = () => useContext(ContextHighLevel);

export const Provider = LowLevelAPIWrapper;
