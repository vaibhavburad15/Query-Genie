import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface DatabaseConnectionData {
  type: string;
  host: string;
  port: string;
  user: string;
  password?: string;
  database: string;
}

interface DatabaseContextType {
  isConnected: boolean;
  databaseInfo: DatabaseConnectionData | null;
  databaseTables: Array<{ name: string; rowCount: number; lastUpdated: string }>;
  connect: (data: DatabaseConnectionData) => Promise<void>;
  disconnect: () => Promise<void>;
  fetchTables: () => Promise<void>;
  setDatabaseTables: React.Dispatch<React.SetStateAction<Array<{ name: string; rowCount: number; lastUpdated: string }>>>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseConnectionData | null>(null);
  const [databaseTables, setDatabaseTables] = useState<Array<{ name: string; rowCount: number; lastUpdated: string }>>([]);

  const clearConnectionState = useCallback(() => {
    setIsConnected(false);
    setDatabaseInfo(null);
    setDatabaseTables([]);
    localStorage.removeItem('dbConnection');
  }, []);

  const fetchTablesFromBackend = useCallback(async () => {
    try {
      console.log('Fetching database tables from backend...');

      const response = await fetch(`${API_BASE}/api/database-tables`);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 400 && data?.detail === 'Database not connected') {
          console.warn('Stored database session is stale. Clearing frontend connection state.');
          clearConnectionState();
          return;
        }

        throw new Error(data?.detail || 'Failed to fetch tables');
      }

      if (data?.success && data.tables) {
        console.log(`Successfully fetched ${data.total} tables.`, data.tables);
        setDatabaseTables(data.tables);
      } else {
        console.warn('No tables found or empty response.');
        setDatabaseTables([]);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setDatabaseTables([]);
    }
  }, [clearConnectionState]);

  useEffect(() => {
    const restoreConnection = async () => {
      const storedConnection = localStorage.getItem('dbConnection');
      if (!storedConnection) {
        return;
      }

      try {
        const parsedConnection = JSON.parse(storedConnection) as DatabaseConnectionData;
        console.log('Checking backend connection status for stored database:', parsedConnection.database);

        const response = await fetch(`${API_BASE}/api/connection-status`);
        if (!response.ok) {
          throw new Error('Failed to verify backend connection status');
        }

        const status = await response.json();
        const isSameDatabase = !status.database || status.database === parsedConnection.database;

        if (status.connected && isSameDatabase) {
          setDatabaseInfo(parsedConnection);
          setIsConnected(true);
          await fetchTablesFromBackend();
          return;
        }

        console.warn('Backend is not connected to the stored database. Clearing stale frontend session.');
        clearConnectionState();
      } catch (error) {
        console.error('Error restoring database connection:', error);
        clearConnectionState();
      }
    };

    restoreConnection();
  }, [clearConnectionState, fetchTablesFromBackend]);

  const connect = useCallback(async (data: DatabaseConnectionData) => {
    console.log('Connecting to database:', data.database);
    setDatabaseInfo(data);
    setIsConnected(true);

    localStorage.setItem('dbConnection', JSON.stringify({
      host: data.host,
      port: data.port,
      user: data.user,
      database: data.database,
      type: data.type
    }));

    await fetchTablesFromBackend();
  }, [fetchTablesFromBackend]);

  const disconnect = useCallback(async () => {
    console.log('Disconnecting from database');

    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_BASE}/api/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
    }

    clearConnectionState();
  }, [clearConnectionState]);

  const fetchTables = useCallback(async () => {
    await fetchTablesFromBackend();
  }, [fetchTablesFromBackend]);

  return (
    <DatabaseContext.Provider value={{
      isConnected,
      databaseInfo,
      databaseTables,
      connect,
      disconnect,
      fetchTables,
      setDatabaseTables
    }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};
