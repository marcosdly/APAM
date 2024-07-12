import { FC, HTMLAttributes } from 'react';
import Title from './Shared/Title/Title';
import { InputProps } from './common';

const Wrapper: FC<InputProps & HTMLAttributes<HTMLElement>> = ({
  title,
  required,
  className,
  children,
}) => (
  <div className={className}>
    <Title text={title} required={required} />
    {children}
  </div>
);

export default Wrapper;
