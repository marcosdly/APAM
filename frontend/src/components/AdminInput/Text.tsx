import { FC } from 'react';
import SimpleTextBox from './Shared/TextBox/Simple';
import { CommonInputProps } from './common';
import LongTextBox from './Shared/TextBox/Long';
import Wrapper from './Wrapper';

interface TextProps extends CommonInputProps {
  type: 'url' | 'email' | 'text' | 'password' | 'textarea';
}

const Text: FC<TextProps> = ({ type, ...rest }) => (
  <Wrapper className={`admin-input__${type}`} {...rest}>
    {type === 'textarea' ? (
      <LongTextBox placeholder={rest.placeholder} />
    ) : (
      <SimpleTextBox type={type} placeholder={rest.placeholder} />
    )}
  </Wrapper>
);

export const Url: FC<CommonInputProps> = (rest) => (
  <Text type="url" {...rest} />
);

export const Email: FC<CommonInputProps> = (rest) => (
  <Text type="email" {...rest} />
);

export const Password: FC<CommonInputProps> = (rest) => (
  <Text type="password" {...rest} />
);

export const SimpleText: FC<CommonInputProps> = (rest) => (
  <Text type="text" {...rest} />
);

export const LongText: FC<CommonInputProps> = (rest) => (
  <Text type="textarea" {...rest} />
);
