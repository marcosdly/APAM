export interface InputProps {
  title: string;
  required?: boolean;
}

export interface Placeholder {
  placeholder: string;
}

export type CommonInputProps = InputProps & Placeholder;
