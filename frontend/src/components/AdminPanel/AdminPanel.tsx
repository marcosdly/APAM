import { SidebarProvider } from '@/hooks/SidebarProvider';
import { FC, HTMLAttributes } from 'react';
import AdminHeader from '../AdminHeader/AdminHeader';

import './_admin-panel.scss';

const AdminPanel: FC<HTMLAttributes<HTMLElement>> = ({ children }) => {
  return (
    <SidebarProvider>
      <AdminHeader />
      <AdminHeader sidebar={true} />
      <article className="admin-panel__working-area">
        <main className="admin-panel__content-frame">{children}</main>
      </article>
    </SidebarProvider>
  );
};

export default AdminPanel;
