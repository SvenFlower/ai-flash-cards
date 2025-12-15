# REST API Specification

## Overview

This document specifies all REST API endpoints for the 10x FlashCards application. All endpoints follow REST conventions and return JSON responses.

**Base URL**: `/api`

**Authentication**: Most endpoints require authentication via session cookies (managed by Supabase Auth)

**Content-Type**: All requests and responses use `application/json`

---

## API Conventions

### Standard Response Format

**Success Response**:
```typescript
{
  data: T,  // Requested resource(s)
  meta?: {  // Optional metadata
    total?: number,
    page?: number,
    limit?: number
  }
}
```

**Error Response**:
```typescript
{
  error: {
    message: string,      // Human-readable error message
    code: string,         // Machine-readable error code
    fields?: {            // Field-specific validation errors
      [fieldName: string]: string
    }
  }
}
```

### HTTP Status Codes

- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Invalid request data (validation errors)
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Authenticated but not authorized for resource
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Unexpected server error

### Authentication

**Method**: HTTP-only session cookies (set by Supabase Auth)

**Headers**: No Authorization header required (cookies sent automatically)

**Checking Auth**:
- Server reads session from `Astro.locals.user` (set by middleware)
- Returns 401 if user is null and endpoint requires auth

---

## Authentication Endpoints

### POST `/api/auth/register`

**Purpose**: Register a new user account

**Authentication**: Not required

**Request Body**:
```typescript
{
  email: string,     // Valid email format, max 255 chars
  password: string   // Min 8 chars, max 72 chars
}
```

**Validation Rules**:
- `email`: Must be valid email format
- `password`: Minimum 8 characters, maximum 72 characters

**Success Response** (201 Created):
```typescript
{
  user: {
    id: string,
    email: string
  }
}
```

**Error Responses**:
- `400`: Invalid email format or password too short/long
- `409`: Email already registered
- `500`: Server error during registration

**Example**:
```bash
curl -X POST /api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepass123"}'
```

---

### POST `/api/auth/login`

**Purpose**: Authenticate user and create session

**Authentication**: Not required

**Request Body**:
```typescript
{
  email: string,
  password: string
}
```

**Success Response** (200 OK):
```typescript
{
  user: {
    id: string,
    email: string
  }
}
```

**Side Effects**:
- Sets HTTP-only session cookies
- Session persists until logout or expiration

**Error Responses**:
- `400`: Missing email or password
- `401`: Invalid credentials
- `500`: Server error during authentication

**Example**:
```bash
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepass123"}' \
  -c cookies.txt
```

---

### POST `/api/auth/logout`

**Purpose**: End user session

**Authentication**: Required

**Request Body**: None

**Success Response** (200 OK):
```typescript
{
  success: true
}
```

**Side Effects**:
- Clears session cookies
- Invalidates session tokens

**Error Responses**:
- `401`: Not authenticated
- `500`: Server error during logout

**Example**:
```bash
curl -X POST /api/auth/logout \
  -b cookies.txt
```

---

### GET `/api/auth/me`

**Purpose**: Get current authenticated user

**Authentication**: Required

**Request Body**: None

**Success Response** (200 OK):
```typescript
{
  user: {
    id: string,
    email: string
  }
}
```

**Error Responses**:
- `401`: Not authenticated
- `500`: Server error

**Example**:
```bash
curl -X GET /api/auth/me \
  -b cookies.txt
```

---

## Flashcard Generation Endpoint

### POST `/api/flashcards/generate`

**Purpose**: Generate flashcards from text using AI (OpenRouter)

**Authentication**: Required

**Request Body**:
```typescript
{
  text: string  // Min 100 chars, max 10000 chars
}
```

**Validation Rules**:
- `text`: Minimum 100 characters (educational content requirement)
- `text`: Maximum 10,000 characters (API limit)
- `text`: Must contain substantive content (not just whitespace)

**Success Response** (200 OK):
```typescript
{
  flashcards: Array<{
    front: string,  // Question/prompt
    back: string    // Answer/explanation
  }>
}
```

**Processing**:
- Sends text to OpenRouter API (GPT-4o-mini model)
- Parses AI response into structured flashcard format
- Returns array of generated flashcards (typically 5-15 cards)

