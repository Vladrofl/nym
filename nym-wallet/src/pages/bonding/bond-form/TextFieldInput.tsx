import * as React from 'react';
import { Control, useController } from 'react-hook-form';
import { SxProps, TextField, TextFieldProps } from '@mui/material';

interface Props {
  name: string;
  label: string;
  placeholder?: string;
  control: Control<any>;
  defaultValue: string;
  required?: boolean;
  error?: boolean;
  muiTextFieldProps?: TextFieldProps;
  helperText?: string;
  sx?: SxProps;
}

export const TextFieldInput = ({
  name,
  label,
  control,
  defaultValue,
  placeholder,
  muiTextFieldProps,
  required,
  error,
  sx,
}: Props) => {
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
      id={name}
      label={label}
      variant="outlined"
      placeholder={placeholder}
      required={required}
      inputRef={ref}
      error={error}
      {...muiTextFieldProps}
      sx={sx}
    />
  );
};
