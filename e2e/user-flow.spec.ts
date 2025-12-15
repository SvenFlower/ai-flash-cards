import { test, expect } from '@playwright/test';

const E2E_USER = process.env.E2E_USER || '';
const E2E_PASS = process.env.E2E_PASS || '';

test.describe('User Flow E2E', () => {
  test('complete user flow: login -> generate flashcards -> save to session -> view session', async ({
    page,
  }) => {
    // Step 1: Navigate to home page
    await page.goto('/');

    // Step 2: Should see login link (not authenticated)
    const loginLink = page.getByRole('link', { name: /logowanie/i });
    await expect(loginLink).toBeVisible();

    // Step 3: Click login link
    await loginLink.click();
    await expect(page).toHaveURL('/logowanie');

    // Step 4: Fill in login form
    await page.getByLabel(/email/i).fill(E2E_USER);
    await page.getByLabel(/hasło/i).fill(E2E_PASS);

    // Step 5: Submit login form
    await page.getByRole('button', { name: /zaloguj się/i }).click();

    // Step 6: Should redirect to home page after successful login
    await expect(page).toHaveURL('/');

    // Step 7: Should see user email in nav (authenticated)
    await expect(page.getByText(E2E_USER)).toBeVisible();

    // Step 8: Generate flashcards - fill in text
    const textarea = page.getByPlaceholder(/wklej tutaj tekst/i);
    await expect(textarea).toBeVisible();

    const educationalText = `
Fotosynteza to proces, w którym rośliny wykorzystują światło słoneczne do produkcji glukozy z dwutlenku węgla i wody.
Proces ten zachodzi w chloroplastach, które zawierają chlorofil - zielony barwnik odpowiedzialny za wychwytywanie energii świetlnej.
Produktami ubocznymi fotosyntezy są tlen i woda. Fotosynteza jest kluczowa dla życia na Ziemi, ponieważ dostarcza tlen do atmosfery
i stanowi podstawę dla prawie wszystkich łańcuchów pokarmowych. Równanie chemiczne fotosyntezy: 6CO2 + 6H2O + światło → C6H12O6 + 6O2.

Chloroplasty zawierają błony tylakoidowe, w których zachodzi faza jasna fotosyntezy. W tej fazie energia świetlna jest przekształcana w energię chemiczną
w postaci ATP i NADPH. Następnie w fazie ciemnej, która zachodzi w stromie chloroplastów, wykorzystywane są ATP i NADPH do syntezy glukozy z dwutlenku węgla
w cyklu Calvina. Cykl Calvina składa się z trzech głównych etapów: fiksacji węgla, redukcji i regeneracji RuBP.

Fotosynteza jest procesem endotermicznym, co oznacza, że wymaga dostarczenia energii z zewnątrz. Ta energia pochodzi ze światła słonecznego.
Chlorofil absorbuje światło głównie w zakresie czerwieni i fioletu, podczas gdy światło zielone jest odbijane, dlatego rośliny mają zielony kolor.
Oprócz chlorofilu a, w procesie fotosyntezy biorą udział również inne barwniki pomocnicze, takie jak chlorofil b, karotenoidy i ksantofile.

Istnieją różne typy fotosyntezy: fotosynteza C3, C4 i CAM. Rośliny C3, takie jak pszenica i ryż, bezpośrednio wiążą CO2 w cyklu Calvina.
Rośliny C4, jak kukurydza i trzcina cukrowa, mają dodatkowy mechanizm koncentrowania CO2, co zwiększa efektywność fotosyntezy w warunkach wysokiej temperatury.
Rośliny CAM, takie jak kaktusy i agawy, otwierają aparaty szparkowe w nocy, aby zminimalizować utratę wody, co jest adaptacją do suchego klimatu.

Efektywność fotosyntezy zależy od wielu czynników środowiskowych. Intensywność światła wpływa na szybkość reakcji świetlnych. Przy niskiej intensywności
światło jest czynnikiem limitującym, natomiast przy wysokiej intensywności innee czynniki stają się ograniczające. Stężenie dwutlenku węgla w atmosferze
wpływa bezpośrednio na fazę ciemną fotosyntezy. Temperatura oddziałuje na aktywność enzymów biorących udział w procesie, przy czym optymalna temperatura
dla większości roślin wynosi około 25-30 stopni Celsjusza. Dostępność wody jest kluczowa nie tylko jako substrat w reakcjach fotosyntezy, ale również
jako czynnik utrzymujący turgor komórek i umożliwiający wymianę gazową przez aparaty szparkowe.
    `.trim();

    await textarea.fill(educationalText);

    // Step 9: Click generate button
    const generateButton = page.getByRole('button', { name: /generuj fiszki/i });
    await generateButton.click();

    // Step 10: Wait for flashcards to be generated (with longer timeout for AI)
    await expect(page.getByText(/Wygenerowane fiszki/i).first()).toBeVisible({ timeout: 600000 });

    // Step 11: Accept all flashcards
    const acceptButtons = page.getByRole('button', { name: /akceptuj/i });
    const count = await acceptButtons.count();

    for (let i = 0; i < count; i++) {
      await acceptButtons.nth(i).click(); // Always click first as they disappear when accepted
    }

    // Step 12: Save to session
    const saveButton = page.getByRole('button', { name: /zapisz do sesji/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Step 13: Session modal should appear
    const sessionNameInput = page.getByPlaceholder(/np. Sesja 2024-12-14/i);
    await expect(sessionNameInput).toBeVisible();

    // Step 14: Verify default name format (Sesja YYYY-MM-DD)
    const defaultName = await sessionNameInput.inputValue();
    expect(defaultName).toMatch(/^Sesja \d{4}-\d{2}-\d{2}$/);

    // Step 15: Change session name
    const customSessionName = `E2E Test Session ${Date.now()}`;
    await sessionNameInput.fill(customSessionName);

    // Step 16: Save session (use plain string with exact match, not regex)
    await page.getByRole('button', { name: 'Zapisz', exact: true }).click();

    // Wait for modal to close after saving (with longer timeout)
    // Check if there's an error message first
    const errorMessage = page.locator('.bg-red-50');
    const hasError = await errorMessage.isVisible().catch(() => false);

    if (hasError) {
        const errorText = await errorMessage.textContent();
        throw new Error(`Session save failed: ${errorText}`);
    }

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

    // Step 17: Navigate to sessions page
    await page.getByRole('link', { name: /sesje/i }).click();
    await expect(page).toHaveURL('/sesje');

    // Wait for the page to fully load with network idle
    await page.waitForLoadState('networkidle');

    // Step 18: Should see the created session
    await expect(page.getByText(customSessionName)).toBeVisible();

    // Step 19: Click on the session to view details
    // Find the specific h3 heading with the session name, then navigate up to the session card
    // h3 -> parent div (mb-4) -> parent div (session card with rounded-lg)
    const sessionHeading = page.getByRole('heading', { name: customSessionName, exact: true, level: 3 });
    const sessionCard = sessionHeading.locator('../..');
    const sessionLink = sessionCard.getByRole('link', { name: /zobacz/i });
    await sessionLink.click();

    // Step 20: Should see session details with flashcards
    await expect(page.getByText(customSessionName)).toBeVisible();
    await expect(page.getByText("Fiszka #1", {exact: true})).toBeVisible();

    // Step 21: Verify flashcard content is displayed
    // "Przód:" and "Tył:" are in <h3> tags, not <p> tags
    await expect(page.getByRole('heading', { name: /przód:/i, level: 3 }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /tył:/i, level: 3 }).first()).toBeVisible();

    // Step 22: Navigate back to sessions list
    await page.getByRole('link', { name: /wróć do sesji/i }).click();
    await expect(page).toHaveURL('/sesje');

    // Step 23: Logout
    await page.getByRole('button', { name: /wyloguj/i }).click();

    // Step 24: Should see login/register links again
    await expect(page.getByRole('link', { name: /logowanie/i })).toBeVisible();
  });
});
