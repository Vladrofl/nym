import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { ConnectionStatusKind } from '../types';
import { ConnectionStatsItem } from '../components/ConnectionStats';

const TAURI_EVENT_STATUS_CHANGED = 'app:connection-status-changed';

type ModeType = 'light' | 'dark';

type TClientContext = {
  mode: ModeType;
  connectionStatus: ConnectionStatusKind;
  connectionStats?: ConnectionStatsItem[];
  connectedSince?: DateTime;

  setMode: (mode: ModeType) => void;
  setConnectionStatus: (connectionStatus: ConnectionStatusKind) => void;
  setConnectionStats: (connectionStats: ConnectionStatsItem[] | undefined) => void;
  setConnectedSince: (connectedSince: DateTime | undefined) => void;

  startConnecting: () => Promise<void>;
  startDisconnecting: () => Promise<void>;
};

export const ClientContext = createContext({} as TClientContext);

export const ClientContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ModeType>('dark');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusKind>(ConnectionStatusKind.disconnected);
  const [connectionStats, setConnectionStats] = useState<ConnectionStatsItem[]>();
  const [connectedSince, setConnectedSince] = useState<DateTime>();

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    // TODO: fix typings
    listen(TAURI_EVENT_STATUS_CHANGED, (event) => {
      const { status } = event.payload as any;
      console.log(TAURI_EVENT_STATUS_CHANGED, { status, event });
      setConnectionStatus(status);
    }).then((result) => {
      unlisten = result;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const startConnecting = useCallback(async () => {
    await invoke('start_connecting');
  }, []);

  const startDisconnecting = useCallback(async () => {
    await invoke('start_disconnecting');
  }, []);

  return (
    <ClientContext.Provider
      value={{
        mode,
        setMode,
        connectionStatus,
        setConnectionStatus,
        connectionStats,
        setConnectionStats,
        connectedSince,
        setConnectedSince,
        startConnecting,
        startDisconnecting,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClientContext = () => useContext(ClientContext);
