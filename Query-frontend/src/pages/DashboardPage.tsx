// src/pages/DashboardPage.tsx
import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useChatSession } from '@/hooks/useChatSession';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Sidebar from '@/components/dashboard/Sidebar';
import ChatInput from '@/components/dashboard/ChatInput';
import { apiFetch } from '@/services/apiClient';

const ChatWindow = lazy(() => import('@/components/dashboard/ChatWindow'));
const UserProfile = lazy(() => import('@/components/dashboard/UserProfile'));
const DatabaseConnectionModal = lazy(() =>
  import('@/components/dashboard/DatabaseConnectionModal').then((m) => ({
    default: m.DatabaseConnectionModal,
  }))
);
const ChatWindowSkeleton = lazy(() =>
  import('@/components/dashboard/ChatWindow').then((m) => ({
    default: m.ChatWindowSkeleton,
  }))
);

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

  // Guard: never proceed without a real user id
  const userId = user?.id;
  React.useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  const {
    isConnected,
    databaseInfo,
    databaseTables,
    connect,
    disconnect,
    fetchTables,
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

  const refreshFavorites = () => setFavoritesRefreshTrigger((prev) => prev + 1);

  const handleConnect = async (data: DatabaseConnectionData) => {
    const result = await connect(data);
    if (!result.success) {
      throw new Error(result.error || 'Failed to connect to database');
    }
    setIsModalOpen(false);
    await createNewChat();
    toast({ title: '✅ Connected!', description: `Connected to ${data.database} successfully.` });
  };

  const handleNewChat = async () => {
    if (!isConnected) {
      toast({ title: 'Database not connected', description: 'Please connect to a database first.', variant: 'destructive' });
      return;
    }
    try {
      await createNewChat();
      toast({ title: 'New Chat Started', description: 'Ask a question to begin.' });
    } catch {
      toast({ title: 'Error creating new chat', description: 'Could not create new chat session.', variant: 'destructive' });
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    try {
      await deleteChat(chatId);
      toast({ title: 'Chat Deleted', description: 'Chat session has been deleted.' });
    } catch {
      toast({ title: 'Error deleting chat', description: 'Could not delete chat session.', variant: 'destructive' });
    }
  };

  // Write SQL execution is disabled until the backend implements
  // server-side pending-action IDs with proper audit logging.
  const handleConfirmSql = async (_sql: string) => {
    setMessages((prev: any[]) => [
      ...prev,
      {
        role: 'assistant',
        type: 'assistant',
        content: '⚠️ Write operations are temporarily disabled for security reasons.',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleCancelSql = () => {
    setMessages((prev: any[]) => [
      ...prev,
      {
        role: 'assistant',
        type: 'assistant',
        content: '❌ SQL execution cancelled by user.',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleDeleteConnection = async () => {
    try {
      await disconnect();
      toast({ title: 'Database Disconnected', description: 'Successfully disconnected from the database.' });
    } catch {
      toast({ title: 'Error disconnecting', description: 'Could not disconnect.', variant: 'destructive' });
    }
  };

  if (!userId) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isConnected={isConnected}
          connectedDatabase={databaseInfo?.database || null}
          onOpenModal={() => setIsModalOpen(true)}
          onNewChat={handleNewChat}
          onDeleteConnection={handleDeleteConnection}
          chatSessions={chatSessions}
          currentChatId={currentChatId}
          onChatSelect={selectChat}
          onDeleteChat={handleDeleteChat}
          userId={userId}
          onOpenSettings={() => setIsSettingsOpen(true)}
          favoritesRefreshTrigger={favoritesRefreshTrigger}
        />

        <div className="flex-1 flex flex-col relative">
          <Suspense fallback={<ChatWindowSkeleton />}>
            <ChatWindow
              messages={messages.map((msg, idx) => ({
                ...msg,
                id: (msg as any).id ?? String(idx),
                type: (msg as any).type ?? (msg.role === 'user' ? 'user' : 'assistant'),
                timestamp: (msg as any).timestamp ?? new Date().toISOString(),
              }))}
              onConnectDatabase={() => setIsModalOpen(true)}
              onConfirmSql={handleConfirmSql}
              onCancelSql={handleCancelSql}
              userId={userId}
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
