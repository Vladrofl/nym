import React, { useContext } from 'react';
import { AppContext } from 'src/context/main';
import { Box } from '@mui/material';
import { useBondingContext, BondingContextProvider } from '../../context';
import { PageLayout } from '../../layouts';
import { BondingCard } from './BondingCard';
import { BondedMixnodeCard } from './BoundedMixnodeCard';
import { BondedGatewayCard } from './BoundedGatewayCard';

const Bonding = () => {
  const { bondedMixnode, bondedGateway } = useBondingContext();
  return (
    <PageLayout>
      <Box display="flex" flexDirection="column" gap={2}>
        {!bondedMixnode && !bondedGateway && <BondingCard />}
        {bondedMixnode && <BondedMixnodeCard />}
        {bondedGateway && <BondedGatewayCard />}
      </Box>
    </PageLayout>
  );
};

export const BondingPage = () => {
  const { network } = useContext(AppContext);
  return (
    <BondingContextProvider network={network}>
      <Bonding />
    </BondingContextProvider>
  );
};
