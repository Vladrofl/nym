import React, { useContext, useState } from 'react';
import { Stack, Box, CircularProgress } from '@mui/material';
import { NymWordmark } from '@nymproject/react';
import {
  CreatePassword,
  ExistingAccount,
  CreateMnemonic,
  VerifyMnemonic,
  WelcomeContent,
  SignInMnemonic,
} from './pages';
import { TLoginType, TPages } from './types';
import { RenderPage, Step } from './components';
import { ClientContext } from '../../context/main';
import { SignInPassword } from './pages/signin-password';

export const Welcome = () => {
  const [page, setPage] = useState<TPages>('welcome');
  const [loginType, setLoginType] = useState<TLoginType>('mnemonic');
  const { isLoading } = useContext(ClientContext);

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'auto',
        bgcolor: 'nym.background.dark',
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          margin: 'auto',
        }}
      >
        {isLoading ? (
          <CircularProgress size={72} />
        ) : (
          <Stack spacing={3} alignItems="center" sx={{ width: 1080 }}>
            <NymWordmark width={75} />
            <Step currentPage={page} totalSteps={3} />
            <RenderPage page={page}>
              <WelcomeContent
                onUseExisting={() => setPage('existing account')}
                onCreateAccount={() => setPage('create mnemonic')}
                page="welcome"
              />
              <CreateMnemonic
                onNext={() => setPage('verify mnemonic')}
                onPrev={() => setPage('create password')}
                page="create mnemonic"
              />
              <VerifyMnemonic onNext={() => setPage('create password')} onPrev={() => {}} page="verify mnemonic" />
              <CreatePassword
                onSkip={() => {
                  setLoginType('mnemonic');
                  setPage('existing account');
                }}
                onNext={() => {
                  setLoginType('password');
                  setPage('existing account');
                }}
                page="create password"
              />
              <ExistingAccount
                onPrev={() => setPage('welcome')}
                page="existing account"
                loginType={loginType}
                setLoginType={(loginType) => setLoginType(loginType)}
              />
              <SignInMnemonic onPrev={() => setPage('welcome')} page="sign in with mnemonic" />
              <SignInPassword onPrev={() => setPage('welcome')} page="sign in with password" />
            </RenderPage>
          </Stack>
        )}
      </Box>
    </Box>
  );
};
