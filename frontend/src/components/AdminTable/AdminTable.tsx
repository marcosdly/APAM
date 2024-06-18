import { FC } from 'react';
import { Table } from '../PaginatedTable';

import './_paginated-table.scss';
import ResultCounter from '../PaginatedTable/ResultCounter';
import PageSelector from '../PaginatedTable/PageSelector';

const AdminTable: FC<unknown> = () => {
  return (
    <div className="admin-table">
      <Table />
      <ResultCounter />
      <PageSelector />
    </div>
  );
};

export default AdminTable;