**Error Responses**:
- `400`: Text too short (<100 chars) or too long (>10000 chars)
- `401`: Not authenticated
- `429`: Rate limit exceeded (too many generations)
- `500`: OpenRouter API error or parsing failure
- `503`: OpenRouter service unavailable

**Example**:
```bash
curl -X POST /api/flashcards/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"text":"Photosynthesis is the process where plants..."}'
```

**Notes**:
- **SECURITY**: API key never exposed to browser
- Timeout: 30 seconds (long-running AI request)
- Rate limiting recommended to prevent abuse

---

## Session Management Endpoints

### GET `/api/sessions`

**Purpose**: Get all sessions for authenticated user

**Authentication**: Required

**Query Parameters**: None

**Success Response** (200 OK):
```typescript
{
  sessions: Array<{
    id: string,
    name: string,
    createdAt: string,      // ISO 8601 format
    updatedAt: string,      // ISO 8601 format
    flashCardCount: number  // Computed count
  }>
}
```

**Sorting**: Returns sessions sorted by `createdAt DESC` (newest first)

**Error Responses**:
- `401`: Not authenticated
- `500`: Database error

**Example**:
```bash
curl -X GET /api/sessions \
  -b cookies.txt
```

---

### POST `/api/sessions`

**Purpose**: Create a new session (optionally with flashcards)

**Authentication**: Required

**Request Body**:
```typescript
{
  name: string,            // Min 1 char, max 255 chars
  flashCardIds?: string[]  // Optional array of flashcard IDs to add
}
```

**Validation Rules**:
- `name`: Required, minimum 1 character, maximum 255 characters
- `flashCardIds`: Optional array of valid UUID strings

**Success Response** (201 Created):
```typescript
{
  session: {
    id: string,
    name: string,
    createdAt: string,
    updatedAt: string
  }
}
```

**Processing**:
1. Creates new session with given name
2. If `flashCardIds` provided, links those flashcards to session
3. Returns created session

**Error Responses**:
- `400`: Invalid name (empty or too long) or invalid flashcard IDs
- `401`: Not authenticated
- `404`: One or more flashcard IDs don't exist
- `500`: Database error

**Example**:
```bash
curl -X POST /api/sessions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Biology Study Session 2024","flashCardIds":["uuid1","uuid2"]}'
```

---

### GET `/api/sessions/:id`

**Purpose**: Get specific session with all its flashcards

**Authentication**: Required

**URL Parameters**:
- `id` (string, UUID): Session ID

**Success Response** (200 OK):
```typescript
{
  session: {
    id: string,
    name: string,
    createdAt: string,
    updatedAt: string,
    flashCards: Array<{
      id: string,
      front: string,
      back: string,
      createdAt: string
    }>
  }
}
```

**Error Responses**:
- `400`: Invalid UUID format
- `401`: Not authenticated
- `403`: Session belongs to another user
- `404`: Session not found
- `500`: Database error

**Example**:
```bash
curl -X GET /api/sessions/550e8400-e29b-41d4-a716-446655440000 \
  -b cookies.txt
```

---

### PUT `/api/sessions/:id`

**Purpose**: Update session name

**Authentication**: Required

**URL Parameters**:
- `id` (string, UUID): Session ID

**Request Body**:
```typescript
{
  name: string  // Min 1 char, max 255 chars
}
```

**Success Response** (200 OK):
```typescript
{
  session: {
    id: string,
    name: string,
    createdAt: string,
    updatedAt: string  // Automatically updated
  }
}
```

**Error Responses**:
- `400`: Invalid UUID or name validation error
- `401`: Not authenticated
- `403`: Session belongs to another user
- `404`: Session not found
- `500`: Database error

**Example**:
```bash
curl -X PUT /api/sessions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Updated Session Name"}'
```

---

### DELETE `/api/sessions/:id`

**Purpose**: Delete session and all its flashcards

**Authentication**: Required

**URL Parameters**:
- `id` (string, UUID): Session ID

**Success Response** (200 OK):
```typescript
{
  success: true
}
```

**Side Effects**:
- Deletes session
- CASCADE deletes all flashcards in the session
- Irreversible operation

