import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Stack } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import { SimpleModal } from '../../components/Modals/SimpleModal';
import { NodeData, NodeType } from './types';
import { RadioInput, TextFieldInput, CheckboxInput } from './bond-form';
import { nodeSchema } from './nodeSchema';

export interface Props {
  open: boolean;
  onClose?: () => void;
  onSubmit: (data: NodeData) => Promise<void>;
  header?: string;
  buttonText?: string;
}

const radioOptions: { label: string; value: NodeType }[] = [
  {
    label: 'Mixnode',
    value: 'mixnode',
  },
  {
    label: 'Gateway',
    value: 'gateway',
  },
];

export const NodeIdentityModal = ({ open, onClose, onSubmit, header, buttonText }: Props) => {
  const {
    control,
    getValues,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm<NodeData>({
    defaultValues: {
      nodeType: radioOptions[0].value,
      advancedOpt: false,
    },
    resolver: yupResolver(nodeSchema),
  });

  const nodeType = useWatch({ name: 'nodeType', control });

  const onSubmitForm = (data: NodeData) => {
    onSubmit(data);
  };

  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      onOk={handleSubmit(onSubmitForm)}
      header={header || 'Bond'}
      subHeader="Step 1/2"
      okLabel={buttonText || 'Next'}
      okDisabled={!isValid}
    >
      <form>
        <RadioInput
          name="nodeType"
          label="Select node type"
          options={radioOptions}
          control={control}
          defaultValue={getValues('nodeType')}
          muiRadioGroupProps={{ row: true }}
        />
        <TextFieldInput
          name="identityKey"
          control={control}
          defaultValue=""
          label="Identity Key"
          placeholder="Identity Key"
          error={Boolean(errors.identityKey)}
          required
          muiTextFieldProps={{ fullWidth: true }}
          sx={{ mb: 2.5, mt: 1 }}
        />
        <TextFieldInput
          name="sphinxKey"
          control={control}
          defaultValue=""
          label="Sphinx Key"
          placeholder="Sphinx Key"
          error={Boolean(errors.sphinxKey)}
          required
          muiTextFieldProps={{ fullWidth: true }}
          sx={{ mb: 2.5 }}
        />
        <TextFieldInput
          name="signature"
          control={control}
          defaultValue=""
          label="Signature"
          placeholder="Signature"
          error={Boolean(errors.signature)}
          required
          muiTextFieldProps={{ fullWidth: true }}
          sx={{ mb: 2.5 }}
        />
        {nodeType === 'gateway' && (
          <TextFieldInput
            name="location"
            control={control}
            defaultValue=""
            label="Location"
            placeholder="Location"
            error={Boolean(errors.location)}
            required
            muiTextFieldProps={{ fullWidth: true }}
            sx={{ mb: 2.5 }}
          />
        )}
        <Stack direction="row" spacing={2}>
          <TextFieldInput
            name="host"
            control={control}
            defaultValue=""
            label="Host"
            placeholder="Host"
            error={Boolean(errors.host)}
            required
            muiTextFieldProps={{ fullWidth: true }}
            sx={{ mb: 2.5 }}
          />
          <TextFieldInput
            name="version"
            control={control}
            defaultValue=""
            label="Version"
            placeholder="Version"
            error={Boolean(errors.version)}
            required
            muiTextFieldProps={{ fullWidth: true }}
            sx={{ mb: 2.5 }}
          />
        </Stack>
        <CheckboxInput name="advancedOpt" label="Use advanced options" control={control} defaultValue={false} />
      </form>
    </SimpleModal>
  );
};
