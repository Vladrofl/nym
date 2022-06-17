import React, { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Stack } from '@mui/material';
import { SimpleModal } from '../../components/Modals/SimpleModal';
import { AmountData, NodeType } from './types';
import { CurrencyInput } from './bond-form/CurrencyInput';
import { AppContext } from '../../context';
import { amountSchema } from './amountSchema';
import { TokenPoolSelector } from '../../components';
import { TextFieldInput } from './bond-form';

export interface Props {
  nodeType: NodeType;
  open: boolean;
  onClose?: () => void;
  onSubmit: (data: AmountData) => Promise<void>;
  header?: string;
  buttonText?: string;
}

export const AmountModal = ({ open, onClose, onSubmit, header, buttonText, nodeType }: Props) => {
  const {
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm<AmountData>({
    resolver: yupResolver(amountSchema),
    defaultValues: {
      tokenPool: 'balance',
    },
  });

  const { userBalance, clientDetails } = useContext(AppContext);

  const onSubmitForm = (data: AmountData) => {
    onSubmit(data);
  };

  console.log(watch('amount'));
  console.log(isValid);
  console.log(errors);

  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      onOk={handleSubmit(onSubmitForm)}
      header={header || 'Bond'}
      subHeader="Step 2/2"
      okLabel={buttonText || 'Next'}
      okDisabled={!isValid}
    >
      <form>
        {nodeType === 'mixnode' && (
          <TextFieldInput
            name="profitMargin"
            control={control}
            defaultValue=""
            label="Profit Margin"
            placeholder="Profit Margin"
            error={Boolean(errors.profitMargin)}
            required
            muiTextFieldProps={{ fullWidth: true }}
            sx={{ mb: 2.5 }}
          />
        )}
        <Stack direction="row" spacing={2}>
          {userBalance.originalVesting && (
            <TokenPoolSelector onSelect={(pool) => setValue('tokenPool', pool)} disabled={false} />
          )}
          <CurrencyInput
            control={control}
            required
            fullWidth
            label="Amount"
            name="amount"
            currencyDenom={clientDetails?.denom}
            errorMessage={errors.amount?.amount?.message}
          />
        </Stack>
      </form>
    </SimpleModal>
  );
};
