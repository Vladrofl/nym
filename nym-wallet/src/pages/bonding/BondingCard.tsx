import React, { useReducer } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { NymCard } from '../../components';
import { NodeIdentityModal } from './NodeIdentityModal';
import { ACTIONTYPE, BondState, FormStep } from './types';
import { AmountModal } from './AmountModal';

const initialState: BondState = {
  showModal: false,
  formStep: 1,
};

function reducer(state: BondState, action: ACTIONTYPE) {
  let step;
  switch (action.type) {
    case 'change_bond_type':
      return { ...state, type: action.payload };
    case 'set_node_data':
      return { ...state, identityData: action.payload };
    case 'set_amount_data':
      return { ...state, amountData: action.payload };
    case 'set_step':
      return { ...state, formStep: action.payload };
    case 'next_step':
      step = state.formStep + 1;
      return { ...state, formStep: step <= 3 ? (step as FormStep) : 3 };
    case 'previous_step':
      step = state.formStep - 1;
      return { ...state, formStep: step >= 1 ? (step as FormStep) : 1 };
    case 'show_modal':
      return { ...state, showModal: true };
    case 'close_modal':
      return { ...state, showModal: false };
    case 'reset':
      return initialState;
    default:
      throw new Error();
  }
}

export const BondingCard = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { formStep, showModal } = state;
  console.log(state);

  return (
    <NymCard title="Bonding">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pt: 0,
        }}
      >
        <Typography>Bond a node or a gateway</Typography>
        <Button
          disabled={false}
          variant="contained"
          color="primary"
          type="button"
          disableElevation
          onClick={() => dispatch({ type: 'show_modal' })}
          sx={{ py: 1.5, px: 3 }}
        >
          Bond
        </Button>
      </Box>
      {formStep === 1 && showModal && (
        <NodeIdentityModal
          open={formStep === 1 && showModal}
          onClose={() => dispatch({ type: 'reset' })}
          onSubmit={async (data) => {
            dispatch({ type: 'set_node_data', payload: data });
            // dispatch({ type: 'next_step' });
          }}
          header="Bond"
          buttonText="Next"
        />
      )}
      {formStep === 2 && showModal && (
        <AmountModal
          open={formStep === 2 && showModal}
          onClose={() => dispatch({ type: 'reset' })}
          onSubmit={async (data) => {
            dispatch({ type: 'set_amount_data', payload: data });
            // dispatch({ type: 'next_step' });
          }}
          header="Bond"
          buttonText="Next"
          nodeType={state.nodeData?.nodeType || 'mixnode'}
        />
      )}
    </NymCard>
  );
};
