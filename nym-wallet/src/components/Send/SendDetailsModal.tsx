import React from 'react';
import { Button, Stack } from '@mui/material';
import { FeeDetails, MajorCurrencyAmount } from '@nymproject/types';
import { SimpleModal } from '../Modals/SimpleModal';
import { ModalListItem } from '../Delegation/ModalListItem';

export const SendDetailsModal = ({
  amount,
  toAddress,
  fromAddress,
  fee,
  onClose,
  onPrev,
  onSend,
}: {
  fromAddress?: string;
  toAddress: string;
  fee?: FeeDetails;
  amount?: MajorCurrencyAmount;
  onClose: () => void;
  onPrev: () => void;
  onSend: (data: { val: MajorCurrencyAmount; to: string }) => void;
}) => (
  <SimpleModal
    header="Send details"
    open
    onClose={onClose}
    okLabel="Confirm"
    onOk={() => amount && onSend({ val: amount, to: toAddress })}
    SecondaryAction={
      <Button fullWidth size="large" sx={{ mt: 2 }} onClick={onPrev}>
        Back
      </Button>
    }
  >
    <Stack gap={0.5} sx={{ mt: 4 }}>
      <ModalListItem label="From" value={fromAddress} divider />
      <ModalListItem label="To" value={toAddress} divider />
      <ModalListItem label="Amount" value={`${amount?.amount} ${amount?.denom}`} divider />
      <ModalListItem
        label="Fee for this transaction"
        value={!fee ? 'n/a' : `${fee.amount?.amount} ${fee.amount?.denom}`}
        divider
      />
    </Stack>
  </SimpleModal>
);