**Error Responses**:
- `400`: Invalid UUID format
- `401`: Not authenticated
- `403`: Session belongs to another user
- `404`: Session not found
- `500`: Database error

**Example**:
```bash
curl -X DELETE /api/sessions/550e8400-e29b-41d4-a716-446655440000 \
  -b cookies.txt
```

---

## FlashCard Management Endpoints

### GET `/api/flashcards`

**Purpose**: Get flashcards for authenticated user

**Authentication**: Required

**Query Parameters**:
- `sessionId` (optional, string UUID): Filter by session
- `limit` (optional, number, default: 50): Max results to return
- `offset` (optional, number, default: 0): Pagination offset

**Success Response** (200 OK):
```typescript
{
  flashcards: Array<{
    id: string,
    front: string,
    back: string,
    sessionId: string | null,
    createdAt: string
  }>,
  meta: {
    total: number,
    limit: number,
    offset: number
  }
}
```

**Filtering**:
- If `sessionId` provided: returns only flashcards from that session
- If `sessionId` omitted: returns all user's flashcards
- If `sessionId` is `null`: returns unsaved flashcards

**Sorting**: Returns flashcards sorted by `createdAt ASC`

**Error Responses**:
- `400`: Invalid query parameters
- `401`: Not authenticated
- `404`: Session not found (if sessionId provided)
- `500`: Database error

**Examples**:
```bash
# Get all flashcards
curl -X GET /api/flashcards -b cookies.txt

# Get flashcards from specific session
curl -X GET "/api/flashcards?sessionId=550e8400-e29b-41d4-a716-446655440000" \
  -b cookies.txt

# Paginated request
curl -X GET "/api/flashcards?limit=20&offset=40" \
  -b cookies.txt
```

---

### POST `/api/flashcards`

**Purpose**: Create a new flashcard

**Authentication**: Required

**Request Body**:
```typescript
{
  front: string,          // Min 1 char, max 1000 chars
  back: string,           // Min 1 char, max 2000 chars
  sessionId?: string      // Optional UUID
}
```

**Validation Rules**:
- `front`: Required, minimum 1 character, maximum 1000 characters
- `back`: Required, minimum 1 character, maximum 2000 characters
- `sessionId`: Optional UUID (must belong to authenticated user if provided)

**Success Response** (201 Created):
```typescript
{
  flashcard: {
    id: string,
    front: string,
    back: string,
    sessionId: string | null,
    createdAt: string
  }
}
```

**Error Responses**:
- `400`: Validation errors (empty fields, too long, invalid UUID)
- `401`: Not authenticated
- `403`: Session belongs to another user
- `404`: Session not found (if sessionId provided)
- `500`: Database error

**Example**:
```bash
curl -X POST /api/flashcards \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "front":"What is photosynthesis?",
    "back":"The process by which plants convert light into energy",
    "sessionId":"550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

### GET `/api/flashcards/:id`

**Purpose**: Get specific flashcard

**Authentication**: Required

**URL Parameters**:
- `id` (string, UUID): Flashcard ID

**Success Response** (200 OK):
```typescript
{
  flashcard: {
    id: string,
    front: string,
    back: string,
    sessionId: string | null,
    createdAt: string
  }
}
```

**Error Responses**:
- `400`: Invalid UUID format
- `401`: Not authenticated
- `403`: Flashcard belongs to another user
- `404`: Flashcard not found
- `500`: Database error

**Example**:
```bash
curl -X GET /api/flashcards/660e8400-e29b-41d4-a716-446655440000 \
  -b cookies.txt
