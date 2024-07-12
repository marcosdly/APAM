import { FC, ReactElement } from 'react';
import { CommonInputProps } from './common';

import './Shared/TextBox/_text-box.scss';
import Wrapper from './Wrapper';

interface SelectProps extends CommonInputProps {
  options: Record<'id' | 'text', string>[];
}

const Select: FC<SelectProps> = ({ options, ...rest }) => {
  const optionElements: ReactElement[] = options.map((data) => (
    <option key={crypto.randomUUID()} value={data.id}>
      {data.text}
    </option>
  ));

  return (
    <Wrapper className="admin-input__select" {...rest}>
      <select className="admin-input__simple-text-box">
        <option value="">{rest.placeholder || 'Selecione uma opção'}</option>
        {optionElements}
      </select>
    </Wrapper>
  );
};

export default Select;
