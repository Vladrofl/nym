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
import { checkHasEnoughFunds, checkHasEnoughLockedTokens } from '../../utils';

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
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<AmountData>({
    resolver: yupResolver(amountSchema),
    defaultValues: {
      tokenPool: 'balance',
      profitMargin: 10,
    },
  });

  const { userBalance, clientDetails } = useContext(AppContext);

  const onSubmitForm = async (data: AmountData) => {
    if (data.tokenPool === 'balance' && !(await checkHasEnoughFunds(data.amount.amount || ''))) {
      return setError('amount.amount', { message: 'Not enough funds in wallet' });
    }

    if (data.tokenPool === 'locked' && !(await checkHasEnoughLockedTokens(data.amount.amount || ''))) {
      return setError('amount.amount', { message: 'Not enough locked tokens' });
    }
    return onSubmit(data);
  };

  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      onOk={handleSubmit(onSubmitForm)}
      header={header || 'Bond'}
      subHeader="Step 2/2"
      okLabel={buttonText || 'Next'}
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
            helperText={errors.profitMargin ? errors.profitMargin.message : 'Default is 10%'}
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
