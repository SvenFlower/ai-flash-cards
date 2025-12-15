# API Endpoint Implementation Plan: Generate FlashCards

## 1. Endpoint Overview

**Purpose**: Generate flashcards from educational text using AI (OpenRouter API with GPT-4o-mini model)

**Critical Security Fix**: This endpoint moves the OpenRouter API call from client-side to server-side, preventing exposure of the API key to the browser.

**HTTP Method**: POST
**URL**: `/api/flashcards/generate`
**Authentication**: Required (must be logged in)

**Current Problem**:
- OpenRouter API key is exposed to browser (`PUBLIC_OPENROUTER_API_KEY`)
- Anyone can view the key in browser dev tools
- Potential for abuse and unauthorized API usage costs

**Solution**:
- Move OpenRouter API call to server-side endpoint
- Use server-only `OPENROUTER_API_KEY` environment variable
- Client calls our API, which proxies to OpenRouter

---

## 2. Request Details

### HTTP Method
`POST`

### URL Structure
`/api/flashcards/generate`

### Authentication
- **Required**: Yes
- **Method**: Session cookie (managed by Supabase Auth middleware)
- **Check**: `Astro.locals.user` must not be null

### Request Body

```typescript
{
  text: string  // Educational content for flashcard generation
}
```

### Parameters

**Required**:
- `text` (string):
  - Minimum length: 100 characters
  - Maximum length: 10,000 characters
  - Must contain substantive educational content
  - Whitespace-only text is invalid

**Optional**: None

### Request Example

```bash
curl -X POST http://localhost:4321/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "text": "Photosynthesis is the process by which plants convert light energy into chemical energy. The process occurs in chloroplasts, which contain chlorophyll - the green pigment responsible for capturing light energy..."
  }'
```

---

## 3. Used Types

### Request DTO
```typescript
import { GenerateFlashCardsRequest } from '@/lib/api-types';

// From api-types.ts
interface GenerateFlashCardsRequest {
  text: string;
}
```

### Response DTO
```typescript
import { GenerateFlashCardsResponse, GeneratedFlashCard } from '@/lib/api-types';

// From api-types.ts
interface GeneratedFlashCard {
  front: string;  // Question/prompt
  back: string;   // Answer/explanation
}

interface GenerateFlashCardsResponse {
  flashcards: GeneratedFlashCard[];
}
```

### Validation Schema (Zod)
```typescript
import { z } from 'zod';

const generateFlashCardsSchema = z.object({
  text: z.string()
    .min(100, 'Text must be at least 100 characters')
    .max(10000, 'Text must not exceed 10,000 characters')
    .refine((val) => val.trim().length >= 100, {
      message: 'Text must contain at least 100 non-whitespace characters'
    })
});

type GenerateFlashCardsInput = z.infer<typeof generateFlashCardsSchema>;
```

---

## 4. Response Details

### Success Response (200 OK)

```json
{
  "flashcards": [
    {
      "front": "What is photosynthesis?",
      "back": "The process by which plants convert light energy into chemical energy (glucose) using carbon dioxide and water."
    },
    {
      "front": "Where does photosynthesis occur in plant cells?",
      "back": "In chloroplasts, which contain chlorophyll - the green pigment that captures light energy."
    }
  ]
}
```