```

---

### PUT `/api/flashcards/:id`

**Purpose**: Update flashcard content or session assignment

**Authentication**: Required

**URL Parameters**:
- `id` (string, UUID): Flashcard ID

**Request Body** (all fields optional, at least one required):
```typescript
{
  front?: string,       // Min 1 char, max 1000 chars
  back?: string,        // Min 1 char, max 2000 chars
  sessionId?: string | null  // UUID or null to unassign
}
```

**Success Response** (200 OK):
```typescript
{
  flashcard: {
    id: string,
    front: string,
    back: string,
    sessionId: string | null,
    createdAt: string
  }
}
```

**Error Responses**:
- `400`: No fields provided or validation errors
- `401`: Not authenticated
- `403`: Flashcard or target session belongs to another user
- `404`: Flashcard not found or target session not found
- `500`: Database error

**Example**:
```bash
curl -X PUT /api/flashcards/660e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"front":"Updated question?","sessionId":null}'
```

---

### DELETE `/api/flashcards/:id`

**Purpose**: Delete a flashcard

**Authentication**: Required

**URL Parameters**:
- `id` (string, UUID): Flashcard ID

**Success Response** (200 OK):
```typescript
{
  success: true
}
```

**Error Responses**:
- `400`: Invalid UUID format
- `401`: Not authenticated
- `403`: Flashcard belongs to another user
- `404`: Flashcard not found
- `500`: Database error

**Example**:
```bash
curl -X DELETE /api/flashcards/660e8400-e29b-41d4-a716-446655440000 \
  -b cookies.txt
```

---

## Error Code Reference

### Authentication Errors
- `AUTH_REQUIRED`: User must be authenticated
- `AUTH_INVALID`: Invalid credentials
- `AUTH_EMAIL_EXISTS`: Email already registered
- `AUTH_SESSION_EXPIRED`: Session expired, please login again

### Validation Errors
- `VALIDATION_FAILED`: Request validation failed
- `INVALID_EMAIL`: Email format is invalid
- `PASSWORD_TOO_SHORT`: Password must be at least 8 characters
- `TEXT_TOO_SHORT`: Text must be at least 100 characters
- `TEXT_TOO_LONG`: Text exceeds maximum length
- `FIELD_REQUIRED`: Required field is missing
- `INVALID_UUID`: Invalid UUID format

### Resource Errors
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RESOURCE_FORBIDDEN`: User doesn't own this resource
- `SESSION_NOT_FOUND`: Session doesn't exist
- `FLASHCARD_NOT_FOUND`: Flashcard doesn't exist

### External Service Errors
- `AI_SERVICE_ERROR`: OpenRouter API error
- `AI_SERVICE_TIMEOUT`: AI generation took too long
- `AI_PARSE_ERROR`: Failed to parse AI response

### Server Errors
- `DATABASE_ERROR`: Database query failed
- `INTERNAL_ERROR`: Unexpected server error

---

## Rate Limiting (Future Enhancement)

**Recommended Limits**:
- `/api/auth/register`: 5 requests per hour per IP
- `/api/auth/login`: 10 requests per 15 minutes per IP
- `/api/flashcards/generate`: 10 requests per hour per user
- All other endpoints: 100 requests per minute per user

**Headers** (when implemented):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Testing Examples

### Complete User Flow

```bash
# 1. Register
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' \
  -c cookies.txt

# 2. Login
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' \
  -b cookies.txt -c cookies.txt

# 3. Get current user
curl -X GET http://localhost:4321/api/auth/me \
  -b cookies.txt

# 4. Generate flashcards
curl -X POST http://localhost:4321/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"text":"Long educational text about photosynthesis..."}'

# 5. Create session
curl -X POST http://localhost:4321/api/sessions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Biology Session"}' \
  > session.json

# 6. Create flashcard in session
SESSION_ID=$(jq -r '.session.id' session.json)
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{\"front\":\"Q?\",\"back\":\"A\",\"sessionId\":\"$SESSION_ID\"}"

# 7. Get all sessions
curl -X GET http://localhost:4321/api/sessions \
  -b cookies.txt

# 8. Get session with flashcards
curl -X GET "http://localhost:4321/api/sessions/$SESSION_ID" \
  -b cookies.txt

# 9. Logout
curl -X POST http://localhost:4321/api/auth/logout \
  -b cookies.txt
```

---

## API Versioning (Future)

Current version: `v1` (implicit, no version in URL)

Future versions will use URL versioning:
- `/api/v1/...`
- `/api/v2/...`

---

## References

- Astro API Routes: https://docs.astro.build/en/guides/endpoints/
- Supabase Auth: https://supabase.com/docs/guides/auth
- REST API Best Practices: https://restfulapi.net/
- HTTP Status Codes: https://httpstatuses.com/
