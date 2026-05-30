// src/components/ChatInput.tsx - Enhanced with AJAX & RIA features

import React, { useState, memo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Send, Loader2, Mic, MicOff, Sparkles } from 'lucide-react';
import { ChatRequestPayload } from '@/services/api';
import { useSendChatMessage } from '@/hooks/useQueryCache';
import { useQueryTemplates } from '@/hooks/useQueryTemplates';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { showWarningToast } from '@/components/ui/toast-notification';

// Define the shape of a chat message
export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

// Define the props that the parent component must provide
interface ChatInputProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isConnected: boolean;
  queryEnabled: boolean;
  chatSessions: any[];
  currentChatId: number | null;
  renameCurrentChat: (title: string) => void;
}

const ChatInput = memo(({
  chatHistory, 
  setChatHistory, 
  isLoading, 
  setIsLoading, 
  isConnected, 
  queryEnabled,
  chatSessions, 
  currentChatId, 
  renameCurrentChat 
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendChatMutation = useSendChatMessage();
  const { templates } = useQueryTemplates();
  const { isOnline } = useOnlineStatus();
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // ✅ Memoized callbacks
  const handleSetChatHistory = useCallback(setChatHistory, [setChatHistory]);
  const handleSetIsLoading = useCallback(setIsLoading, [setIsLoading]);
  const handleRenameCurrentChat = useCallback(renameCurrentChat, [renameCurrentChat]);

  const handleSubmit = async () => {
    if (!message.trim() || isLoading || !isConnected || !queryEnabled) return;

    // Check online status
    if (!isOnline) {
      showWarningToast({
        title: 'No internet connection',
        description: 'Please check your connection and try again.',
      });
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: message };

    // Rename chat if it's a new chat (title is "New Chat")
    const currentChat = chatSessions.find(chat => chat.id === currentChatId);
    if (currentChat && currentChat.title === "New Chat") {
      const title = message.length > 40 ? message.slice(0, 40) + "..." : message;
      await handleRenameCurrentChat(title);
    }

    // Add user message to chat history
    handleSetChatHistory(prev => [...prev, userMessage]);

    handleSetIsLoading(true);
    setMessage('');

    try {
      // ✅ FIXED: Send chat history with proper format
      // Only send role and content, no extra fields
      const payload: ChatRequestPayload = {
        question: message,
        chat_history: chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
      };

      console.log('Sending payload to backend:', payload);

      const data = await sendChatMutation.mutateAsync(payload);

      console.log('Backend response:', data);

      if (data.success && data.response) {
        const responseContent =
          typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
        const aiMessage: ChatMessage = { role: 'ai', content: responseContent };
        handleSetChatHistory(prevHistory => [...prevHistory, aiMessage]);
      } else {
        const errorMessage: ChatMessage = { 
          role: 'ai', 
          content: `Error: ${data.error || 'Unknown error occurred'}` 
        };
        handleSetChatHistory(prevHistory => [...prevHistory, errorMessage]);
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      
      let errorText = 'Sorry, an unexpected error occurred.';
      
      if (error instanceof Error) {
        errorText = `Error: ${error.message}`;
      }
      
      const errorMessage: ChatMessage = { role: 'ai', content: errorText };
      handleSetChatHistory(prevHistory => [...prevHistory, errorMessage]);
    } finally {
      handleSetIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey) {
      // allow new line
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      // prevent new line and submit the form
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-transparent p-4">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="max-w-4xl mx-auto mb-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-sm">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>You're offline. Reconnect to send messages.</span>
        </div>
      )}

      {isConnected && queryEnabled && (
        <div className="max-w-4xl mx-auto mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {templates.slice(0, 4).map((template) => (
              <button
                key={template.question}
                onClick={() => {
                  setMessage(template.question);
                  textareaRef.current?.focus();
                }}
                className="group p-3 text-left border rounded-lg hover:bg-muted hover:border-blue-300 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg group-hover:scale-110 transition-transform">{template.icon}</span>
                  <Sparkles className="h-3 w-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-medium text-sm">{template.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{template.question}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="max-w-4xl mx-auto">
        <div className={`relative transition-all duration-200 ${
          isFocused ? 'ring-2 ring-blue-500 rounded-lg' : ''
        }`}>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setCharCount(e.target.value.length);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              !isConnected
                ? 'Please connect to a database first'
                : queryEnabled
                  ? 'Ask me anything about your data...'
                  : 'This source supports connection metadata only right now'
            }
            className="w-full min-h-[3rem] max-h-32 resize-none p-3 pr-32 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none text-white placeholder:text-gray-400 transition-all"
            disabled={isLoading || !isConnected || !queryEnabled}
            aria-label="Chat input"
            aria-describedby="chat-input-help"
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {/* Voice input button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-8 w-8 transition-colors ${
                isRecording ? 'text-red-500 animate-pulse' : ''
              }`}
              disabled={isLoading || !isConnected || !queryEnabled}
              title="Voice input (coming soon)"
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isLoading || !isConnected || !queryEnabled}
              title="Attach file"
            >
              <Plus size={18} />
            </Button>
            
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!message.trim() || isLoading || !isConnected || !queryEnabled}
              title="Send message (Ctrl+Enter)"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2 px-1">
          
          {charCount > 0 && (
            <span className={`text-xs ${
              charCount > 1000 ? 'text-amber-400' : 'text-gray-400'
            }`}>
              {charCount} / 2000
            </span>
          )}
        </div>
      </form>
    </div>
  );
}, (prevProps, nextProps) => {
  // ✅ Custom comparison - only re-render if critical props changed
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.queryEnabled === nextProps.queryEnabled &&
    prevProps.currentChatId === nextProps.currentChatId &&
    prevProps.chatSessions === nextProps.chatSessions
  );
});

export default ChatInput;
