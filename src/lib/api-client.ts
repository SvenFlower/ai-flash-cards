/**
 * API Client Service Layer
 *
 * Centralized service for all REST API interactions.
 * Provides type-safe methods with consistent error handling.
 *
 * @see .ai/api-plan.md
 */

import type {
  // Auth types
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  // Session types
  SessionsListResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  SessionDetailResponse,
  UpdateSessionRequest,
  UpdateSessionResponse,
  DeleteSessionResponse,
  // FlashCard types
  FlashCardsListResponse,
  CreateFlashCardRequest,
  CreateFlashCardResponse,
  FlashCardDetailResponse,
  UpdateFlashCardRequest,
  UpdateFlashCardResponse,
  DeleteFlashCardResponse,
  // Generate types
  GenerateFlashCardsRequest,
  GenerateFlashCardsResponse,
  // Error types
  APIError,
} from './api-types';

// ============================================================================
// Helper - Base fetch wrapper with error handling
// ============================================================================

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: APIError | null }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: responseData as APIError,
      };
    }

    return {
      data: responseData as T,
      error: null,
    };
  } catch (error) {
    console.error('[API Client] Request failed:', error);
    return {
      data: null,
      error: {
        error: {
          message: error instanceof Error ? error.message : 'Network request failed',
          code: 'NETWORK_ERROR',
        },
      },
    };
  }
}

// ============================================================================
// Authentication API
// ============================================================================

export const auth = {
  /**
   * Register a new user account
   */
  register: async (body: RegisterRequest) => {
    return apiFetch<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Login with email and password
   */
  login: async (body: LoginRequest) => {
    return apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Logout current user
   */
  logout: async () => {
    return apiFetch<LogoutResponse>('/api/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Get current authenticated user
   */
  me: async () => {
    return apiFetch<MeResponse>('/api/auth/me', {
      method: 'GET',
    });
  },
};

// ============================================================================
// Sessions API
// ============================================================================

export const sessions = {
  /**
   * List all sessions for current user
   */
  list: async () => {
    return apiFetch<SessionsListResponse>('/api/sessions', {
      method: 'GET',
    });
  },

  /**
   * Create a new session
   */
  create: async (body: CreateSessionRequest) => {
    return apiFetch<CreateSessionResponse>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Get session by ID with flashcards
   */
  get: async (id: string) => {
    return apiFetch<SessionDetailResponse>(`/api/sessions/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Update session name
   */
  update: async (id: string, body: UpdateSessionRequest) => {
    return apiFetch<UpdateSessionResponse>(`/api/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  /**
   * Delete session (cascades to flashcards)
   */
  delete: async (id: string) => {
    return apiFetch<DeleteSessionResponse>(`/api/sessions/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// FlashCards API
// ============================================================================

export const flashcards = {
  /**
   * List all flashcards (optionally filtered by session)
   */
  list: async (sessionId?: string) => {
    const url = sessionId
      ? `/api/flashcards?session_id=${encodeURIComponent(sessionId)}`
      : '/api/flashcards';
    return apiFetch<FlashCardsListResponse>(url, {
      method: 'GET',
    });
  },

  /**
   * Create a new flashcard
   */
  create: async (body: CreateFlashCardRequest) => {
    return apiFetch<CreateFlashCardResponse>('/api/flashcards', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Get flashcard by ID
   */
  get: async (id: string) => {
    return apiFetch<FlashCardDetailResponse>(`/api/flashcards/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Update flashcard front/back
   */
  update: async (id: string, body: UpdateFlashCardRequest) => {
    return apiFetch<UpdateFlashCardResponse>(`/api/flashcards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  /**
   * Delete flashcard
   */
  delete: async (id: string) => {
    return apiFetch<DeleteFlashCardResponse>(`/api/flashcards/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Generate flashcards from text using AI
   */
  generate: async (body: GenerateFlashCardsRequest) => {
    return apiFetch<GenerateFlashCardsResponse>('/api/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

// ============================================================================
// Default export - Single API client object
// ============================================================================

const apiClient = {
  auth,
  sessions,
  flashcards,
};

export default apiClient;
