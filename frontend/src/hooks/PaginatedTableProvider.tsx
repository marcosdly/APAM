import {
  FC,
  HTMLAttributes,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

interface PaginatedTableState {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  resultsPerPage: number;
}

interface PaginatedTableAPI {
  state: PaginatedTableState;
  nextPage: () => void | never;
  previousPage: () => void | never;
  toPage: (pageNumber: number) => void | never;
  setResultsPerPage: (resultsAmount: number) => void;
  setTotalResults: (resultsAmount: number) => void;
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

const context = createContext<PaginatedTableAPI>({} as PaginatedTableAPI);

export const PaginatedTableProvider: FC<HTMLAttributes<HTMLElement>> = ({
  children,
}) => {
  const [state, setState] = useState<PaginatedTableState>({
    totalResults: 0,
    totalPages: 0,
    currentPage: 0,
    resultsPerPage: 0,
  });

  const nextPage = useCallback((): void | never => {
    const newIndex = state.currentPage + 1;
    if (newIndex > state.totalPages)
      throw new PageIndexError(newIndex, state.totalPages);
    setState(Object.assign({}, state, { currentPage: newIndex }));
  }, [state, setState]);

  const previousPage = useCallback((): void | never => {
    const newIndex = state.currentPage - 1;
    if (newIndex < 1) throw new PageIndexError(newIndex, state.totalPages);
    setState(Object.assign({}, state, { currentPage: newIndex }));
  }, [state, setState]);

  const toPage = useCallback(
    (pageNumber: number): void | never => {
      if (pageNumber < 1)
        throw new PageIndexError(pageNumber, state.totalPages);
      if (pageNumber > state.totalPages)
        throw new PageIndexError(pageNumber, state.totalPages);
      setState(Object.assign({}, state, { currentPage: pageNumber }));
    },
    [state, setState]
  );

  const setTotalResults = useCallback(
    (resultsAmount: number) => {
      if (resultsAmount < 1) throw new NonPositiveError(resultsAmount);
      setState(Object.assign({}, state, { totalResults: resultsAmount }));
    },
    [state, setState]
  );

  const setResultsPerPage = useCallback(
    (resultsAmount: number) => {
      if (resultsAmount < 1) throw new NonPositiveError(resultsAmount);
      setState(Object.assign({}, state, { resultsPerPage: resultsAmount }));
    },
    [state, setState]
  );

  return (
    <context.Provider
      value={{
        state,
        nextPage,
        previousPage,
        toPage,
        setResultsPerPage,
        setTotalResults,
      }}
    >
      {children}
    </context.Provider>
  );
};

export const usePaginatedTable = () => useContext(context);

export const Provider = PaginatedTableProvider;
