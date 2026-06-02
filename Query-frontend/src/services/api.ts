import { apiJson } from '@/services/apiClient';

export interface DBConfig {
  type: string;
  host: string;
  port?: number;
  user?: string;
  password?: string;
  database: string;
  path?: string;
}

export interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
}

export interface ChatRequestPayload {
  question: string;
  chat_history: ChatMessage[];
}

export interface ChatApiResponse {
  success: boolean;
  response?: string | Record<string, unknown>;
  error?: string;
}

export interface SqlActionResponse {
  success: boolean;
  response?: string;
  message?: string;
  error?: string;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  password: string;
  otp: string;
  username: string;
}

export interface LoginData {
  identifier: string;
  password: string;
}

export interface OtpRequest {
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  auth_token?: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    contactNumber?: string;
    gender: string;
  };
}

export interface OtpResponse {
  success: boolean;
  message: string;
}

export const connectToDB = async (config: DBConfig) =>
  apiJson<{ success: boolean; error?: string; session_token?: string; database?: string }>(
    '/api/connect',
    {
      method: 'POST',
      body: JSON.stringify(config),
    }
  );

export const sendChatMessage = async (payload: ChatRequestPayload) =>
  apiJson<ChatApiResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const confirmSql = async (pendingId: string) =>
  apiJson<SqlActionResponse>('/api/confirm-sql', {
    method: 'POST',
    body: JSON.stringify({ pending_id: pendingId }),
  });

export const cancelSql = async (pendingId: string) =>
  apiJson<SqlActionResponse>('/api/cancel-sql', {
    method: 'POST',
    body: JSON.stringify({ pending_id: pendingId }),
  });

export const getChatSessions = async (_userId?: number) =>
  apiJson<any[]>('/api/chat-sessions');

export const getChatSession = async (sessionId: number) =>
  apiJson<any>(`/api/chat-sessions/${sessionId}`);

export const createChatSession = async (session: {
  title: string;
  messages: ChatMessage[];
  user_id?: number;
}) =>
  apiJson<any>('/api/chat-sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });

export const deleteChatSession = async (sessionId: number, userId?: number) =>
  apiJson<{ success: boolean; message: string }>(
    `/api/chat-sessions/${sessionId}${userId ? `?user_id=${userId}` : ''}`,
    { method: 'DELETE' }
  );

export const updateChatSession = async (
  sessionId: number,
  updatedSession: {
    title?: string;
    messages?: any[];
    user_id?: number;
  }
) =>
  apiJson<any>(`/api/chat-sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedSession),
  });

export const deleteAllChatSessions = async (_userId?: number) =>
  apiJson<{ success: boolean; message: string }>('/api/chat-sessions/delete-all', {
    method: 'DELETE',
  });

export const sendOtp = async (request: OtpRequest): Promise<OtpResponse> =>
  apiJson<OtpResponse>('/api/send-otp', {
    method: 'POST',
    body: JSON.stringify(request),
  });

export const signup = async (userData: SignupData): Promise<AuthResponse> =>
  apiJson<AuthResponse>('/api/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const login = async (credentials: LoginData): Promise<AuthResponse> =>
  apiJson<AuthResponse>('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const logout = async (): Promise<{ success: boolean; message: string }> =>
  apiJson<{ success: boolean; message: string }>('/api/logout', {
    method: 'POST',
  });

export const getUserProfile = async (userId: number): Promise<AuthResponse> =>
  apiJson<AuthResponse>(`/api/profile/${userId}`);
