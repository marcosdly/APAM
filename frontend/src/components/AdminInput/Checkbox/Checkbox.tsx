import { FC, useId } from 'react';
import Box from '../Box/Box';
import BoxGroup from '../Box/BoxGroup';
import Title from '../Title/Title';

interface CheckboxProps {
  options: string[];
  title: string;
  required: boolean;
}

const Checkbox: FC<CheckboxProps> = ({ options, title, required }) => {
  const groupId = useId();
  return (
    <div className="admin-input__checkbox">
      <Title text={title} required={required} />
      <BoxGroup>
        {options.map((label) => (
          <Box
            key={crypto.randomUUID()}
            type="checkbox"
            label={label}
            groupId={groupId}
          />
        ))}
      </BoxGroup>
    </div>
  );
};

export default Checkbox;
