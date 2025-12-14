10x-cards – Specyfikacja Produktu (PRD)
A. Koncepcja i uzasadnienie projektu

10x-cards to narzędzie, którego priorytetem jest maksymalne skrócenie procesu tworzenia fiszek edukacyjnych. Aplikacja ma wspierać użytkownika zarówno w ręcznym dodawaniu treści, jak i w szybkim generowaniu fiszek przy pomocy modeli językowych (LLM).
Projekt powstał jako odpowiedź na problem, który często pojawia się podczas nauki: tworzenie dobrych fiszek jest skuteczne, ale wymaga znacznego nakładu pracy. Automatyzacja tego etapu ma sprawić, że nauka stanie się bardziej dostępna i mniej czasochłonna.

B. Zakres funkcjonalny MVP
1. Obsługa użytkowników

* możliwość założenia konta oraz logowania się do systemu,

* funkcja całkowitego usunięcia konta wraz ze wszystkimi powiązanymi rekordami.

2. Tworzenie i zarządzanie fiszkami

* dodawanie nowych fiszek ręcznie (tekst przodu i tyłu),

* edytowanie już istniejących,

* usuwanie fiszek z potwierdzeniem operacji,

* lista wszystkich materiałów zapisanych przez użytkownika.

3. Automatyczna generacja treści

pole do wprowadzenia tekstu od użytkownika (od 1000 do 10 000 znaków),

komunikacja z modelem LLM i odbiór wygenerowanych propozycji fiszek,

prezentacja wyników w formie listy,

użytkownik decyduje, które pozycje zapisać, poprawić lub odrzucić,

informowanie o błędach po stronie API.

4. Mechanizm nauki

integracja z zewnętrznym algorytmem spaced repetition,

sesja, w której fiszki są prezentowane kolejno:

najpierw przód,

po akcji użytkownika – tył,

użytkownik ocenia stopień przyswojenia,

algorytm dobiera dalsze fiszki zgodnie ze swoim wewnętrznym działaniem.

5. Przechowywanie danych i bezpieczeństwo

dane muszą być przechowywane w sposób skalowalny,

pełna izolacja zasobów między użytkownikami — brak dostępu do cudzych fiszek,

zgodność z RODO, w tym możliwość wglądu w dane i ich usunięcia.

6. Telemetria treści generowanych przez AI

zapis liczby fiszek wygenerowanych,

zapis liczby propozycji zaakceptowanych przez użytkownika.

C. Funkcje wyłączone z pierwszej wersji produktu

W ramach MVP nie przewiduje się implementacji:

własnego, customowego algorytmu powtórek — wykorzystywana będzie gotowa biblioteka,

elementów grywalizacji i rankingów,

aplikacji mobilnej (wersja webowe jest jedyną dostępną),

importu dokumentów (PDF, DOCX itd.),

API publicznego,

współdzielenia fiszek pomiędzy użytkownikami,

systemu powiadomień push,

zaawansowanych narzędzi wyszukiwania.

D. Scenariusze użycia (User Stories)
US-01 — Utworzenie konta

Użytkownik rejestruje się podając e-mail i hasło. Po weryfikacji danych konto staje się aktywne, a użytkownik jest automatycznie logowany.

US-02 — Logowanie

Użytkownik wprowadza dane logowania i uzyskuje dostęp do aplikacji. W przypadku błędnych danych system wyświetla stosowny komunikat.

US-03 — Generowanie fiszek przy użyciu AI

Po wklejeniu tekstu użytkownik uruchamia generację. System komunikuje się z LLM i zwraca listę propozycji. Błędy z API są obsługiwane komunikatem.

US-04 — Wybór i zapis fiszek z AI

Użytkownik przegląda listę wygenerowanych fiszek i może:

zaakceptować,

zmodyfikować,

odrzucić sugestie.
Po wyborze klika „Zapisz”, co utrwala fiszki w bazie.

US-05 — Modyfikacje i poprawki

Użytkownik otwiera dowolną swoją fiszkę, edytuje jej treść i zapisuje zmiany.

US-06 — Usuwanie treści

Użytkownik inicjuje usuwanie, potwierdza operację i fiszka znika trwale z systemu.

US-07 — Ręczne dodawanie fiszek

Użytkownik tworzy fiszkę od podstaw, wpisując treść przodu i tyłu.

US-08 — Nauka metodą powtórek

Użytkownik rozpoczyna sesję nauki; algorytm prezentuje fiszki w odpowiedniej kolejności, a użytkownik ocenia stopień zapamiętania.

US-09 — Ochrona prywatności

Użytkownik ma dostęp wyłącznie do własnych fiszek — żadnych zasobów innych kont.

E. Mierniki powodzenia
Efektywność

75% wygenerowanych fiszek powinno być uznawanych przez użytkownika jako wystarczająco dobre, aby je zapisać.

Większość nowych fiszek ma pochodzić z generacji AI, nie z ręcznego tworzenia.

Aktywność użytkowników

analiza liczby wygenerowanych propozycji,

porównywanie liczby wygenerowanych oraz zatwierdzonych fiszek.
