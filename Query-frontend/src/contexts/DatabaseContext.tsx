
import React, { createContext, useContext, useState, useCallback } from 'react';
import { DatabaseConnectionData } from '@/components/DatabaseConnectionModal';

interface DatabaseContextType {
  isConnected: boolean;
  databaseInfo: DatabaseConnectionData | null;
  connect: (data: DatabaseConnectionData) => void;
  disconnect: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseConnectionData | null>(null);

  const connect = useCallback((data: DatabaseConnectionData) => {
    console.log('🔗 Connecting to database:', data.database);
    setDatabaseInfo(data);
    setIsConnected(true);

    // ✅ FIX: NEVER store password in localStorage
    localStorage.setItem('dbConnection', JSON.stringify({
      host: data.host,
      port: data.port,
      user: data.user,
      database: data.database,
      type: data.type
      // PASSWORD REMOVED!
    }));
  }, []);

  const disconnect = useCallback(async () => {
    console.log('🔌 Disconnecting from database');
    
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('http://localhost:8000/api/disconnect', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ✅ Add auth token
        }
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
    }

    setIsConnected(false);
    setDatabaseInfo(null);
    localStorage.removeItem('dbConnection');
  }, []);

  return (
    <DatabaseContext.Provider value={{ isConnected, databaseInfo, connect, disconnect }}>
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