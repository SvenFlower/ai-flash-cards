# Proof of Concept - AI FlashCard Generation

## Cel PoC

Stworzenie minimalnego proof of concept aplikacji 10x-cards w celu weryfikacji **podstawowej funkcjonalności generowania fiszek za pomocą AI**. PoC ma potwierdzić, że integracja z OpenRouter.ai działa poprawnie i generuje użyteczne fiszki z tekstu użytkownika.

## Zakres funkcjonalny PoC

### ✅ Włączone funkcje (minimalny scope)

1. **Pole wprowadzania tekstu**
   - Textarea z walidacją: 1000-10000 znaków
   - Licznik znaków
   - Przycisk "Generuj fiszki"

2. **Integracja z OpenRouter.ai**
   - Komunikacja z API OpenRouter
   - Wybór odpowiedniego modelu LLM (np. GPT-4o-mini dla kosztów)
   - Prompt engineering dla generowania fiszek w formacie JSON
   - Obsługa błędów API (timeout, rate limits, network errors)

3. **Wyświetlanie wyników**
   - Lista wygenerowanych fiszek (front/back)
   - Loading state podczas generowania
   - Każda fiszka z możliwością:
     - ✅ Akceptacji (zapis)
     - ✏️ Edycji (inline editing)
     - ❌ Odrzucenia (usunięcie z listy)

4. **Podstawowy zapis danych**
   - Zapis zaakceptowanych fiszek do localStorage (dla PoC)
   - Wyświetlenie listy zapisanych fiszek
   - Możliwość usunięcia zapisanych fiszek

### ❌ Wykluczone funkcje (poza scope PoC)

- **Autentykacja użytkowników** - nie potrzebna dla PoC
- **Supabase integration** - użyj localStorage zamiast bazy danych
- **Sesje nauki / spaced repetition** - poza zakresem PoC
- **Telemetria** - opcjonalnie podstawowe logi w konsoli
- **Ręczne dodawanie fiszek** - tylko generacja przez AI
- **Edytowanie zapisanych fiszek** - tylko podstawowe CRUD (zapisz/usuń)
- **Routing** - single page application
- **Responsive design** - skup się na desktopie

## Stack technologiczny

Zgodnie z `.ai/tech-stack.md`:

### Frontend
- **Astro 5.x** - framework główny
- **React 19.x** - dla interaktywnych komponentów (React Islands)
- **TypeScript 5.x** - type safety
- **Tailwind CSS 4.x** - styling
- **Shadcn/ui** - komponenty UI (Button, Textarea, Card, Alert, etc.)

### AI Integration
- **OpenRouter.ai** - API do komunikacji z LLM
- Użyj SDK OpenRouter lub bezpośrednie fetch do API
- Model: `openai/gpt-4o-mini` (opłacalny dla PoC)

### Storage
- **localStorage** - zamiast Supabase dla PoC
- Struktura danych: `{ flashCards: Array<{id: string, front: string, back: string, createdAt: string}> }`

## Wymagania techniczne

### Format danych fiszek

```typescript
interface FlashCard {
  id: string;
  front: string;  // Pytanie/przód fiszki
  back: string;   // Odpowiedź/tył fiszki
  createdAt: string;
}
```

### Prompt dla LLM

LLM powinien otrzymać prompt w stylu:

```
Na podstawie poniższego tekstu wygeneruj listę fiszek edukacyjnych w formacie JSON.
Każda fiszka powinna mieć:
- front: pytanie lub pojęcie do zapamiętania
- back: odpowiedź lub wyjaśnienie

Tekst źródłowy:
{userInput}

Zwróć JSON w formacie:
{
  "flashCards": [
    {"front": "...", "back": "..."},
    ...
  ]
}
```

### Obsługa błędów

- **Network errors** - wyświetl komunikat "Błąd połączenia z API"
- **API errors** - wyświetl komunikat "Błąd generowania fiszek: {message}"
- **Invalid response** - walidacja JSON, fallback do komunikatu błędu
- **Timeout** - timeout 30s, komunikat "Przekroczono czas oczekiwania"

