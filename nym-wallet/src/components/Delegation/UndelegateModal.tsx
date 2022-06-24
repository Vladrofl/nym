import React from 'react';
import { Stack, Typography, SxProps } from '@mui/material';
import { IdentityKeyFormField } from '@nymproject/react/mixnodes/IdentityKeyFormField';
import { SimpleModal } from '../Modals/SimpleModal';

export const UndelegateModal: React.FC<{
  open: boolean;
  onClose?: () => void;
  onOk?: (identityKey: string, usesVestingContractTokens: boolean) => void;
  identityKey: string;
  amount: number;
  fee: number;
  currency: string;
  usesVestingContractTokens: boolean;
  sx?: SxProps;
  BackdropProps?: object;
}> = ({ identityKey, open, onClose, onOk, amount, fee, currency, usesVestingContractTokens, sx, BackdropProps }) => {
  const handleOk = () => {
    if (onOk) {
      onOk(identityKey, usesVestingContractTokens);
    }
  };
  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      onOk={handleOk}
      header="Undelegate"
      subHeader="Undelegate from mixnode"
      okLabel="Undelegate stake"
      sx={{ ...sx }}
      BackdropProps={BackdropProps}
    >
      <IdentityKeyFormField
        readOnly
        fullWidth
        placeholder="Node identity key"
        initialValue={identityKey}
        showTickOnValid={false}
      />

      <Stack direction="row" justifyContent="space-between" my={3}>
        <Typography fontWeight={600} sx={{ color: (theme) => theme.palette.text.primary }}>
          Delegation amount:
        </Typography>
        <Typography fontWeight={600} sx={{ color: (theme) => theme.palette.text.primary }}>
          {amount} {currency}
        </Typography>
      </Stack>

      <Typography mb={5} fontSize="smaller" sx={{ color: (theme) => theme.palette.text.primary }}>
        Tokens will be transferred to account you are logged in with now
      </Typography>

      <Stack direction="row" justifyContent="space-between" mt={3}>
        <Typography fontSize="smaller" color={(theme) => theme.palette.nym.fee}>
          Est. fee for this transaction:
        </Typography>
        <Typography fontSize="smaller" color={(theme) => theme.palette.nym.fee}>
          {fee} {currency}
        </Typography>
      </Stack>
    </SimpleModal>
  );
};
