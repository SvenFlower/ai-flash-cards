/**
 * API Types and DTOs (Data Transfer Objects)
 *
 * This file contains TypeScript types for all REST API requests and responses.
 * These types ensure type safety across the API boundary.
 */

// ============================================================================
// Standard API Response Wrappers
// ============================================================================

/**
 * Standard error response format
 */
export interface APIError {
  error: {
    message: string;
    code: string;
    fields?: Record<string, string[]>;
  };
}

/**
 * Standard success response with data
 */
export interface APIResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * User object returned by auth endpoints
 */
export interface AuthUser {
  id: string;
  email: string;
}

/**
 * POST /api/auth/register - Request
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * POST /api/auth/register - Response (201)
 */
export interface RegisterResponse {
  user: AuthUser;
}

/**
 * POST /api/auth/login - Request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * POST /api/auth/login - Response (200)
 */
export interface LoginResponse {
  user: AuthUser;
}

/**
 * POST /api/auth/logout - Response (200)
 */
export interface LogoutResponse {
  success: true;
}

/**
 * GET /api/auth/me - Response (200)
 */
export interface MeResponse {
  user: AuthUser | null;
}

// ============================================================================
// FlashCard Generation Types
// ============================================================================

/**
 * Generated flashcard from AI (no ID yet)
 */
export interface GeneratedFlashCard {
  front: string;
  back: string;
}

/**
 * POST /api/flashcards/generate - Request
 */
export interface GenerateFlashCardsRequest {
  text: string;
}

/**
 * POST /api/flashcards/generate - Response (200)
 */
export interface GenerateFlashCardsResponse {
  flashcards: GeneratedFlashCard[];
}

// ============================================================================
// Session Types
// ============================================================================

/**
 * Session object
 */
export interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  flashCardCount?: number;
}

/**
 * Session with its flashcards
 */
export interface SessionWithFlashCards extends Session {
  flashCards: FlashCard[];
}

/**
 * GET /api/sessions - Response (200)
 */
export interface GetSessionsResponse {
  sessions: Session[];
}

/**
 * POST /api/sessions - Request
 */
export interface CreateSessionRequest {
  name: string;
  flashCardIds?: string[];
}

/**
 * POST /api/sessions - Response (201)
 */
export interface CreateSessionResponse {
  session: Session;
}

/**
 * GET /api/sessions/:id - Response (200)
 */
export interface GetSessionResponse {
  session: SessionWithFlashCards;
}

/**
 * PUT /api/sessions/:id - Request
 */
export interface UpdateSessionRequest {
  name: string;
}

/**
 * PUT /api/sessions/:id - Response (200)
 */
export interface UpdateSessionResponse {
  session: Session;
}

/**
 * DELETE /api/sessions/:id - Response (200)
 */
export interface DeleteSessionResponse {
  success: true;
}

// ============================================================================
// FlashCard Types
// ============================================================================

/**
 * FlashCard object
 */
export interface FlashCard {
  id: string;
  front: string;
  back: string;
  sessionId: string | null;
  createdAt: string;
}

/**
 * GET /api/flashcards - Query Parameters
 */
export interface GetFlashCardsQuery {
  sessionId?: string;
  limit?: number;
  offset?: number;
}

/**
 * GET /api/flashcards - Response (200)
 */
export interface GetFlashCardsResponse {
  flashcards: FlashCard[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * POST /api/flashcards - Request
 */
export interface CreateFlashCardRequest {
  front: string;
  back: string;
  sessionId?: string;
}

/**
 * POST /api/flashcards - Response (201)
 */
export interface CreateFlashCardResponse {
  flashcard: FlashCard;
}

/**
 * GET /api/flashcards/:id - Response (200)
 */
export interface GetFlashCardResponse {
  flashcard: FlashCard;
}

/**
 * PUT /api/flashcards/:id - Request
 */
export interface UpdateFlashCardRequest {
  front?: string;
  back?: string;
  sessionId?: string | null;
}

/**
 * PUT /api/flashcards/:id - Response (200)
 */
export interface UpdateFlashCardResponse {
  flashcard: FlashCard;
}

/**
 * DELETE /api/flashcards/:id - Response (200)
 */
export interface DeleteFlashCardResponse {
  success: true;
}

// ============================================================================
// Error Codes (for code completion and type safety)
// ============================================================================

export const ErrorCodes = {
  // Authentication Errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

  // Validation Errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_EMAIL: 'INVALID_EMAIL',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  TEXT_TOO_SHORT: 'TEXT_TOO_SHORT',
  TEXT_TOO_LONG: 'TEXT_TOO_LONG',
  FIELD_REQUIRED: 'FIELD_REQUIRED',
  INVALID_UUID: 'INVALID_UUID',

  // Resource Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_FORBIDDEN: 'RESOURCE_FORBIDDEN',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  FLASHCARD_NOT_FOUND: 'FLASHCARD_NOT_FOUND',

  // External Service Errors
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  AI_SERVICE_TIMEOUT: 'AI_SERVICE_TIMEOUT',
  AI_PARSE_ERROR: 'AI_PARSE_ERROR',

  // Server Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract the data type from an APIResponse
 */
export type ExtractData<T> = T extends APIResponse<infer U> ? U : never;

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
