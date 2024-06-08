import { useHighLevel, useLowLevel } from '@/hooks/PaginatedTableProvider';
import { FC, HTMLAttributes, useCallback, useEffect, useState } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /**
   * Amount of placeholder columns to render if no column
   * header or data is configured.
   */
  placeholderColumns?: number;

  /**
   * Amount of placeholder roww to render if now row data exists.
   */
  placeholderRows?: number;

  /** Should table footer be rendered? */
  showTableFooter?: boolean;
}

interface CellProps {
  text?: string;
}

interface RowRendererProps {
  data: RowData[];
}

type RowData = Record<string, string>;

const Header: FC<CellProps> = ({ text }) => (
  <th className="header" scope="col">
    {text}
  </th>
);

const Cell: FC<CellProps> = ({ text }) => <td className="cell">{text}</td>;

const HeaderRow: FC<TableProps> = ({ placeholderColumns }) => {
  const { state } = useHighLevel();

  return (
    <tr>
      {!state.headers || state.headers.length === 0
        ? Array(placeholderColumns || 3).fill(<Header />)
        : state.headers.map((text, i) => <Header key={i} text={text} />)}
    </tr>
  );
};

const TableBody: FC<TableProps & RowRendererProps> = ({
  data,
  placeholderRows,
}) => {
  const { state } = useHighLevel();
  let placeholders, rows;

  if (data.length === 0) {
    placeholders = Array(placeholderRows || 10).fill(
      <tr>{state.headers?.map((_, i) => <Cell key={i} />)}</tr>
    );
  }

  if (data.length > 0 && state.headers) {
    rows = data.map((rowdata, i) => {
      const cells = state.headers.map((header, j) => (
        <Cell key={j} text={rowdata[header]} />
      ));

      return <tr key={i}>{cells}</tr>;
    });
  }

  return <tbody>{rows ? rows : placeholders}</tbody>;
};

const Table: FC<TableProps> = (props) => {
  const { setMiddleware } = useLowLevel();
  const { config } = useHighLevel();
  const [data, setData] = useState<RowData[]>([]);

  const clear = useCallback(() => setData([]), [setData]);

  const declareMiddleware = useCallback(() => {
    setMiddleware({ clearData: clear });
  }, [setMiddleware, clear]);

  const declareConfig = () => {
    config({
      headers: ['eu', 'sei', 'la', 'bicho'],
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(declareMiddleware, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(declareConfig, []);

  let footer;
  if (props.showTableFooter) {
    footer = (
      <tfoot className="footer">
        <HeaderRow {...props} />
      </tfoot>
    );
  }

  return (
    <table>
      <thead className="header">
        <HeaderRow {...props} />
      </thead>
      <TableBody data={data} {...props} />
      {footer}
    </table>
  );
};

export default Table;
