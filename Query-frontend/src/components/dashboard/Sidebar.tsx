import { Menu, Database, Plus, MessageSquare, MoreVertical, RefreshCw, LogOut, Trash2, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FavoritesPanel from './FavoritesPanel';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface ChatSession {
  id: number;
  title: string;
  timestamp: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isConnected: boolean;
  connectedDatabase: string | null;
  databaseType: string | null;
  onOpenModal: () => void;
  onNewChat: () => void;
  onDeleteConnection: () => void;
  chatSessions: ChatSession[];
  currentChatId: number | null;
  onChatSelect: (chatId: number) => void;
  onDeleteChat: (chatId: number) => void;
  userId: number;
  onOpenSettings: () => void;
  favoritesRefreshTrigger?: number;
}

const Sidebar = memo(({
  isCollapsed, 
  onToggleCollapse, 
  isConnected, 
  connectedDatabase, 
  databaseType,
  onOpenModal, 
  onNewChat, 
  onDeleteConnection, 
  chatSessions, 
  currentChatId, 
  onChatSelect, 
  onDeleteChat,
  userId,
  onOpenSettings,
  favoritesRefreshTrigger
}: SidebarProps) => {

  const navigate = useNavigate();

  const handleSelectFavorite = (question: string) => {
    console.log('Selected favorite:', question);
  };

  return (
    <div className={`relative h-full bg-surface-elevated border-r border-border transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2 hover:bg-muted"
          >
            <Menu size={18} />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!isCollapsed && (
            <>
              {/* Enhanced Connection Status */}
              <div className="p-3 border-b border-border">
                {isConnected ? (
                  <div className="space-y-3">
                    <div className="rounded-md border border-border bg-background/70 px-3 py-2">
                      <div className="flex items-start gap-2">
                        <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">
                            {connectedDatabase || 'Connected source'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {databaseType || 'Database source'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Connection Actions */}
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={onOpenModal}
                              className="flex-1 h-8 text-xs"
                            >
                              <RefreshCw size={12} className="mr-1.5" />
                              Switch Database 
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Switch to another database</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={onDeleteConnection}
                              className="h-8 px-2 text-destructive hover:bg-destructive hover:text-white"
                            >
                              <LogOut size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Disconnect</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-xs">Not Connected</span>
                    </div>
                    <Button onClick={onOpenModal} size="sm" className="w-full h-8 text-xs">
                      <Database size={14} className="mr-2" />
                      Connect Database
                    </Button>
                  </div>
                )}
              </div>

              {/* New Chat Button */}
              <div className="p-3 border-b border-border">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onNewChat}
                        className="w-full h-8 text-xs hover:bg-muted"
                        disabled={!isConnected}
                      >
                        <Plus size={14} className="mr-2" />
                        New Chat
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isConnected ? 'Start a new chat' : 'Connect to database first'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              

              {/* Favorites Panel */}
              <FavoritesPanel
                userId={userId}
                onSelectFavorite={handleSelectFavorite}
                refreshTrigger={favoritesRefreshTrigger}
              />



              {/* Chat History */}
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="text-xs font-medium text-muted-foreground">Chat History</h3>
              </div>

              <ScrollArea className="flex-1 px-2">
                <div className="space-y-1 p-2">
                  {chatSessions.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <MessageSquare size={24} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">No chat history yet</p>
                    </div>
                  ) : (
                    chatSessions.map((chat) => (
                      <div
                        key={chat.id}
                        className={`group p-2 rounded-md hover:bg-muted transition-colors cursor-pointer ${
                          currentChatId === chat.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => onChatSelect(chat.id)}
                            className="flex flex-1 min-w-0 items-start gap-2 text-left"
                          >
                            <MessageSquare
                              size={14}
                              className={`mt-0.5 flex-shrink-0 ${
                                currentChatId === chat.id ? 'text-brand-600' : 'text-muted-foreground'
                              }`}
                            />

                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-xs truncate ${
                                currentChatId === chat.id ? 'text-brand-700' : 'text-foreground'
                              }`}>
                                {chat.title}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {new Date(chat.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label={`Open actions for ${chat.title}`}
                                className="rounded p-0.5 transition-colors hover:bg-gray-200"
                              >
                                <MoreVertical size={12} className="text-gray-600" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                              <DropdownMenuItem
                                onClick={() => {
                                  if (window.confirm(`Delete chat "${chat.title}"?`)) {
                                    onDeleteChat(chat.id);
                                  }
                                }}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete Chat
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* ✅ UPDATED: Custom Dashboard Button */}
              <div className="p-3 border-t border-border">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/custom-dashboard')}
                        className="w-full h-8 text-xs hover:bg-muted"
                      >
                        <BarChart3 size={14} className="mr-2" />
                        Custom Dashboard
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create and manage custom dashboards</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Footer with Settings and Theme Toggle */}
              <div className="p-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onOpenSettings}
                          className="h-8 w-8 p-0"
                        >
                          <Settings size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Settings</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <ThemeToggle />
                </div>
              </div>
            </>
          )}

          {/* Collapsed State */}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-4 p-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenSettings}
                      className="w-10 h-10 p-0"
                    >
                      <Settings size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ThemeToggle />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Toggle Theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenModal}
                      className="w-10 h-10 p-0 relative"
                    >
                      <Database size={18} className={isConnected ? 'text-green-600' : 'text-muted-foreground'} />
                      {isConnected && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{isConnected ? `Connected to ${connectedDatabase}` : 'Connect Database'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onNewChat}
                      className="w-10 h-10 p-0"
                      disabled={!isConnected}
                    >
                      <Plus size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{isConnected ? 'New Chat' : 'Connect database first'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* ✅ Custom Dashboard Icon in Collapsed State */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/custom-dashboard')}
                      className="w-10 h-10 p-0"
                    >
                      <BarChart3 size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Custom Dashboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // ✅ Custom comparison - only re-render if critical props changed
  return (
    prevProps.isCollapsed === nextProps.isCollapsed &&
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.connectedDatabase === nextProps.connectedDatabase &&
    prevProps.databaseType === nextProps.databaseType &&
    prevProps.chatSessions === nextProps.chatSessions &&
    prevProps.currentChatId === nextProps.currentChatId &&
    prevProps.userId === nextProps.userId &&
    prevProps.favoritesRefreshTrigger === nextProps.favoritesRefreshTrigger
  );
});

export default Sidebar;
