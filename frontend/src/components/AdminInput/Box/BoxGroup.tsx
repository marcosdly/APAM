import { FC, HTMLAttributes } from 'react';

const BoxGroup: FC<HTMLAttributes<HTMLElement>> = ({ children }) => (
  <div className="admin-input__box-group">{children}</div>
);

export default BoxGroup;
