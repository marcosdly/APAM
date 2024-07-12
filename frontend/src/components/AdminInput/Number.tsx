import { ChangeEvent, FC, useId } from 'react';
import { InputProps } from './common';
import Wrapper from './Wrapper';

// Inherits the text box's style
import './Shared/TextBox/_text-box.scss';
import './_number.scss';

interface PlainNumberProps {
  /** Is number floating point? */
  float?: boolean;

  /** Amount of decimal places. Defaults to 2 */
  precision?: number;

  /** Text label with an acronym, e.g. BRL or R$ */
  valueTypeHintLabel?: string;
}

function formatPlainNumber(
  ev: ChangeEvent,
  float: boolean,
  step: number,
  places: number
) {
  const elem = ev.currentTarget as HTMLInputElement;
  if (!elem.value) return;

  // wipe useless values from integers
  if (!float) {
    try {
      const num = window.Number(elem.value);
      if (!num || num <= 0) elem.value = '';
    } catch {
      elem.value = '';
    }
    return;
  }

  // backwards typing effect for floating point numbers
  let text = elem.value.replace(/^[^1-9]*/, '');
  text = text.replace(/[^0-9]/g, '');
  try {
    let num: number = window.Number(text);
    if (!num || num < step) {
      elem.value = '';
      return;
    }
    // from absolute to expected
    num *= step;
    // rounding and trimming decimal places
    num = window.Number(num.toFixed(places));
    // localizing
    const localizer = new Intl.NumberFormat('pt-BR');
    elem.value = localizer.format(num);
  } catch {
    elem.value = '';
  }
}

function formatTelephone(ev: ChangeEvent) {
  const elem: HTMLInputElement = ev.currentTarget as HTMLInputElement;
  if (!elem.value) return;
  // TODO: Prevent from or warn when typing a zero as the very first character
  let text: string = elem.value.replace(/[^0-9]/g, '');
  if (text.length > 11) text = text.slice(0, 11);
  const ddd = text.slice(0, 2);
  const nine = text[2] || '';
  const firstSignificant = text.slice(3, 7);
  const lastSignificant = text.slice(7, 11);
  let formatted: string = '';
  if (ddd) formatted = `(${ddd})`;
  if (nine) formatted += ` ${nine}`;
  if (firstSignificant) formatted += ` ${firstSignificant}`;
  if (lastSignificant) formatted += `-${lastSignificant}`;
  elem.value = formatted;
}

export const Phone: FC<InputProps> = (props) => (
  <Wrapper className="admin-input__phone" {...props}>
    <input
      type="tel"
      pattern="\([1-9][0-9]\) ([0-9] )?[0-9]{4}-[0-9]{4}"
      className="admin-input__simple-text-box number-input"
      onChange={formatTelephone}
    />
  </Wrapper>
);

export const Number: FC<PlainNumberProps & InputProps> = ({
  float,
  precision,
  valueTypeHintLabel,
  ...rest
}) => {
  const id = useId();
  const places = precision || 2;
  const step = 1 * 10 ** -places;

  return (
    <Wrapper className="admin-input__number" {...rest}>
      <div className="value-container">
        {valueTypeHintLabel ? (
          <label className="value-type-label" htmlFor={id}>
            {valueTypeHintLabel}
          </label>
        ) : undefined}
        <input
          type="text"
          className="admin-input__simple-text-box number-input"
          inputMode="numeric"
          step={float ? step : 1}
          min={0}
          id={id}
          onChange={(ev) => formatPlainNumber(ev, Boolean(float), step, places)}
        />
      </div>
    </Wrapper>
  );
};
