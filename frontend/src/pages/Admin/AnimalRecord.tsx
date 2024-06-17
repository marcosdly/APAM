import AdminPanel from '@/components/AdminPanel/AdminPanel';
import AdminTable from '@/components/AdminTable/AdminTable';
import { PaginatedTableProvider } from '@/components/PaginatedTable';
import { FC } from 'react';

const AnimalRecord: FC<unknown> = () => (
  <>
    <AdminPanel>
      <PaginatedTableProvider>
        <AdminTable />
      </PaginatedTableProvider>
    </AdminPanel>
  </>
);

export default AnimalRecord;
