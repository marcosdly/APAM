import { FC } from 'react';
import { Table } from '../PaginatedTable';

import './_paginated-table.scss';
import ResultCounter from '../PaginatedTable/ResultCounter';

const AdminTable: FC<unknown> = () => {
  return (
    <div className="admin-table">
      <Table />
      <ResultCounter />
    </div>
  );
};

export default AdminTable;
