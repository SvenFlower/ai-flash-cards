# Tech Stack - 10x Cards

## Overview

Stack technologiczny wybrany z myślą o szybkim rozwoju MVP przy zachowaniu wysokiej jakości kodu i możliwości skalowania.

---

## Frontend

### Core Framework

| Technologia | Wersja | Uzasadnienie |
|------------|--------|--------------|
| **Astro** | 5.x | Budowanie szybkich, lekkich stron z minimalnym JavaScriptem. Optymalizacja wydajności poprzez ograniczenie JS tylko do interaktywnych komponentów. |
| **React** | 19.x | Nowoczesna warstwa interakcji dla komponentów wymagających stanu i dynamiki. |
| **TypeScript** | 5.x | Bezpieczeństwo typów, lepsze IDE support, przewidywalność kodu. |

### Styling & UI Components

| Technologia | Wersja | Uzasadnienie |
|------------|--------|--------------|
| **Tailwind CSS** | 4.x | Utility-first CSS framework. Szybkie prototypowanie, spójny design system bez rozbudowanych arkuszy CSS. |
| **Shadcn/ui** | Latest | Zestaw dobrze zaprojektowanych, dostępnych komponentów React. Kopiowanie kodu zamiast instalacji jako zależność. |

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│         Astro (Static Pages)            │
│  ┌───────────────────────────────────┐ │
│  │   React Islands (Interactive)      │ │
│  │   - FlashCard Editor               │ │
│  │   - Study Session                  │ │
│  │   - AI Generation UI               │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Backend & Database

### Platform: Supabase

| Komponent | Opis | Korzyści |
|-----------|------|----------|
| **PostgreSQL** | W pełni zarządzana baza danych | Skalowalność, relacyjność, zaawansowane zapytania SQL |
| **Auth** | Gotowy system uwierzytelniania | Email/password, OAuth, JWT out-of-the-box |
| **SDK** | JavaScript/TypeScript SDK | Backendowa logika osadzona w aplikacji, RLS (Row Level Security) |
| **Open Source** | Self-hostable | Elastyczność przeniesienia na własną infrastrukturę w przyszłości |

### Database Schema Highlights

- **Users** - dane użytkowników (Supabase Auth)
- **FlashCards** - fiszki z front/back, user_id (RLS)
- **Study Sessions** - sesje nauki, spaced repetition data
- **AI Generation Logs** - telemetria generowanych fiszek

---

## AI Integration

### Platform: OpenRouter.ai

| Funkcjonalność | Opis |
|----------------|------|
| **Multi-Provider** | Dostęp do wielu modeli (OpenAI, Google, Anthropic) przez jedno API |
| **Cost Optimization** | Wybór najbardziej opłacalnych modeli dla generowania fiszek |
| **Budget Control** | Limity i kontrola budżetu przypisanego do kluczy API |
| **Unified API** | Standaryzowane endpointy niezależnie od dostawcy |

### AI Workflow

```
User Input (1000-10000 chars)
    ↓
OpenRouter.ai API
    ↓
LLM Processing
    ↓
FlashCard Proposals
    ↓
User Review & Selection
    ↓
Save to Database
```

---

## DevOps & Infrastructure

### CI/CD

| Narzędzie | Rola |
|-----------|------|
| **GitHub Actions** | Automatyzacja buildów, testów, deploymentów dla środowisk dev/prod |

### Hosting

| Platform | Konfiguracja |
|----------|--------------|
| **DigitalOcean** | Kontener Docker, możliwość skalowania wertykalnego i horyzontalnego |

### Deployment Pipeline

```
┌──────────────┐
│  Git Push    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ GitHub Actions   │
│ - Build          │
│ - Test           │
│ - Docker Build   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ DigitalOcean     │
│ - Container Deploy│
│ - Health Checks  │
└──────────────────┘
```

---

## Dependencies Summary

### Production Dependencies

- `astro` ^5.0.0
- `react` ^19.0.0
- `react-dom` ^19.0.0
- `typescript` ^5.0.0
- `tailwindcss` ^4.0.0
- `@supabase/supabase-js` ^2.x
- `openai` (via OpenRouter SDK)

### Development Dependencies

- `@astrojs/react` ^5.0.0
- `@types/react` ^19.0.0
- `@types/node` ^20.x
- `eslint`, `prettier`
- `vitest` (testing)

---

## Key Architectural Decisions

1. **Astro Islands Architecture** - Minimalizacja JavaScriptu, maksymalizacja wydajności
2. **Supabase RLS** - Bezpieczeństwo danych na poziomie bazy, izolacja między użytkownikami
3. **OpenRouter Abstraction** - Elastyczność w wyborze modeli AI bez zmiany kodu
4. **Docker Deployment** - Spójne środowiska dev/staging/prod
5. **TypeScript Everywhere** - Type safety od frontendu do backendu

---

## Future Considerations

