import { TransactionExecuteResult } from '@nymproject/types';
import React, { createContext, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Network } from 'src/types';

export type TBondingContext = {
  isLoading: boolean;
  error?: string;
  bondedMixnode?: any; // TODO fix up type
  bondedGateway?: any; // TODO fix up type
  refresh: () => Promise<void>;
  bondMixnode: (data: any) => Promise<TransactionExecuteResult>;
  bondGateway: (data: any) => Promise<TransactionExecuteResult>;
  unbondMixnode: () => Promise<TransactionExecuteResult>;
  unbondGateway: () => Promise<TransactionExecuteResult>;
  redeemRewards: () => Promise<TransactionExecuteResult>;
  compoundRewards: () => Promise<TransactionExecuteResult>;
};

export const BondingContext = createContext<TBondingContext>({
  isLoading: true,
  refresh: async () => undefined,
  bondMixnode: async () => {
    throw new Error('Not implemented');
  },
  bondGateway: async () => {
    throw new Error('Not implemented');
  },
  unbondMixnode: async () => {
    throw new Error('Not implemented');
  },
  unbondGateway: async () => {
    throw new Error('Not implemented');
  },
  redeemRewards: async () => {
    throw new Error('Not implemented');
  },
  compoundRewards: async () => {
    throw new Error('Not implemented');
  },
});

export const BondingContextProvider: FC<{
  network?: Network;
}> = ({ network, children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = async () => {
    throw new Error('Not implemented');
  };

  useEffect(() => {
    refresh();
  }, [network]);

  const memoizedValue = useMemo(
    () => ({
      isLoading,
      error,
      refresh,
      redeemRewards,
      compoundRewards,
    }),
    [isLoading, error],
  );

  return <BondingContext.Provider value={memoizedValue}>{children}</BondingContext.Provider>;
};

export const useBondingContext = () => useContext<TBondingContext>(BondingContext);
