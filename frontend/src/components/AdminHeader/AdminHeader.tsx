import { FC } from 'react';
import CompleteLogo from '@/components/icons/CompleteLogo';

import './_admin-header.scss';
import BurgerMenu from '../BurgerMenu/BurgerMenu';
import { useSidebar } from '@/hooks/SidebarProvider';
import { staticUrl } from '@/services/api/reactRoutes';

interface ButtonProps {
  title: string;
  endalign?: boolean;
  href?: string;
}

interface HeaderProps {
  sidebar?: boolean;
}

const Button: FC<ButtonProps> = ({ title, endalign, href }) => (
  <button
    className={`${endalign ? 'admin-header__btn-end-align' : ''} admin-header__btn`}
    onClick={() => href && window.location.replace(href)}
  >
    {title}
  </button>
);

const AdminHeader: FC<HeaderProps> = ({ sidebar }) => {
  const { isOpen } = useSidebar();
  const isSidebar = sidebar ? 'admin-header-sidebar' : '';
  const sidebarState = sidebar && isOpen ? 'open' : '';

  return (
    <header className={`admin-header ${isSidebar} ${sidebarState}`}>
      <div className="admin-header__logo-container">
        <CompleteLogo className="admin-header__logo admin-header__complete-logo" />
        <BurgerMenu className="admin-header__burger-menu" />
      </div>
      <nav className="admin-header__nav">
        <Button title="Animais" href={staticUrl.animalRecord} />
        <Button title="Campanhas" href={staticUrl.campainRecord} />
        <Button title="Transparência" href={staticUrl.transparencyRecord} />
        <Button title="Sair" endalign={true} />
      </nav>
    </header>
  );
};

export default AdminHeader;
