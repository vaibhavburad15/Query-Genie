import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useChatSession } from '@/hooks/useChatSession';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Sidebar from '@/components/dashboard/Sidebar';
import ChatInput from '@/components/dashboard/ChatInput';
import TipNotification from '@/components/dashboard/TipNotification';

// ✅ Lazy load heavy components
const ChatWindow = lazy(() => import('@/components/dashboard/ChatWindow'));
const UserProfile = lazy(() => import('@/components/dashboard/UserProfile'));
const DatabaseConnectionModal = lazy(() => import('@/components/dashboard/DatabaseConnectionModal').then(module => ({ default: module.DatabaseConnectionModal })));

// Import ChatWindowSkeleton for loading states
const ChatWindowSkeleton = lazy(() => import('@/components/dashboard/ChatWindow').then(module => ({ default: module.ChatWindowSkeleton })));

// Import types
type DatabaseConnectionData = {
  type: string;
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};

const DashboardPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    chatSessions,
    currentChatId,
    messages,
    createNewChat,
    selectChat,
    deleteChat,
    deleteAllChats,
    setMessages,
    renameCurrentChat,
  } = useChatSession();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectedDatabase, setConnectedDatabase] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [databaseTables, setDatabaseTables] = React.useState<Array<{ name: string; rowCount: number; lastUpdated: string }>>([]);
  
  const [showTip, setShowTip] = useState(false);
  const [currentTip, setCurrentTip] = useState<any>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [favoritesRefreshTrigger, setFavoritesRefreshTrigger] = useState(0);

  // Load daily tip on mount
  useEffect(() => {
    const loadDailyTip = async () => {
      try {
        const response = await fetch('https://query-genie-h0cy.onrender.com/api/tips/daily');
        const tip = await response.json();
        setCurrentTip(tip);
        setShowTip(true);
        setTimeout(() => setShowTip(false), 10000);
      } catch (error) {
        console.error('Failed to load tip:', error);
      }
    };
    loadDailyTip();
  }, []);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`https://query-genie-h0cy.onrender.com/api/settings/${user.id}`);
        const settings = await response.json();
        setUserSettings(settings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, [user?.id]);

  const refreshFavorites = () => {
    setFavoritesRefreshTrigger(prev => prev + 1);
  };

  const fetchDatabaseTables = async () => {
    try {
      console.log('🔍 Fetching database tables from new endpoint...');
      
      const response = await fetch('https://query-genie-h0cy.onrender.com/api/database-tables');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      
      const data = await response.json();
      
      if (data.success && data.tables) {
        console.log(`✅ Successfully fetched ${data.total} tables:`, data.tables);
        setDatabaseTables(data.tables);
        
        toast({
          title: "✅ Tables Loaded",
          description: `Found ${data.total} table${data.total !== 1 ? 's' : ''} in the database`,
        });
      } else {
        console.warn('⚠️ No tables found or empty response');
        setDatabaseTables([]);
      }
    } catch (error) {
      console.error('❌ Error fetching tables:', error);
      toast({
        title: "Warning",
        description: "Could not fetch table information. Connection is active but table list unavailable.",
        variant: "default",
      });
      setDatabaseTables([]);
    }
  };

  const handleConnect = async (data: DatabaseConnectionData) => {
    console.log('✅ Connection successful:', data);
    setIsConnected(true);
    setConnectedDatabase(data.database);
    
    await fetchDatabaseTables();
    
    setIsModalOpen(false);
    await createNewChat();
    
    toast({
      title: "✅ Connected!",
      description: `Connected to ${data.database} successfully.`,
    });
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleNewChat = async () => {
    if (!isConnected) {
      toast({
        title: "Database not connected",
        description: "Please connect to a database first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createNewChat();
      toast({
        title: "New Chat Started",
        description: "Ask a question to begin.",
      });
    } catch (error) {
      toast({
        title: "Error creating new chat",
        description: "Could not create new chat session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChatSelect = (chatId: number) => {
    selectChat(chatId);
  };

  const handleDeleteChat = async (chatId: number) => {
    try {
      await deleteChat(chatId);
      toast({
        title: "Chat Deleted",
        description: "Chat session has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error deleting chat",
        description: "Could not delete chat session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmSql = async (sql: string) => {
    try {
      const response = await fetch("https://query-genie-h0cy.onrender.com/api/confirm-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.id || 1,
          confirm: true,
          sql,
        }),
      });

      const result = await response.json();

      setMessages((prev: any[]) => [
        ...prev,
        {
          role: "assistant",
          type: "assistant",
          content: result.message || "SQL executed successfully",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((prev: any[]) => [
        ...prev,
        {
          role: "assistant",
          type: "assistant",
          content: "❌ Failed to execute SQL.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleCancelSql = () => {
    setMessages((prev: any[]) => [
      ...prev,
      {
        role: "assistant",
        type: "assistant",
        content: "❌ SQL execution cancelled by user.",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleDeleteConnection = async () => {
    try {
      const response = await fetch("https://query-genie-h0cy.onrender.com/api/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsConnected(false);
        setConnectedDatabase(null);
        setDatabaseTables([]);
        toast({
          title: "Database Disconnected",
          description: "Successfully disconnected from the database.",
        });
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      toast({
        title: "Error disconnecting",
        description: "Could not disconnect from the database. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {showTip && currentTip && userSettings?.show_tips !== false && (
        <TipNotification
          tip={currentTip}
          onClose={() => setShowTip(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isConnected={isConnected}
          connectedDatabase={connectedDatabase}
          onOpenModal={handleOpenModal}
          onNewChat={handleNewChat}
          onDeleteConnection={handleDeleteConnection}
          chatSessions={chatSessions}
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onDeleteChat={handleDeleteChat}
          userId={user?.id || 1}
          onOpenSettings={() => setIsSettingsOpen(true)}
          favoritesRefreshTrigger={favoritesRefreshTrigger}
        />

        <div className="flex-1 flex flex-col relative">
          {/* Removed header navigation bar */}
          <Suspense fallback={<ChatWindowSkeleton />}>
            <ChatWindow
              messages={messages.map((msg, idx) => ({
                ...msg,
                id: (msg as any).id ?? String(idx),
                type: (msg as any).type ?? (msg.role === 'user' ? 'user' : 'assistant'),
                timestamp: (msg as any).timestamp ?? new Date().toISOString(),
              }))}
              onConnectDatabase={handleOpenModal}
              onConfirmSql={handleConfirmSql}
              onCancelSql={handleCancelSql}
              userId={user?.id || 1}
              currentQuestion={messages.length > 0 ? messages[messages.length - 1]?.content : ''}
              refreshFavorites={refreshFavorites}
              onFavoriteToggle={refreshFavorites}
              isConnected={isConnected}
              connectedDatabase={connectedDatabase || ''}
              databaseTables={databaseTables}
            />
          </Suspense>

          <ChatInput
            chatHistory={messages}
            setChatHistory={setMessages}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            isConnected={isConnected}
            chatSessions={chatSessions}
            currentChatId={currentChatId}
            renameCurrentChat={renameCurrentChat}
          />
        </div>
      </div>

      <Suspense fallback={<LoadingSpinner size="md" />}>
        <DatabaseConnectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConnect={handleConnect}
        />
      </Suspense>
    </div>
  );
};

export default DashboardPage;