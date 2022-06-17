import * as React from 'react';
import { Control, useController } from 'react-hook-form';
import { TextField, TextFieldProps } from '@mui/material';

interface Props {
  name: string;
  placeholder?: string;
  control: Control<any>;
  defaultValue: string;
  muiTextFieldProps?: TextFieldProps;
}

export const TextFieldInput = ({ name, control, defaultValue, placeholder, muiTextFieldProps }: Props) => {
  const {
    field: { onChange, onBlur, value, ref },
  } = useController({
    name,
    control,
    defaultValue,
  });
  return (
    <TextField
      onChange={onChange}
      onBlur={onBlur}
      value={value}
      name={name}
      inputRef={ref}
      id={`outlined-basic-${name}`}
      label={name}
      variant="outlined"
      placeholder={placeholder}
      {...muiTextFieldProps}
    />
  );
};