- **Spaced Repetition Library** - Integracja z gotową biblioteką (np. `fsrs-rs`, `anki-rs`)
- **Monitoring** - Sentry, DataDog lub podobne dla error tracking
- **Analytics** - Plausible, Posthog lub własne rozwiązanie
- **CDN** - Cloudflare dla statycznych assetów Astro

---

## Implementation Rules for REST API Endpoints

### API Endpoint Structure

All REST API endpoints follow this pattern:

```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

// Define Zod validation schema
const requestSchema = z.object({
  field: z.string().min(1).max(255),
  // ... other fields
});

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Authentication check
  if (!locals.user) {
    return new Response(JSON.stringify({
      error: { message: 'Unauthorized', code: 'AUTH_REQUIRED' }
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Parse and validate request
  try {
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

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

    // 3. Business logic
    const result = await performOperation(
      locals.supabase,
      locals.user.id,
      validationResult.data
    );

    // 4. Success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // 5. Error handling
    console.error('[API Error]:', error);
    return new Response(JSON.stringify({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Validation Rules with Zod

**Installation**: `npm install zod`

**Common Patterns**:

```typescript
import { z } from 'zod';

// Email validation
z.string().email()

// Password validation (min 8 chars)
z.string().min(8).max(72)

// UUID validation
z.string().uuid()

// Text length validation
z.string().min(100).max(10000)

// Optional fields
z.string().optional()

// Nullable fields
z.string().nullable()

// Arrays
z.array(z.string().uuid())

// Enums
z.enum(['pending', 'accepted', 'rejected'])

// Custom validation
z.string().refine((val) => val.trim().length > 0, {
  message: "String cannot be empty or whitespace"
})
```

### Error Response Format

**Standard Error Structure**:

```typescript
interface ErrorResponse {
  error: {
    message: string;      // Human-readable error message
    code: string;         // Machine-readable error code (UPPER_SNAKE_CASE)
    fields?: {            // Field-specific validation errors
      [fieldName: string]: string[];
    };
  }
}
```

**HTTP Status Codes**:
- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - Not authorized for resource
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Unexpected error

### Security Best Practices

1. **Always Check Authentication**:
   ```typescript
   if (!locals.user) {
     return new Response(/* 401 error */);
   }
   ```

2. **Validate Resource Ownership**:
   ```typescript
   const { data: resource } = await locals.supabase
     .from('table')
     .select('*')
     .eq('id', id)
     .eq('user_id', locals.user.id)
     .single();

   if (!resource) {
     return new Response(/* 403 or 404 error */);
   }
   ```

3. **Never Expose Secrets to Browser**:
   - Use `OPENROUTER_API_KEY` (no `PUBLIC_` prefix)
   - Keep sensitive operations server-side only

4. **Leverage Row Level Security (RLS)**:
   - RLS policies automatically filter by `auth.uid()`
   - But still validate for better error messages

### Code Organization

**File Structure**:
```
src/
├── lib/
│   ├── api-types.ts         # TypeScript interfaces for API DTOs
│   ├── validation.ts        # Zod schemas for all endpoints
│   ├── api-errors.ts        # Standard error responses
│   └── api-client.ts        # Frontend API client
├── pages/api/
│   ├── auth/
│   │   ├── register.ts
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   └── me.ts
│   ├── flashcards/
│   │   ├── generate.ts
│   │   ├── index.ts
│   │   └── [id].ts
│   └── sessions/
│       ├── index.ts
│       └── [id].ts
```

### Testing Requirements

1. **Unit Tests** (Vitest):
   - Test validation logic
   - Test business logic functions
   - Mock external dependencies

2. **E2E Tests** (Playwright):
   - Test complete API flows
   - Use separate test environment
   - Clean up after tests

3. **Test Structure**:
   ```typescript
   describe('POST /api/auth/register', () => {
     it('should register new user with valid credentials', async () => {
       // Test implementation
     });

     it('should return 400 for invalid email', async () => {
       // Test implementation
     });

     it('should return 409 for existing email', async () => {
       // Test implementation
     });
   });
   ```

### Performance Considerations

1. **Rate Limiting** (Future):
   - Auth endpoints: 5-10 req/min per IP
   - AI generation: 10 req/hour per user
   - Other endpoints: 100 req/min per user

2. **Caching**:
   - Consider caching expensive queries
   - Use Cloudflare caching for static responses

3. **Database Optimization**:
   - Use indexes (already implemented)
   - Avoid N+1 queries
   - Use select() to limit returned fields

### Documentation Requirements

Each endpoint should have:
1. Purpose and description
2. Authentication requirements
3. Request/response schemas
4. Validation rules
5. Error scenarios
6. Example curl commands

See `.ai/api-plan.md` for complete API specifications.

---

## References

- **Astro API Routes**: https://docs.astro.build/en/guides/endpoints/
- **Zod Documentation**: https://zod.dev/
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **TypeScript**: https://www.typescriptlang.org/
- **REST API Best Practices**: https://restfulapi.net/