## Struktura projektu

```
/
├── src/
│   ├── pages/
│   │   └── index.astro          # Główna strona PoC
│   ├── components/
│   │   ├── TextInput.astro      # Pole wprowadzania tekstu
│   │   ├── FlashCardList.tsx    # Lista wygenerowanych fiszek (React Island)
│   │   ├── FlashCardCard.tsx    # Pojedyncza fiszka z akcjami
│   │   └── SavedFlashCards.tsx  # Lista zapisanych fiszek (React Island)
│   ├── lib/
│   │   ├── openrouter.ts         # Klient OpenRouter API
│   │   ├── storage.ts           # localStorage utilities
│   │   └── types.ts             # TypeScript types
│   └── utils/
│       └── validation.ts         # Walidacja inputu
├── .env.example                  # Przykładowy plik z OPENROUTER_API_KEY
└── package.json
```

## UI/UX Requirements

### Strona główna

1. **Sekcja wprowadzania**
   - Duże textarea z placeholder
   - Licznik znaków (1000-10000)
   - Przycisk "Generuj fiszki" (disabled gdy < 1000 znaków)
   - Alert z błędami walidacji

2. **Sekcja wyników**
   - Loading spinner podczas generowania
   - Lista fiszek z możliwością akceptacji/edycji/odrzucenia
   - Komunikat gdy brak wyników

3. **Sekcja zapisanych fiszek**
   - Lista wszystkich zapisanych fiszek
   - Możliwość usunięcia
   - Licznik zapisanych fiszek

### Styling

- Użyj Shadcn/ui komponentów dla spójnego designu
- Tailwind dla custom styling
- Dark mode opcjonalnie (nie wymagane dla PoC)

## Kroki implementacji

**WAŻNE: Przed rozpoczęciem implementacji, przedstaw szczegółowy plan pracy i uzyskaj akceptację.**

### Plan pracy powinien zawierać:

1. **Setup projektu**
   - Inicjalizacja Astro z React i TypeScript
   - Konfiguracja Tailwind i Shadcn/ui
   - Struktura folderów

2. **Komponenty UI**
   - TextInput z walidacją
   - FlashCardCard z akcjami
   - FlashCardList
   - SavedFlashCards

3. **Integracja OpenRouter**
   - Klient API
   - Prompt engineering
   - Obsługa błędów

4. **Storage layer**
   - localStorage utilities
   - CRUD operations

5. **Integracja i testowanie**
   - Połączenie wszystkich komponentów
   - Testowanie flow end-to-end
   - Obsługa edge cases

## Akceptacja kryteriów

PoC będzie uznany za udany, jeśli:

- ✅ Użytkownik może wprowadzić tekst (1000-10000 znaków)
- ✅ Po kliknięciu "Generuj" aplikacja komunikuje się z OpenRouter.ai
- ✅ Wygenerowane fiszki są wyświetlane w czytelnej formie
- ✅ Użytkownik może zaakceptować/edytować/odrzucić fiszki
- ✅ Zaakceptowane fiszki są zapisywane i wyświetlane
- ✅ Błędy API są obsługiwane z czytelnymi komunikatami
- ✅ Aplikacja działa lokalnie bez błędów w konsoli

## Dodatkowe uwagi

- **Environment variables**: Użyj `.env` dla `OPENROUTER_API_KEY`
- **Error boundaries**: Podstawowa obsługa błędów React
- **TypeScript**: Wszystkie komponenty i funkcje powinny być typowane
- **Code quality**: Czytelny kod, komentarze gdzie potrzebne
- **Performance**: Nie optymalizuj przedwcześnie, ale unikaj oczywistych problemów

---

**Zadanie**: Przedstaw szczegółowy plan implementacji powyższego PoC, rozbijając pracę na konkretne kroki z oszacowaniem czasu. Po uzyskaniu akceptacji planu, przejdź do implementacji.
