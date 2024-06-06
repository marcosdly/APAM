import { SidebarProvider } from '@/hooks/SidebarProvider';
import { FC, HTMLAttributes } from 'react';
import AdminHeader from '../AdminHeader/AdminHeader';
import { AdminPanelProvider, useAdminPanel } from '@/hooks/AdminPanelProvider';

import './_admin-panel.scss';

const Banner: FC<HTMLAttributes<HTMLElement>> = () => {
  const { settings } = useAdminPanel();

  return !settings.bannerText ? undefined : (
    <aside className="admin-panel__banner">
      <h1 className="admin-panel__banner-text">{settings.bannerText}</h1>
    </aside>
  );
};

const PageTitle: FC<HTMLAttributes<HTMLHeadingElement>> = () => {
  const { settings } = useAdminPanel();

  return !settings.title ? undefined : (
    <h1 className="admin-panel__page-title">{settings.title}</h1>
  );
};

const AdminPanel: FC<HTMLAttributes<HTMLElement>> = ({ children }) => {
  return (
    <SidebarProvider>
      <AdminHeader />
      <AdminHeader sidebar={true} />
      <AdminPanelProvider>
        <div className="admin-panel">
          <Banner />
          <article className="admin-panel__working-area">
            <PageTitle />
            <main className="admin-panel__content-frame">{children}</main>
          </article>
        </div>
      </AdminPanelProvider>
    </SidebarProvider>
  );
};

export default AdminPanel;