**Structure**:
- Returns array of flashcard objects
- Each flashcard has `front` (question) and `back` (answer)
- Typically generates 5-15 flashcards depending on text length and complexity

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_FAILED",
    "fields": {
      "text": ["Text must be at least 100 characters"]
    }
  }
}
```

**Causes**:
- Text too short (<100 characters)
- Text too long (>10,000 characters)
- Text is empty or only whitespace
- Missing `text` field in request body

#### 401 Unauthorized
```json
{
  "error": {
    "message": "Unauthorized - authentication required",
    "code": "AUTH_REQUIRED"
  }
}
```

**Cause**: User not authenticated (no valid session)

#### 429 Too Many Requests (Future)
```json
{
  "error": {
    "message": "Rate limit exceeded - please wait before generating more flashcards",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

**Cause**: Too many generation requests in short time (rate limiting)

#### 500 Internal Server Error
```json
{
  "error": {
    "message": "Failed to generate flashcards",
    "code": "AI_SERVICE_ERROR"
  }
}
```

**Causes**:
- OpenRouter API error
- Network timeout (>30s)
- Failed to parse AI response
- Invalid API key
- OpenRouter service unavailable

---

## 5. Data Flow

### Complete Request Flow

```
┌──────────────────┐
│   Browser        │
│  (FlashCardApp)  │
└────────┬─────────┘
         │ POST /api/flashcards/generate
         │ { text: "..." }
         │
         ▼
┌──────────────────────────────────────┐
│   Astro Middleware                   │
│   - Validates session cookie         │
│   - Sets Astro.locals.user           │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│   /api/flashcards/generate.ts        │
│                                      │
│   1. Check authentication            │
│   2. Parse request body              │
│   3. Validate with Zod               │
└────────┬─────────────────────────────┘
         │ text (validated)
         ▼
┌──────────────────────────────────────┐
│   Server-Side Logic                  │
│   - Construct OpenRouter prompt      │
│   - Call OpenRouter API              │
│   - Use OPENROUTER_API_KEY (server)  │
└────────┬─────────────────────────────┘
         │ fetch() to OpenRouter
         ▼
┌──────────────────────────────────────┐
│   OpenRouter API                     │
│   https://openrouter.ai/api/v1/      │
│   chat/completions                   │
│                                      │
│   Model: openai/gpt-4o-mini          │
│   Timeout: 30 seconds                │
└────────┬─────────────────────────────┘
         │ AI Response (JSON)
         ▼
┌──────────────────────────────────────┐
│   Parse AI Response                  │
│   - Extract flashcards from JSON     │
│   - Validate flashcard structure     │
│   - Transform to GeneratedFlashCard[]│
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│   Return Response                    │
│   { flashcards: [...] }              │
│   Status: 200                        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────┐
│   Browser        │
│  (Display cards) │
└──────────────────┘
```

### OpenRouter API Integration

**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`

**Request to OpenRouter**:
```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant that creates flashcards..."
    },
    {
      "role": "user",
      "content": "<user's educational text>"
    }
  ],
  "response_format": { "type": "json_object" }
}
```

**Headers**:
- `Authorization: Bearer ${OPENROUTER_API_KEY}`
- `HTTP-Referer: http://localhost:4321` (or production URL)
- `X-Title: 10x FlashCards`
- `Content-Type: application/json`

**Response from OpenRouter**:
```json
{
  "choices": [{
    "message": {
      "content": "{\"flashcards\": [{\"front\": \"...\", \"back\": \"...\"}]}"
    }
  }]
}
```

---

## 6. Security Considerations

### Critical Security Fixes

1. **API Key Protection** (PRIMARY GOAL):
   - ✅ Move `OPENROUTER_API_KEY` to server-side only
   - ✅ Remove `PUBLIC_OPENROUTER_API_KEY` from environment
   - ✅ API key never exposed to browser
   - ✅ No API key in client-side JavaScript

2. **Authentication**:
   - Require valid user session for all requests
   - Return 401 if `Astro.locals.user` is null
   - Leverage middleware session validation

3. **Input Validation**:
   - Validate text length (100-10,000 chars)
   - Prevent empty or whitespace-only text
   - Reject requests with invalid structure
   - Use Zod for type-safe validation

4. **Rate Limiting** (RECOMMENDED):
   - Limit requests per user (e.g., 10 per hour)
   - Prevent API abuse and cost overruns
   - Can implement with Cloudflare rate limiting or custom middleware
   - Log generation attempts for monitoring

5. **Error Handling**:
   - Never expose OpenRouter API errors to client
   - Generic error messages for external service failures
   - Log detailed errors server-side for debugging
   - Don't leak implementation details

### Authorization

**User Ownership**: Not applicable (generates ephemeral data)
- Generated flashcards are not immediately saved to database
- User must explicitly save flashcards to sessions
- No authorization checks needed beyond authentication

