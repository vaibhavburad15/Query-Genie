// src/hooks/useQueryCache.ts - NEW FILE

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sendChatMessage,
  connectToDB,
  DBConfig,
  ChatMessage,
  ChatRequestPayload,
  ChatApiResponse,
} from '@/services/api';

// ✅ NEW: Dedicated hook for cached queries
export const useCachedChat = (question: string, chatHistory: ChatMessage[]) => {
  return useQuery({
    queryKey: ['chat', question],
    queryFn: () => sendChatMessage({ question, chat_history: chatHistory }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!question, // Only run when question exists
    retry: 3,
    retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000, // Exponential backoff
  });
};

// ✅ NEW: Mutation for sending chat messages
export const useSendChatMessage = () => {
  return useMutation<ChatApiResponse, Error, ChatRequestPayload>({
    mutationFn: sendChatMessage,
    retry: 3,
    retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000,
  });
};

export const useConnectDatabase = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; error?: string }, Error, DBConfig>({
    mutationFn: connectToDB,
    onSuccess: () => {
      // Invalidate related queries on successful connection
      queryClient.invalidateQueries({ queryKey: ['database-tables'] });
      queryClient.invalidateQueries({ queryKey: ['database-schema'] });
    },
  });
};
