# Database Schema Plan

## Overview

This document describes the database schema for the 10x FlashCards application. The application uses **Supabase PostgreSQL** with Row Level Security (RLS) enabled for data isolation.

---

## Tables

### 1. `sessions` Table

**Purpose**: Stores user-created flashcard study sessions

**Schema**:

```sql
CREATE TABLE public.sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique session identifier |
| `user_id` | uuid | NULLABLE, FK to auth.users | Owner of the session (nullable for backward compatibility) |
| `name` | text | NOT NULL | User-defined session name |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Session creation timestamp |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- `sessions_user_id_idx` ON `user_id` - For efficient user session lookups
- `sessions_created_at_idx` ON `created_at` - For sorting by creation date

**Row Level Security Policies**:
```sql
-- Users can only view their own sessions
CREATE POLICY "Users can view own sessions"
ON sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own sessions
CREATE POLICY "Users can update own sessions"
ON sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON sessions FOR DELETE
USING (auth.uid() = user_id);
```

---

### 2. `flash_cards` Table

**Purpose**: Stores individual flashcards with front/back content

**Schema**:

```sql
CREATE TABLE public.flash_cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
    front text NOT NULL,
    back text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique flashcard identifier |
| `user_id` | uuid | NULLABLE | Owner of the flashcard |
| `session_id` | uuid | NULLABLE, FK to sessions.id | Associated session (nullable for unsaved cards) |
| `front` | text | NOT NULL | Front side content (question/prompt) |
| `back` | text | NOT NULL | Back side content (answer) |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes**:
- `flash_cards_user_id_idx` ON `user_id` - For efficient user flashcard lookups
- `flash_cards_session_id_idx` ON `session_id` - For efficient session flashcard lookups
- `flash_cards_created_at_idx` ON `created_at` - For sorting by creation date

**Foreign Key Constraints**:
- `session_id` → `sessions(id)` with `ON DELETE CASCADE`
  - When a session is deleted, all its flashcards are automatically deleted

**Row Level Security Policies**:
```sql
-- Users can only view their own flashcards
CREATE POLICY "Users can view own flashcards"
ON flash_cards FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own flashcards
CREATE POLICY "Users can insert own flashcards"
ON flash_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own flashcards
CREATE POLICY "Users can update own flashcards"
ON flash_cards FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own flashcards
CREATE POLICY "Users can delete own flashcards"
ON flash_cards FOR DELETE
USING (auth.uid() = user_id);
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth)
└────────┬────────┘
         │ 1
         │
         │ N
    ┌────┴───────────┐
    │                │
    │   sessions     │
    │                │
    └────┬───────────┘
         │ 1
         │
         │ N (CASCADE DELETE)
    ┌────┴───────────┐
    │                │
    │  flash_cards   │
    │                │
    └────────────────┘
```

### Relationship Details

1. **auth.users → sessions** (One-to-Many)
   - One user can have many sessions
   - Relationship through `sessions.user_id`
   - No cascade on user delete (handled by Supabase Auth)

2. **sessions → flash_cards** (One-to-Many with CASCADE)
   - One session can have many flashcards
   - Relationship through `flash_cards.session_id`
   - `ON DELETE CASCADE`: Deleting a session automatically deletes all its flashcards
   - Flashcards can exist without a session (`session_id` is nullable for temporary/unsaved cards)

---

## Data Access Patterns

### Common Query Patterns

1. **Get all sessions for a user**:
   ```sql
   SELECT * FROM sessions
   WHERE user_id = auth.uid()
   ORDER BY created_at DESC;
   ```

2. **Get session with flashcard count**:
   ```sql
   SELECT
     s.*,
     COUNT(fc.id) as flashcard_count
   FROM sessions s
   LEFT JOIN flash_cards fc ON fc.session_id = s.id
   WHERE s.user_id = auth.uid()
   GROUP BY s.id
   ORDER BY s.created_at DESC;
   ```

3. **Get session with all flashcards**:
   ```sql
   SELECT
     s.*,
     fc.id as card_id,
     fc.front,
     fc.back,
     fc.created_at as card_created_at
   FROM sessions s
   LEFT JOIN flash_cards fc ON fc.session_id = s.id
   WHERE s.id = $1 AND s.user_id = auth.uid()
   ORDER BY fc.created_at ASC;
   ```

4. **Get flashcards by session**:
   ```sql
   SELECT * FROM flash_cards
   WHERE session_id = $1 AND user_id = auth.uid()
   ORDER BY created_at ASC;
   ```

5. **Get unsaved flashcards for user**:
   ```sql
   SELECT * FROM flash_cards
   WHERE user_id = auth.uid() AND session_id IS NULL
   ORDER BY created_at DESC;
   ```

---

## Security Considerations

### Row Level Security (RLS)

**Status**: ✅ **ENABLED** on both tables

**Benefits**:
- Automatic user data isolation
- No accidental cross-user data leaks
- Works at the database level (cannot be bypassed)
- Applies to both direct queries and API calls

**Implementation**:
- All policies use `auth.uid()` to enforce user ownership
- Policies cover all CRUD operations (SELECT, INSERT, UPDATE, DELETE)
- Both tables have identical policy structure for consistency

### Authentication Context

- User context (`auth.uid()`) is automatically available in Supabase queries
- Server-side queries through middleware inherit user session
- Client-side queries use JWT from httpOnly cookies (managed by @supabase/ssr)

---

## Migration History

### 20251214000000_create_tables.sql
- Created `sessions` table
- Created `flash_cards` table
- Added indexes for performance
- Established foreign key relationships

### 20251214130000_enable_auth_rls.sql
- Enabled RLS on `sessions` table
- Enabled RLS on `flash_cards` table
- Created all security policies for user data isolation

---

## Future Considerations

### Potential Schema Enhancements

1. **Flashcard Metadata**:
   - Add `difficulty` field (easy/medium/hard)
   - Add `last_reviewed_at` timestamp
   - Add `review_count` for spaced repetition

2. **Session Metadata**:
   - Add `description` field for session notes
   - Add `tags` JSONB array for categorization
   - Add `is_archived` boolean for soft deletes

3. **Learning Progress**:
   - Create `card_reviews` table for spaced repetition tracking
   - Track user performance per flashcard

4. **Sharing Features**:
   - Add `session_shares` table for collaborative sessions
   - Add `is_public` flag on sessions

5. **Performance Optimizations**:
   - Add full-text search indexes on `front` and `back` fields
   - Consider materialized view for session statistics

---

## Database Types (TypeScript)

**Location**: `/src/db/database.types.ts` (generated from Supabase schema)

```typescript
export interface Database {
  public: {
    Tables: {
      flash_cards: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          front: string
          back: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          front: string
          back: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          front?: string
          back?: string
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string | null
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
```

---

## Backup & Maintenance

### Backup Strategy
- Supabase provides automatic daily backups
- Point-in-time recovery available
- Export capability through Supabase dashboard

### Maintenance Tasks
- Monitor index performance
- Review slow query logs
- Update RLS policies as features evolve
- Regenerate TypeScript types after schema changes: `npx supabase gen types typescript`

---

## References

- Supabase Documentation: https://supabase.com/docs
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Migration Files: `/supabase/migrations/`
