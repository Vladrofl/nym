import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { SimpleModal } from '../../components/Modals/SimpleModal';
import { NodeData, NodeType } from './types';
import { RadioInput, TextFieldInput, CheckboxInput } from './bond-form';
import { nodeIdentitySchema } from './nodeIdentitySchema';

export interface Props {
  open: boolean;
  onClose?: () => void;
  onSubmit: (nodeData: NodeData) => Promise<void>;
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
  const { control, getValues, handleSubmit } = useForm<NodeData>({
    defaultValues: {
      nodeType: radioOptions[0].value,
      advancedOpt: false,
    },
    resolver: yupResolver(nodeIdentitySchema),
  });

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
      okDisabled={false} // TODO base condition on form state
    >
      <form>
        <RadioInput
          name="nodeType"
          label="Select node type"
          options={radioOptions}
          control={control}
          defaultValue={getValues('nodeType')}
        />
        <TextFieldInput name="identityKey" control={control} defaultValue="" placeholder="Identity Key" />
        <TextFieldInput name="sphinxKey" control={control} defaultValue="" placeholder="Sphinx Key" />
        <TextFieldInput name="signature" control={control} defaultValue="" placeholder="Signature" />
        <TextFieldInput name="host" control={control} defaultValue="" placeholder="Host" />
        <TextFieldInput name="version" control={control} defaultValue="" placeholder="Version" />
        <CheckboxInput name="advancedOpt" label="Use advanced options" control={control} defaultValue={false} />
      </form>
    </SimpleModal>
  );
};
