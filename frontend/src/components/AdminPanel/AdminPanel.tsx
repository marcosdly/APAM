import { SidebarProvider } from '@/hooks/SidebarProvider';
import { FC, HTMLAttributes, type ReactNode } from 'react';
import AdminHeader from '../AdminHeader/AdminHeader';
import { AdminPanelProvider, useAdminPanel } from '@/hooks/AdminPanelProvider';

import './_admin-panel.scss';

const Banner: FC<HTMLAttributes<HTMLElement>> = () => {
  const { settings } = useAdminPanel();

  return (
    <aside className="admin-panel__banner">
      <h1 className="admin-panel__banner-text">{settings.bannerText}</h1>
    </aside>
  );
};

// TODO: Remove type signatures
const PageTitle: FC<HTMLAttributes<HTMLHeadingElement>> = () => {
  const { settings } = useAdminPanel();

  return <h1 className="admin-panel__page-title">{settings.title}</h1>;
};

const EdgeButtonContainer: FC<unknown> = () => {
  const { settings } = useAdminPanel();

  return (
    <div className="admin-panel__edge-btn-container">
      {settings.buttons!.left}
      {settings.buttons!.middle}
      {settings.buttons!.right}
    </div>
  );
};

const Consumer: FC<HTMLAttributes<HTMLElement>> = ({ children }) => {
  const { settings } = useAdminPanel();

  const hasAnyValid = (pojo: Record<string, ReactNode>) => {
    return 'left' in pojo || 'middle' in pojo || 'right' in pojo;
  };

  const withBanner = settings.bannerText ? 'with-banner' : '';
  const withTitle = settings.title ? 'with-title' : '';
  const withButton =
    settings.buttons && hasAnyValid(settings.buttons) ? 'with-edge-button' : '';

  return (
    <div className={`admin-panel ${withBanner} ${withTitle}`}>
      {withBanner && <Banner />}
      <article className={`admin-panel__working-area ${withButton}`}>
        {withTitle && <PageTitle />}
        {withButton && <EdgeButtonContainer />}
        <main className={`admin-panel__content-frame ${withButton}`}>
          {children}
        </main>
      </article>
    </div>
  );
};

const AdminPanel: FC<HTMLAttributes<HTMLElement>> = ({ children }) => {
  return (
    <SidebarProvider>
      <AdminHeader />
      <AdminHeader sidebar={true} />
      <AdminPanelProvider>
        <Consumer>{children}</Consumer>
      </AdminPanelProvider>
    </SidebarProvider>
  );
};

export default AdminPanel;
