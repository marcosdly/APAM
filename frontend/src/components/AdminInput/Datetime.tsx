import { FC } from 'react';
import { InputProps } from './common';
import Wrapper from './Wrapper';

interface DatetimeProps extends InputProps {
  min?: Date;
  max?: Date;
  value?: Date;
}

const Datetime: FC<DatetimeProps> = ({ min, max, value, ...rest }) => (
  <Wrapper className="admin-input__datetime" {...rest}>
    <input
      type="datetime-local"
      className="admin-input__simple-text-box datetime-input"
      min={min?.valueOf?.()}
      max={max?.valueOf?.()}
      value={value?.valueOf?.()}
    />
  </Wrapper>
);
export default Datetime;
