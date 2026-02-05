// src/components/ChatInput.tsx

import React, { useState, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Send, Loader2 } from 'lucide-react';
import { ChatRequestPayload } from '@/services/api';
import { useSendChatMessage } from '@/hooks/useQueryCache';
import { useQueryTemplates } from '@/hooks/useQueryTemplates';

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
  chatSessions, 
  currentChatId, 
  renameCurrentChat 
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const sendChatMutation = useSendChatMessage();
  const { templates } = useQueryTemplates();

  // ✅ Memoized callbacks
  const handleSetChatHistory = useCallback(setChatHistory, [setChatHistory]);
  const handleSetIsLoading = useCallback(setIsLoading, [setIsLoading]);
  const handleRenameCurrentChat = useCallback(renameCurrentChat, [renameCurrentChat]);

  const handleSubmit = async () => {
    if (!message.trim() || isLoading || !isConnected) return;

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
        const aiMessage: ChatMessage = { role: 'ai', content: data.response };
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
      {isConnected && (
        <div className="max-w-4xl mx-auto mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {templates.slice(0, 4).map((template) => (
              <button
                key={template.question}
                onClick={() => setMessage(template.question)}
                className="p-3 text-left border rounded hover:bg-muted"
              >
                <span>{template.icon}</span>
                <p className="font-medium">{template.title}</p>
                <p className="text-sm text-muted-foreground">{template.question}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="max-w-4xl mx-auto">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Ask me anything about your data..." : "Please connect to a database first"}
            className="w-full min-h-[3rem] max-h-32 resize-none p-3 pr-24 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            disabled={isLoading || !isConnected}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isLoading || !isConnected}
            >
              <Plus size={18} />
            </Button>
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 bg-blue-600 hover:bg-blue-700"
              disabled={!message.trim() || isLoading || !isConnected}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}, (prevProps, nextProps) => {
  // ✅ Custom comparison - only re-render if critical props changed
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.currentChatId === nextProps.currentChatId &&
    prevProps.chatSessions === nextProps.chatSessions
  );
});

export default ChatInput;