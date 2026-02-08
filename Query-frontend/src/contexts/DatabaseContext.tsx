import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface DatabaseConnectionData {
  type: string;
  host: string;
  port: string;
  user: string;
  password?: string; // Optional, never stored
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

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseConnectionData | null>(null);
  const [databaseTables, setDatabaseTables] = useState<Array<{ name: string; rowCount: number; lastUpdated: string }>>([]);

  // ✅ Restore connection from localStorage on mount
  useEffect(() => {
    const storedConnection = localStorage.getItem('dbConnection');
    if (storedConnection) {
      try {
        const parsedConnection = JSON.parse(storedConnection);
        console.log('🔄 Restoring database connection from localStorage:', parsedConnection.database);
        setDatabaseInfo(parsedConnection);
        setIsConnected(true);
        
        // Fetch tables after restoring connection
        fetchTablesFromBackend();
      } catch (error) {
        console.error('Error restoring database connection:', error);
        localStorage.removeItem('dbConnection');
      }
    }
  }, []);

  const fetchTablesFromBackend = async () => {
    try {
      console.log('📊 Fetching database tables from backend...');
      
      const response = await fetch('http://localhost:8000/api/database-tables');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      
      const data = await response.json();
      
      if (data.success && data.tables) {
        console.log(`✅ Successfully fetched ${data.total} tables:`, data.tables);
        setDatabaseTables(data.tables);
      } else {
        console.warn('⚠️ No tables found or empty response');
        setDatabaseTables([]);
      }
    } catch (error) {
      console.error('❌ Error fetching tables:', error);
      setDatabaseTables([]);
    }
  };

  const connect = useCallback(async (data: DatabaseConnectionData) => {
    console.log('🔗 Connecting to database:', data.database);
    setDatabaseInfo(data);
    setIsConnected(true);

    // ✅ Store connection info WITHOUT password
    localStorage.setItem('dbConnection', JSON.stringify({
      host: data.host,
      port: data.port,
      user: data.user,
      database: data.database,
      type: data.type
      // PASSWORD NOT STORED!
    }));

    // Fetch tables after connecting
    await fetchTablesFromBackend();
  }, []);

  const disconnect = useCallback(async () => {
    console.log('🔌 Disconnecting from database');
    
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('http://localhost:8000/api/disconnect', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
    }

    setIsConnected(false);
    setDatabaseInfo(null);
    setDatabaseTables([]);
    localStorage.removeItem('dbConnection');
  }, []);

  const fetchTables = useCallback(async () => {
    await fetchTablesFromBackend();
  }, []);

  return (
    <DatabaseContext.Provider value={{ 
      isConnected, 
      databaseInfo, 
      databaseTables,
      connect, 
      disconnect,
      fetchTables,
      setDatabaseTables
    }}>
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