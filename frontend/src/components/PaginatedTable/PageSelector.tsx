import { useDatabase } from '@/hooks/PaginatedTableDatabaseProvider';
import { useHighLevel } from '@/hooks/PaginatedTableProvider';
import { FC, ReactElement, useEffect, useState } from 'react';

interface PageSelector {
  /** Amount of visible, clickable, page numbers. Has to be odd! */
  visible?: number;
}

interface PageButton {
  /** Child tree position (as in a queue); 1-based index */
  index: number;
}

const PageSelector: FC<PageSelector> = ({ visible }) => {
  const { state, toPage, nextPage, previousPage } = useHighLevel();
  const db = useDatabase();

  if (visible && visible % 2 !== 1)
    throw new TypeError('Amount of visible pages has to be an odd integer');

  // TODO: account for the "total results" to "results per page" ratio
  // TODO: use differently-looking placeholders when possible amount of pages
  //       is less than minimum displayable
  /** Always odd */
  const visiblePages = visible || 5;
  /** Offset until jump buttons are invisible */
  const visibleOffset = Math.ceil(visiblePages / 2);
  /** Offset that determines which numbers will be rendered */
  const buttonRenderOffset = Math.floor(visiblePages / 2);

  /** Necessary data to display component properly is set */
  const [isReady, setIsReady] = useState<boolean>(false);
  /** Cached current page */
  const [selected, setSelected] = useState<number>(1);
  /** Cached total number of pages */
  const [total, setTotal] = useState<number>(visiblePages);

  useEffect(() => {
    setIsReady(db.state.isReady && Boolean(state.totalPages));

    if (!isReady || !state.totalPages) setTotal(visiblePages);
    else setTotal(state.totalPages);

    if (isReady || state.currentPage) setSelected(state.currentPage);
  }, [
    db.state.isReady,
    isReady,
    setIsReady,
    setSelected,
    setTotal,
    state.currentPage,
    state.totalPages,
    visiblePages,
  ]);

  /** Current page is in permitted range to page to change */
  const inRange = selected >= 1 && selected <= total;

  const tolast = (
    <button
      type="button"
      disabled={selected >= total}
      onClick={() => {
        if (isReady) toPage(total);
        else setSelected(total);
      }}
      className="jump-button to-last"
    >
      {'>>'}
    </button>
  );

  const tofirst = (
    <button
      type="button"
      disabled={selected <= 1}
      onClick={() => {
        if (isReady) toPage(1);
        else setSelected(1);
      }}
      className="jump-button to-first"
    >
      {'<<'}
    </button>
  );

  const next = (
    <button
      type="button"
      disabled={selected >= total}
      onClick={() => {
        if (isReady) nextPage();
        else if (inRange) setSelected(selected + 1);
      }}
      className="jump-button next"
    >
      {'>'}
    </button>
  );

  const previous = (
    <button
      type="button"
      disabled={selected <= 1}
      onClick={() => {
        if (isReady) previousPage();
        else if (inRange) setSelected(selected - 1);
      }}
      className="jump-button previous"
    >
      {'<'}
    </button>
  );

  const PageButton: FC<PageButton> = ({ index }) => {
    /** Going to **previous** page will not change numbers */
    const reachedLeftWall = selected <= visibleOffset;
    /** Going to **next** page will not change numbers */
    const reachedRightWall = selected >= total - visibleOffset;

    let pageNumber: number;
    if (reachedLeftWall) {
      pageNumber = index;
    } else if (reachedRightWall) {
      pageNumber = total - visiblePages + index;
    } else if (selected === buttonRenderOffset) {
      // Will be the one centered
      pageNumber = selected;
    } else {
      // Surrounding the centered number
      const min = selected - buttonRenderOffset;
      pageNumber = min + index;
    }

    let active: boolean;
    if (reachedLeftWall) {
      active = index === selected;
    } else if (reachedRightWall) {
      active = index === visiblePages - (total - selected);
    } else {
      // The one centered
      active = index === buttonRenderOffset;
    }

    return (
      <button
        className={`page-button ${active ? 'active' : ''}`}
        onClick={() => {
          if (isReady) toPage(pageNumber);
          else if (inRange) setSelected(pageNumber);
        }}
        type="button"
      >
        {pageNumber}
      </button>
    );
  };

  const buttons: ReactElement[] = [];
  for (let i = 1; i <= visiblePages; ++i)
    buttons.push(<PageButton key={crypto.randomUUID()} index={i} />);

  return (
    <div className="page-selector">
      {tofirst}
      {previous}
      <div className="page-button-container">{buttons}</div>
      {next}
      {tolast}
    </div>
  );
};

export default PageSelector;
