import { useHighLevel } from '@/hooks/PaginatedTableProvider';
import { FC } from 'react';

const ResultCounter: FC<unknown> = () => {
  const { state } = useHighLevel();
  const perPage = state.resultsPerPage || 0,
    total = state.totalResults || 0;

  return (
    <aside className="table-result-counter">
      <p className="text">
        Exibindo <span className="number per-page">{perPage}</span> resultados
        de <span className="number total">{total}</span>
      </p>
    </aside>
  );
};

export default ResultCounter;
