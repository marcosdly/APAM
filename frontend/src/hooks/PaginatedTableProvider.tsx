import {
  FC,
  HTMLAttributes,
  createContext,
  useCallback,
  useContext,
  useReducer,
  useState,
} from 'react';
import { DatabaseProvider } from './PaginatedTableDatabaseProvider';

const { assign } = Object;

interface LowLevelMiddleware {
  clearData: () => void;
  populateData: () => void;
  triggerUpdate: () => void;
}

interface LowLevelState {
  isDataHidden: boolean;
}

interface LowLevelAPI {
  middleware: LowLevelMiddleware;
  state: LowLevelState;
  /** Dummy counter that may trigger React into updating component */
  forceUpdateEvent: number;
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

  /** Hide table data */
  clear: () => void;
  /** Show table data */
  populate: () => void;
  /** Force table data to update */
  update: () => void;
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
  const [state, setState] = useState<LowLevelState>({ isDataHidden: false });

  // must allways be truthy
  const [counter, incrementCounter] = useReducer((x) => ++x, 1);

  const clear = useCallback(() => {
    if (state.isDataHidden) return;
    setState(assign({}, state, { isDataHidden: true }));
  }, [state, setState]);

  const populate = useCallback(() => {
    if (!state.isDataHidden) return;
    setState(assign({}, state, { isDataHidden: false }));
  }, [state, setState]);

  const middleware: LowLevelMiddleware = {
    clearData: clear,
    populateData: populate,
    triggerUpdate: incrementCounter,
  };

  return (
    <ContextLowLevel.Provider
      value={{ middleware, state, forceUpdateEvent: counter }}
    >
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

  return (
    <ContextHighLevel.Provider
      value={{
        state,
        nextPage,
        previousPage,
        toPage,
        setResultsPerPage,
        setTotalResults,
        clear: middleware.clearData,
        populate: middleware.populateData,
        update: middleware.triggerUpdate,
      }}
    >
      {children}
    </ContextHighLevel.Provider>
  );
};

export const useLowLevel = () => useContext(ContextLowLevel);

export const useHighLevel = () => useContext(ContextHighLevel);

export const Provider = LowLevelAPIWrapper;
