import {
  FC,
  HTMLAttributes,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { DatabaseProvider } from './PaginatedTableDatabaseProvider';

const { assign } = Object;

interface LowLevelMiddleware {
  clearData?: () => void;
}

interface LowLevelAPI {
  middleware: LowLevelMiddleware;
  setMiddleware: (state: LowLevelMiddleware) => void;
}

export interface PaginatedTableState {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  resultsPerPage: number;
}

export interface PaginatedTableAPI {
  state: PaginatedTableState;
  nextPage: () => void | never;
  previousPage: () => void | never;
  toPage: (pageNumber: number) => void | never;
  setResultsPerPage: (resultsAmount: number) => void;
  setTotalResults: (resultsAmount: number) => void;
  clear: () => void;
}

export class PageIndexError extends Error {
  constructor(nextIndex: number, numberOfPages: number) {
    let specifier: string = '';
    if (nextIndex < 1) specifier = 'Too low.';
    else if (nextIndex > numberOfPages) specifier = 'Too high.';
    super(`Cannot switch to page ${nextIndex}. ${specifier}`.trimEnd());
  }
}

const ContextLowLevel = createContext<LowLevelAPI>({} as LowLevelAPI);

const ContextHighLevel = createContext<PaginatedTableAPI>(
  {} as PaginatedTableAPI
);

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
      if (resultsAmount < 1)
        throw new TypeError('Amount of total table results must be positive');
      setState(assign({}, state, { totalResults: resultsAmount }));
    },
    [state, setState]
  );

  const setResultsPerPage = useCallback(
    (resultsAmount: number) => {
      if (resultsAmount < 1)
        throw new TypeError('Amount of results per page must be positive');
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
      }}
    >
      {children}
    </ContextHighLevel.Provider>
  );
};

export const useLowLevel = () => useContext(ContextLowLevel);

export const useHighLevel = () => useContext(ContextHighLevel);

export const Provider = LowLevelAPIWrapper;