### Data Validation

**Input Sanitization**:
- Text is passed as-is to OpenRouter (no SQL injection risk)
- OpenRouter handles prompt injection safety
- Length validation prevents excessively large payloads

**Output Validation**:
- Parse and validate AI response structure
- Ensure flashcards have `front` and `back` properties
- Handle malformed AI responses gracefully

---

## 7. Error Handling

### Validation Errors (400)

**Scenario**: Text too short
```typescript
if (text.trim().length < 100) {
  return new Response(JSON.stringify({
    error: {
      message: 'Text must be at least 100 characters',
      code: 'TEXT_TOO_SHORT'
    }
  }), { status: 400 });
}
```

**Scenario**: Text too long
```typescript
if (text.length > 10000) {
  return new Response(JSON.stringify({
    error: {
      message: 'Text must not exceed 10,000 characters',
      code: 'TEXT_TOO_LONG'
    }
  }), { status: 400 });
}
```

### Authentication Errors (401)

**Scenario**: User not logged in
```typescript
if (!locals.user) {
  return new Response(JSON.stringify({
    error: {
      message: 'Unauthorized - authentication required',
      code: 'AUTH_REQUIRED'
    }
  }), { status: 401 });
}
```

### External Service Errors (500)

**Scenario**: OpenRouter API error
```typescript
try {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000) // 30 second timeout
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  // ... parse flashcards

} catch (error) {
  console.error('[Generate FlashCards] OpenRouter error:', error);

  return new Response(JSON.stringify({
    error: {
      message: 'Failed to generate flashcards',
      code: 'AI_SERVICE_ERROR'
    }
  }), { status: 500 });
}
```

**Scenario**: Timeout (>30 seconds)
```typescript
catch (error) {
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return new Response(JSON.stringify({
      error: {
        message: 'AI generation timed out - please try again',
        code: 'AI_SERVICE_TIMEOUT'
      }
    }), { status: 500 });
  }
  // ... other error handling
}
```

**Scenario**: Parse error
```typescript
try {
  const content = JSON.parse(data.choices[0].message.content);
  if (!Array.isArray(content.flashcards)) {
    throw new Error('Invalid flashcards structure');
  }
} catch (error) {
  console.error('[Generate FlashCards] Parse error:', error);

  return new Response(JSON.stringify({
    error: {
      message: 'Failed to parse AI response',
      code: 'AI_PARSE_ERROR'
    }
  }), { status: 500 });
}
```

---

## 8. Performance

### Response Time Expectations

- **Typical**: 5-15 seconds (depends on text length and AI processing)
- **Maximum**: 30 seconds (enforced timeout)
- **Network latency**: ~100-500ms
- **OpenRouter processing**: 3-25 seconds

### Optimization Strategies

1. **Timeout Management**:
   - Set 30-second timeout on fetch request
   - Use AbortController for cancellation
   - Provide user feedback for long-running requests

2. **Caching** (Future Enhancement):
   - Cache generated flashcards by text hash
   - Serve cached results for identical text
   - Reduces costs and improves response time
   - Consider TTL (e.g., 24 hours)

3. **Streaming Response** (Future Enhancement):
   - Stream flashcards as they're generated
   - Improve perceived performance
   - Requires OpenRouter streaming support

### Potential Bottlenecks

1. **OpenRouter API latency**: 5-25 seconds
   - **Mitigation**: Set user expectations (loading indicator)

2. **Network timeouts**: Cloudflare 30s limit
   - **Mitigation**: Stay within 30s timeout

3. **Large text payloads**: >5000 chars takes longer
   - **Mitigation**: Inform users of processing time

### Resource Usage

- **Memory**: Minimal (text payload + AI response)
- **CPU**: Negligible (JSON parsing only)
- **Network**: One external API call per request
- **Cost**: ~$0.001-0.01 per generation (OpenRouter pricing)

---

## 9. Implementation Steps

### Step 1: Create API Endpoint File

