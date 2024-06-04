import { FC, HTMLAttributes } from 'react';
import CompleteLogo from '@/components/icons/CompleteLogo';
import MinimalLogo from '../icons/MinimalLogo';

import './_admin-header.scss';

interface ButtonProps {
  title: string;
  endalign?: boolean;
}

const Button: FC<ButtonProps> = ({ title, endalign }) => (
  <button
    className={`${endalign ? 'admin-header__btn-end-align' : ''} admin-header__btn`}
  >
    {title}
  </button>
);

const AdminHeader: FC<HTMLAttributes<HTMLElement>> = () => (
  <header className="admin-header">
    <CompleteLogo className="admin-header__logo admin-header__complete-logo" />
    <MinimalLogo className="admin-header__logo admin-header__minimal-logo" />
    <nav className="admin-header__nav">
      <Button title="Registro" />
      <Button title="Campanhas" />
      <Button title="Transparência" />
      <Button title="Sair" endalign={true} />
    </nav>
  </header>
);

export default AdminHeader;
