import { FC, useId } from 'react';
import Box from '../Box/Box';
import BoxGroup from '../Box/BoxGroup';
import Title from '../Title/Title';

interface RadioProps {
  options: string[];
  title: string;
  required: boolean;
}

const Radio: FC<RadioProps> = ({ options, title, required }) => {
  const groupId = useId();
  return (
    <div className="admin-input__radio">
      <Title text={title} required={required} />
      <BoxGroup>
        {options.map((label) => (
          <Box
            key={crypto.randomUUID()}
            type="radio"
            label={label}
            groupId={groupId}
          />
        ))}
      </BoxGroup>
    </div>
  );
};

export default Radio;