**Action**: Create `/src/pages/api/flashcards/generate.ts`

**Initial Structure**:
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import type {
  GenerateFlashCardsRequest,
  GenerateFlashCardsResponse,
  GeneratedFlashCard
} from '@/lib/api-types';

export const prerender = false;

const generateFlashCardsSchema = z.object({
  text: z.string().min(100).max(10000)
});

export const POST: APIRoute = async ({ request, locals }) => {
  // Implementation will follow
};
```

### Step 2: Implement Authentication Check

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Check authentication
  if (!locals.user) {
    return new Response(JSON.stringify({
      error: {
        message: 'Unauthorized - authentication required',
        code: 'AUTH_REQUIRED'
      }
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Continue to next step...
};
```

### Step 3: Parse and Validate Request

```typescript
  // 2. Parse request body
  let body: GenerateFlashCardsRequest;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        message: 'Invalid JSON in request body',
        code: 'VALIDATION_FAILED'
      }
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Validate with Zod
  const validationResult = generateFlashCardsSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(JSON.stringify({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_FAILED',
        fields: validationResult.error.flatten().fieldErrors
      }
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { text } = validationResult.data;
```

### Step 4: Call OpenRouter API

```typescript
  // 4. Call OpenRouter API
  try {
    const openrouterResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://ai-flash-cards.gstachniuk.workers.dev',
          'X-Title': '10x FlashCards',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that creates educational flashcards. Generate flashcards in JSON format: {"flashcards": [{"front": "question", "back": "answer"}]}. Create 5-15 flashcards based on the text provided.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!openrouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${openrouterResponse.status}`);
    }

    const openrouterData = await openrouterResponse.json();

    // Continue to next step...
  } catch (error) {
    // Error handling (see Step 6)
  }
```

### Step 5: Parse and Return Response

```typescript
    // 5. Parse AI response
    const content = JSON.parse(openrouterData.choices[0].message.content);

    if (!content.flashcards || !Array.isArray(content.flashcards)) {
      throw new Error('Invalid flashcards structure in AI response');
    }

    const flashcards: GeneratedFlashCard[] = content.flashcards.map((card: any) => ({
      front: String(card.front || ''),
      back: String(card.back || '')
    }));

    // 6. Return success response
    const response: GenerateFlashCardsResponse = { flashcards };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
