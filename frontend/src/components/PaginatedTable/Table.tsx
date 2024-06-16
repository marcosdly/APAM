import { useDatabase } from '@/hooks/PaginatedTableDatabaseProvider';
import { useLowLevel } from '@/hooks/PaginatedTableProvider';
import { FC, HTMLAttributes, ReactElement } from 'react';

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

interface TextContent {
  text?: string;
}

/** Converts data to an user-expected, user-readable format */
function readable(data: unknown): string {
  // TODO: trim number's decimal places
  // TODO: convert Date objects or date strings to Brazillian format
  // TODO: unicode normalization
  // TODO: convertion error text on error
  // TODO: (maybe?) arrays to readable plain text lists
  // TODO: (maybe?) objects to readable plai text ordered lists
  return String(data);
}

const Table: FC<TableProps> = (props) => {
  const placeholderColumns = props.placeholderColumns || 4,
    placeholderRows = props.placeholderRows || 10;

  const db = useDatabase();
  const low = useLowLevel();

  // TODO: add option to sort data
  // TODO: add global unique number generator (uuid npm package?)

  const HeaderCell: FC<TextContent> = ({ text }) => (
    <th className="table-header-cell" scope="col">
      {text}
    </th>
  );

  const Cell: FC<TextContent> = ({ text }) => (
    <td className="table-cell">{text}</td>
  );

  const TableRow: FC<HTMLAttributes<HTMLElement>> = ({ children }) => (
    <tr className="table-row">{children}</tr>
  );

  const HeaderRow: FC = () => {
    let cells: ReactElement[] = [];

    if (!db.state.isReady || db.state.headers.length === 0) {
      // placeholder cells
      cells = Array(placeholderColumns)
        .fill(null)
        .map(() => <HeaderCell key={crypto.randomUUID()} />);
    } else {
      cells = db.state.headers.map((header) => (
        <HeaderCell key={crypto.randomUUID()} text={header} />
      ));
    }

    return <TableRow>{cells}</TableRow>;
  };

  const makePlaceholders = (): ReactElement[] => {
    const cells = Array(placeholderColumns)
      .fill(null)
      .map(() => <Cell key={crypto.randomUUID()} />);
    const rows = Array(placeholderRows)
      .fill(null)
      .map(() => <TableRow key={crypto.randomUUID()}>{cells}</TableRow>);
    return rows;
  };

  const makeCells = async (): Promise<ReactElement[]> => {
    // TODO: query data more efficiently
    // TODO: sort data
    const data = await db.getAll();

    const rows = data.map((doc) => {
      const cells = db.state.headers.map((header) => {
        return <Cell key={crypto.randomUUID()} text={readable(doc[header])} />;
      });

      return <TableRow key={crypto.randomUUID()}>{cells}</TableRow>;
    });

    return rows;
  };

  const TableBody: FC = () => {
    return (
      <>
        {!db.state.isReady || db.state.isEmpty || low.state.isDataHidden
          ? makePlaceholders()
          : makeCells()}
      </>
    );
  };

  let footer: ReactElement | undefined;
  if (props.showTableFooter) {
    footer = (
      <tfoot className="table-footer">
        <HeaderRow />
      </tfoot>
    );
  }

  const header = (
    <thead className="table-header">
      <HeaderRow />
    </thead>
  );

  const table = (
    <table className="paginated-table">
      {header}
      <tbody className="table-body">
        <TableBody />
      </tbody>
      {footer}
    </table>
  );

  return <>{low.forceUpdateEvent && table}</>;
};

export default Table;
