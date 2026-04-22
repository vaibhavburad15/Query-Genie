// src/contexts/DatabaseContext.tsx
// ─────────────────────────────────────────────────────────────
// Stores the per-user DB session token returned by /api/connect
// and makes it available to the whole app via context.
// The token is also persisted in sessionStorage so it survives
// a page refresh (but is cleared on tab close / logout).
// ─────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch, storeDbSessionToken, getDbSessionToken, clearDbSessionToken } from '@/services/apiClient';

interface DatabaseInfo {
  database: string;
}

interface TableInfo {
  name: string;
  rowCount: number;
  lastUpdated: string;
}

interface DatabaseContextType {
  isConnected: boolean;
  databaseInfo: DatabaseInfo | null;
  databaseTables: TableInfo[];
  connect: (data: {
    host: string;
    port: string;
    user: string;
    password: string;
    database: string;
    type?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<void>;
  fetchTables: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
};

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [databaseTables, setDatabaseTables] = useState<TableInfo[]>([]);

  const fetchTables = async (): Promise<void> => {
    try {
      const res = await apiFetch('/api/database-tables');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setDatabaseTables(data.tables || []);
      }
    } catch {
      // silently ignore
    }
  };

  // On mount, check if we already have a valid session token
  useEffect(() => {
    const token = getDbSessionToken();
    if (token) {
      // Validate the existing session against the backend
      apiFetch('/api/connection-status')
        .then((r) => r.json())
        .then((data) => {
          if (data.connected && data.database) {
            setIsConnected(true);
            setDatabaseInfo({ database: data.database });
            void fetchTables();
          } else {
            // Token is stale, clear it
            clearDbSessionToken();
          }
        })
        .catch(() => clearDbSessionToken());
    }
  }, []);

  const connect = async (data: {
    host: string;
    port: string;
    user: string;
    password: string;
    database: string;
    type?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiFetch('/api/connect', {
        method: 'POST',
        body: JSON.stringify({
          host: data.host,
          port: parseInt(data.port, 10),
          user: data.user,
          password: data.password,
          database: data.database,
        }),
      });
      const result = await res.json();

      if (result.success && result.session_token) {
        // Store token so apiFetch auto-injects it from now on
        storeDbSessionToken(result.session_token);
        setIsConnected(true);
        setDatabaseInfo({ database: result.database });
        // Eagerly load tables
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
      // best-effort
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
