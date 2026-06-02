import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  apiFetch,
  storeDbSessionToken,
  getDbSessionToken,
  clearDbSessionToken,
} from '@/services/apiClient';

export interface DatabaseInfo {
  database: string;
  type: string;
  supportsQuery: boolean;
}

interface TableInfo {
  name: string;
  rowCount: number;
  lastUpdated: string;
}

export interface ConnectDatabasePayload {
  type: string;
  host?: string;
  port?: string;
  user?: string;
  password?: string;
  database?: string;
  path?: string;
  file?: File | null;
}

interface DatabaseContextType {
  isConnected: boolean;
  databaseInfo: DatabaseInfo | null;
  databaseTables: TableInfo[];
  connect: (data: ConnectDatabasePayload) => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<void>;
  fetchTables: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return ctx;
};

async function connectWithJson(payload: ConnectDatabasePayload) {
  return apiFetch('/api/connect', {
    method: 'POST',
    body: JSON.stringify({
      type: payload.type,
      host: payload.host?.trim() || '',
      port: payload.port ? parseInt(payload.port, 10) : undefined,
      user: payload.user?.trim() || '',
      password: payload.password || '',
      database: payload.database?.trim() || '',
      path: payload.path?.trim() || '',
    }),
  });
}

async function connectWithFile(payload: ConnectDatabasePayload) {
  const formData = new FormData();
  formData.append('type', payload.type);
  formData.append('database', payload.database?.trim() || payload.file?.name || 'uploaded_file');

  if (payload.file) {
    formData.append('file', payload.file);
  }

  return apiFetch('/api/connect-file', {
    method: 'POST',
    body: formData,
  });
}

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [databaseTables, setDatabaseTables] = useState<TableInfo[]>([]);

  const fetchTables = async (): Promise<void> => {
    try {
      const res = await apiFetch('/api/database-tables');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDatabaseTables(data.tables || []);
        }
      }
    } catch {
      // best effort
    }
  };

  useEffect(() => {
    const token = getDbSessionToken();
    if (!token) {
      return;
    }

    apiFetch('/api/connection-status')
      .then((r) => r.json())
      .then((data) => {
        if (data.connected && data.database) {
          setIsConnected(true);
          setDatabaseInfo({
            database: data.database,
            type: data.type || 'mysql',
            supportsQuery: Boolean(data.supports_query),
          });
        } else {
          clearDbSessionToken();
        }
      })
      .catch(() => clearDbSessionToken());
  }, []);

  const connect = async (
    data: ConnectDatabasePayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response =
        data.type === 'csv' || data.type === 'excel'
          ? await connectWithFile(data)
          : await connectWithJson(data);
      const result = await response.json();

      if (result.success && result.session_token) {
        storeDbSessionToken(result.session_token);
        setIsConnected(true);
        setDatabaseInfo({
          database: result.database,
          type: result.type || data.type,
          supportsQuery: Boolean(result.supports_query),
        });
        await fetchTables();
        return { success: true };
      }

      return { success: false, error: result.error || 'Connection failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Connection failed' };
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      await apiFetch('/api/disconnect', { method: 'POST' });
    } catch {
      // best effort
    }

    clearDbSessionToken();
    setIsConnected(false);
    setDatabaseInfo(null);
    setDatabaseTables([]);
  };

  return (
    <DatabaseContext.Provider
      value={{ isConnected, databaseInfo, databaseTables, connect, disconnect, fetchTables }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
