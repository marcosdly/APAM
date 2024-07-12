import { FC, useId, useReducer } from 'react';
import TickBox from './Shared/TickBox/TickBox';
import TickBoxGroup from './Shared/TickBox/TickBoxGroup';

import './_toggle.scss';
import { InputProps } from './common';
import Wrapper from './Wrapper';

interface MarkProps extends InputProps {
  options: string[];
}

interface ToggleProps {
  label: string;
}

export const Checkbox: FC<MarkProps> = ({ options, ...rest }) => {
  const groupId = useId();
  return (
    <Wrapper className="admin-input__checkbox" {...rest}>
      <TickBoxGroup>
        {options.map((label) => (
          <TickBox
            key={crypto.randomUUID()}
            type="checkbox"
            label={label}
            groupId={groupId}
          />
        ))}
      </TickBoxGroup>
    </Wrapper>
  );
};

export const Toggle: FC<ToggleProps> = ({ label }) => {
  const [active, toggleActive] = useReducer((current) => !current, false);
  const id = useId();

  return (
    <div className="admin-input__toggle">
      <button
        id={id}
        className={`admin-input__toggle-button ${active ? 'active' : ''}`}
        type="button"
        onClick={toggleActive}
      ></button>
      <label className="admin-input__toggle-label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
};

export const Radio: FC<MarkProps> = ({ options, ...rest }) => {
  const groupId = useId();
  return (
    <Wrapper className="admin-input__radio" {...rest}>
      <TickBoxGroup>
        {options.map((label) => (
          <TickBox
            key={crypto.randomUUID()}
            type="radio"
            label={label}
            groupId={groupId}
          />
        ))}
      </TickBoxGroup>
    </Wrapper>
  );
};