```

### Step 6: Implement Error Handling

```typescript
  } catch (error) {
    console.error('[Generate FlashCards] Error:', error);

    // Timeout error
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return new Response(JSON.stringify({
        error: {
          message: 'AI generation timed out - please try again',
          code: 'AI_SERVICE_TIMEOUT'
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse error
    if (error.message.includes('Invalid flashcards structure') ||
        error instanceof SyntaxError) {
      return new Response(JSON.stringify({
        error: {
          message: 'Failed to parse AI response',
          code: 'AI_PARSE_ERROR'
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generic error
    return new Response(JSON.stringify({
      error: {
        message: 'Failed to generate flashcards',
        code: 'AI_SERVICE_ERROR'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
```

### Step 7: Update FlashCardApp.tsx

**Action**: Modify `src/components/FlashCardApp.tsx` to call new API endpoint

**Changes**:
1. Remove direct `generateFlashCards` import from `openrouter.ts`
2. Create new function to call API endpoint
3. Update existing call site

**Before**:
```typescript
import { generateFlashCards } from '../lib/openrouter';

// In component
const handleGenerate = async () => {
  const generated = await generateFlashCards(text);
  // ...
};
```

**After**:
```typescript
const handleGenerate = async () => {
  try {
    const response = await fetch('/api/flashcards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const data = await response.json();
    const generated = data.flashcards;
    // ... rest of logic
  } catch (error) {
    // Error handling
  }
};
```

### Step 8: Update Environment Variables

**Action**: Update `.env`, `.env.example`, and Cloudflare dashboard

**Changes**:
1. Add `OPENROUTER_API_KEY=sk-or-v1-...` (without PUBLIC prefix)
2. Remove `PUBLIC_OPENROUTER_API_KEY` references
3. Update `.env.example` documentation

**.env**:
```env
# Server-side only (not exposed to browser)
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Keep these as public
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**.env.example**:
```env
# OpenRouter AI API (server-side only - DO NOT use PUBLIC_ prefix)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Supabase (public - safe to expose via PUBLIC_ prefix)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Cloudflare Dashboard**:
- Add `OPENROUTER_API_KEY` as environment variable
- Remove `PUBLIC_OPENROUTER_API_KEY` if present

### Step 9: Update src/env.d.ts

**Action**: Update TypeScript environment variable types

**Changes**:
```typescript
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;  // Add this (server-side)
  // Remove: readonly PUBLIC_OPENROUTER_API_KEY: string;

  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  // ... other vars
}
```

### Step 10: Delete Old OpenRouter Client (Optional - do later)

**Action**: Delete `/src/lib/openrouter.ts` (after confirming new endpoint works)

**Reason**: No longer needed - all OpenRouter calls go through API endpoint

### Step 11: Test the Endpoint

**Manual Testing**:
```bash
# 1. Start dev server
npm run dev

# 2. Login first (get session cookie)
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt

# 3. Test generate endpoint
curl -X POST http://localhost:4321/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "text": "Photosynthesis is the process by which plants convert light energy into chemical energy. The process occurs in chloroplasts, which contain chlorophyll - the green pigment responsible for capturing light energy. During photosynthesis, plants take in carbon dioxide from the air and water from the soil, using light energy to convert these into glucose (a sugar) and oxygen. The glucose is used by the plant for energy and growth, while the oxygen is released into the atmosphere. This process is vital for life on Earth as it provides oxygen for animals and other organisms to breathe."
  }'

# 4. Test error cases
# Text too short
curl -X POST http://localhost:4321/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"text": "Too short"}'

# Not authenticated
curl -X POST http://localhost:4321/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Long text here..."}'
```

**Expected Results**:
- ✅ 200 with flashcards array for valid request
- ✅ 400 for text too short
- ✅ 401 for no authentication
- ✅ 500 if OpenRouter API fails

### Step 12: Update E2E Tests

**Action**: Update `e2e/user-flow.spec.ts` if needed

**Note**: E2E test already uses FlashCardApp component, which will automatically use the new API endpoint after Step 7 changes. No test changes needed unless we want to add specific API endpoint tests.

---

## 10. Testing Checklist

- [ ] Endpoint returns 401 when not authenticated
- [ ] Endpoint returns 400 when text < 100 chars
- [ ] Endpoint returns 400 when text > 10,000 chars
- [ ] Endpoint returns 400 when text is whitespace only
- [ ] Endpoint returns 200 with flashcards for valid request
- [ ] Flashcards have correct structure (front/back)
- [ ] Timeout works correctly (30 seconds)
- [ ] Error messages don't expose sensitive information
- [ ] API key is never sent to browser
- [ ] FlashCardApp.tsx successfully calls new endpoint
- [ ] E2E test passes with new implementation
- [ ] Environment variables properly configured
- [ ] Cloudflare deployment works with server-side API key

---

## 11. Rollback Plan

If issues arise, rollback in this order:

1. **Revert FlashCardApp.tsx** to use direct openrouter.ts import
2. **Keep endpoint** (doesn't hurt to have it)
3. **Restore PUBLIC_OPENROUTER_API_KEY** in environment
4. **Debug issues** and retry migration

---

## 12. Post-Implementation Verification

After deployment:
1. ✅ Verify API key not visible in browser dev tools
2. ✅ Test flashcard generation in production
3. ✅ Monitor OpenRouter API usage/costs
4. ✅ Check Cloudflare logs for errors
5. ✅ Verify E2E tests pass in CI/CD

---

## References

- OpenRouter API Docs: https://openrouter.ai/docs
- Astro API Routes: https://docs.astro.build/en/guides/endpoints/
- Zod Documentation: https://zod.dev/
- API Plan: `.ai/api-plan.md`
- Tech Stack: `.ai/tech-stack.md`
