import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useChatSession } from '@/hooks/useChatSession';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectDatabasePayload, useDatabase } from '@/contexts/DatabaseContext';
import { cancelSql, confirmSql } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Sidebar from '@/components/dashboard/Sidebar';
import ChatInput from '@/components/dashboard/ChatInput';

const ChatWindow = lazy(() => import('@/components/dashboard/ChatWindow'));
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

const DashboardPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const userId = user?.id;
  React.useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  const { isConnected, databaseInfo, databaseTables, connect, disconnect } = useDatabase();

  const {
    chatSessions,
    currentChatId,
    messages,
    createNewChat,
    selectChat,
    deleteChat,
    setMessages,
    renameCurrentChat,
  } = useChatSession();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [favoritesRefreshTrigger, setFavoritesRefreshTrigger] = React.useState(0);

  const refreshFavorites = () => setFavoritesRefreshTrigger((prev) => prev + 1);

  const handleConnect = async (data: ConnectDatabasePayload) => {
    const result = await connect(data);
    if (!result.success) {
      throw new Error(result.error || 'Failed to connect to database');
    }

    setIsModalOpen(false);
    await createNewChat();
    toast({
      title: 'Connected',
      description: `Connected to ${data.database || data.file?.name || 'your source'} successfully.`,
    });
  };

  const handleNewChat = async () => {
    if (!isConnected) {
      toast({
        title: 'Database not connected',
        description: 'Please connect to a database first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createNewChat();
      toast({ title: 'New Chat Started', description: 'Ask a question to begin.' });
    } catch {
      toast({
        title: 'Error creating new chat',
        description: 'Could not create new chat session.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    try {
      await deleteChat(chatId);
      toast({ title: 'Chat Deleted', description: 'Chat session has been deleted.' });
    } catch {
      toast({
        title: 'Error deleting chat',
        description: 'Could not delete chat session.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmSql = async (pendingId: string) => {
    try {
      const data = await confirmSql(pendingId);
      if (!data.success || !data.response) {
        throw new Error(data.error || data.message || 'Failed to execute the confirmed SQL.');
      }

      setMessages((prev: any[]) => [
        ...prev,
        {
          role: 'ai',
          type: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        },
      ]);

      toast({
        title: 'Operation confirmed',
        description: 'The SQL operation completed successfully.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute the confirmed SQL.';
      setMessages((prev: any[]) => [
        ...prev,
        {
          role: 'ai',
          type: 'assistant',
          content: `Error: ${message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      toast({
        title: 'Operation failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleCancelSql = async (pendingId: string) => {
    try {
      const data = await cancelSql(pendingId);
      setMessages((prev: any[]) => [
        ...prev,
        {
          role: 'ai',
          type: 'assistant',
          content: data.message || 'Operation cancelled. No changes were made to the database.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel the pending SQL operation.';
      setMessages((prev: any[]) => [
        ...prev,
        {
          role: 'ai',
          type: 'assistant',
          content: `Error: ${message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      toast({
        title: 'Cancel failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConnection = async () => {
    try {
      await disconnect();
      toast({
        title: 'Database Disconnected',
        description: 'Successfully disconnected from the database.',
      });
    } catch {
      toast({
        title: 'Error disconnecting',
        description: 'Could not disconnect.',
        variant: 'destructive',
      });
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isConnected={isConnected}
          connectedDatabase={databaseInfo?.database || null}
          databaseType={databaseInfo?.type || null}
          onOpenModal={() => setIsModalOpen(true)}
          onNewChat={handleNewChat}
          onDeleteConnection={handleDeleteConnection}
          chatSessions={chatSessions}
          currentChatId={currentChatId}
          onChatSelect={selectChat}
          onDeleteChat={handleDeleteChat}
          userId={userId}
          onOpenSettings={() => undefined}
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
              databaseType={databaseInfo?.type || ''}
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
            queryEnabled={databaseInfo?.supportsQuery ?? false}
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
