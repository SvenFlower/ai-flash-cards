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
