import { Menu, Database, Plus, MessageSquare, MoreVertical, RefreshCw, LogOut, Trash2 } from 'lucide-react';
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
  onOpenModal: () => void;
  onNewChat: () => void;
  onDeleteConnection: () => void;
  chatSessions: ChatSession[];
  currentChatId: number | null;
  onChatSelect: (chatId: number) => void;
  onDeleteChat: (chatId: number) => void;
}

const Sidebar = ({ 
  isCollapsed, 
  onToggleCollapse, 
  isConnected, 
  connectedDatabase, 
  onOpenModal, 
  onNewChat, 
  onDeleteConnection, 
  chatSessions, 
  currentChatId, 
  onChatSelect, 
  onDeleteChat 
}: SidebarProps) => {

  return (
    <div className={`relative h-full bg-surface-elevated border-r border-border transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-end p-4 border-b border-border">
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
              {/* Connection Status with Actions */}
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`}></div>
                    <span className="text-xs text-muted-foreground truncate">
                      {isConnected ? connectedDatabase : 'No Connection'}
                    </span>
                  </div>
                </div>

                {/* Connection Actions */}
                {isConnected ? (
                  <div className="flex gap-2 mt-2">
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
                          <p>Connect to a different database</p>
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
                          <p>Disconnect from database</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : (
                  <Button onClick={onOpenModal} size="sm" className="w-full h-8 text-xs mt-2">
                    <Database size={14} className="mr-2" />
                    Connect Database
                  </Button>
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
                      >
                        <Plus size={14} className="mr-2" />
                        New Chat
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Start a new chat</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

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
                      <p className="text-xs text-muted-foreground mt-1">Start a new chat to begin</p>
                    </div>
                  ) : (
                    chatSessions.map((chat) => (
                      <div
                        key={chat.id}
                        className={`group relative rounded-lg transition-all duration-200 hover:bg-muted px-2 py-2 ${
                          currentChatId === chat.id ? 'bg-brand-50 border-l-2 border-brand-500' : ''
                        }`}
                      >
                        <button
                          onClick={() => onChatSelect(chat.id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start gap-2">
                            {/* Left side - Icon column with menu below */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              <MessageSquare
                                size={14}
                                className={`${
                                  currentChatId === chat.id ? 'text-brand-600' : 'text-muted-foreground'
                                }`}
                              />
                              
                              {/* Three-dot menu below the chat icon */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <button
                                    className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                                  >
                                    <MoreVertical size={12} className="text-gray-600" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
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

                            {/* Right side - Chat title and timestamp */}
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
                          </div>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Collapsed State - Show Icons Only */}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-4 p-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenModal}
                      className="w-10 h-10 p-0"
                    >
                      <Database size={18} className={isConnected ? 'text-success' : 'text-muted-foreground'} />
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
                    >
                      <Plus size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>New Chat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;