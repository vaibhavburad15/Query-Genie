import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useChatSession } from '@/hooks/useChatSession';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Sidebar from '@/components/dashboard/Sidebar';
import ChatInput from '@/components/dashboard/ChatInput';

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
  
  // ✅ Use DatabaseContext instead of local state
  const { 
    isConnected, 
    databaseInfo, 
    databaseTables,
    connect, 
    disconnect,
    fetchTables 
  } = useDatabase();

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
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  
  const [favoritesRefreshTrigger, setFavoritesRefreshTrigger] = React.useState(0);

  const refreshFavorites = () => {
    setFavoritesRefreshTrigger(prev => prev + 1);
  };

  const handleConnect = async (data: DatabaseConnectionData) => {
    console.log('✅ Connection successful:', data);
    
    // ✅ Use DatabaseContext connect method
    await connect(data);
    
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
      const response = await fetch("http://localhost:8000/api/confirm-sql", {
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
      // ✅ Use DatabaseContext disconnect method
      await disconnect();
      
      toast({
        title: "Database Disconnected",
        description: "Successfully disconnected from the database.",
      });
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
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isConnected={isConnected}
          connectedDatabase={databaseInfo?.database || null}
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
              connectedDatabase={databaseInfo?.database || ''}
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
