import { test, expect } from '@playwright/test';
import { trackPageIssues } from '../helpers/console-tracker';

/**
 * web-partner critical flow — real brauzer orqali:
 * telefon+SMS OTP login → dashboard → moliya → inventory → webhook →
 * bildirishnomalar → chiqish (httpOnly refresh-token cookie tozalanishi
 * bilan birga).
 */

const PARTNER_PHONE = '+998901112203'; // Grand Samarkand Hotel (approved)

async function loginAsPartner(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('#phone').fill(PARTNER_PHONE);
  await page.getByRole('button', { name: 'SMS Kodini yuborish' }).click();

  const devCodeStrong = page.locator('text=Dasturlash rejimi kodi:').locator('..').locator('strong');
  await expect(devCodeStrong).toBeVisible({ timeout: 15_000 });
  const code = await devCodeStrong.textContent();
  expect(code?.trim()).toBeTruthy();

  await page.locator('#code').fill(code!.trim());
  await page.getByRole('button', { name: 'Kabinetga kirish' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  });
}

test.describe('Partner critical flow', () => {
  test('login, finance, inventory, webhook, notifications, logout', async ({ page, context }) => {
    // Native `confirm()` dialoglarini avtomatik tasdiqlash (masalan webhook
    // o'chirish) — aks holda Playwright ularni sukut bo'yicha bekor qiladi.
    page.on('dialog', (dialog) => dialog.accept());

    const issues = trackPageIssues(page);
    // Webhook "test" tugmasi ATAYLAB example.com'ga haqiqiy so'rov yuboradi
    // va u 405 qaytaradi (kutilgan negativ holat — SSRF/yetkazish tekshiruvi
    // haqiqiy ekanini isbotlaydi, fon xato emas).
    issues.markExpected('example.com');

    // 1-3. Login + refresh-token flow (httpOnly cookie o'rnatilishi kerak)
    await loginAsPartner(page);

    const cookies = await context.cookies();
    const refreshCookie = cookies.find((c) => c.name === 'safaar_partner_rt');
    expect(refreshCookie, 'httpOnly refresh-token cookie topilishi kerak').toBeTruthy();
    expect(refreshCookie?.httpOnly).toBe(true);

    // Access token localStorage'da, lekin refresh token'i BO'SH bo'lishi kerak
    const persisted = await page.evaluate(() => localStorage.getItem('safaar-partner-auth'));
    const parsed = persisted ? JSON.parse(persisted) : null;
    expect(parsed?.state?.tokens?.refreshToken ?? '').toBe('');

    // 4. Finance overview
    await page.goto('/reports');
    await page.getByRole('button', { name: /Moliya & Pul yechish/ }).click();
    await expect(page.getByText('Joriy Balans')).toBeVisible({ timeout: 10_000 });

    // 5. Ledger — real backend'dan yuklangan jadval
    await expect(page.getByRole('heading', { name: 'Balans tarixi' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Balans tarixini yuklab bo'lmadi")).toHaveCount(0);

    // 7-8. Inventory tab — real backend ma'lumoti bilan
    await page.goto('/calendar');
    await page.getByRole('button', { name: 'Zaxira (Inventory)' }).click();
    await expect(page.locator('select').first()).toBeVisible({ timeout: 10_000 });

    // Birinchi tahrirlanadigan kun katakchasini bosib, sonini o'zgartirish
    const firstCountButton = page.locator('button[title="Zaxira sonini tahrirlash"]').first();
    await expect(firstCountButton).toBeVisible({ timeout: 10_000 });
    await firstCountButton.click();
    const numberInput = page.locator('input[type="number"]').first();
    await numberInput.fill('9');
    await page.getByLabel('Saqlash').click();
    await expect(page.getByText('Zaxira yangilandi')).toBeVisible({ timeout: 10_000 });

    // 15-19. Webhook: yaratish → test → loglar → o'chirish
    await page.goto('/settings/developer');
    await page.getByRole('button', { name: 'Webhooklar' }).click();
    await page.getByRole('button', { name: "Webhook qo'shish" }).click();
    const webhookUrl = `https://example.com/safaar-e2e-${Date.now()}`;
    await page.getByPlaceholder('https://api.example.com/webhook').fill(webhookUrl);
    await page.getByRole('button', { name: "Qo'shish", exact: true }).click();
    await expect(page.getByText(webhookUrl)).toBeVisible({ timeout: 10_000 });

    // Test yuborish
    await page.locator('button[title="Test yuborish"]').first().click();
    await expect(page.getByText('Test so\'rovi yuborildi')).toBeVisible({ timeout: 10_000 });

    // Loglarni ochish
    await page.locator('button[title="Yetkazish loglari"]').first().click();
    await expect(page.getByText('Yetkazish loglari')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Yopish', exact: true }).click();

    // Webhookni tozalash
    await page.locator('button[title="O\'chirish (butunlay)"]').first().click();
    await expect(page.getByText(webhookUrl)).toHaveCount(0, { timeout: 10_000 });

    // 22. Notifications
    const bell = page.locator('button[aria-label*="Bildirishnomalar"]').first();
    await expect(bell).toBeVisible({ timeout: 10_000 });
    await bell.click();
    await expect(page.getByRole('heading', { name: 'Bildirishnomalar' })).toBeVisible();
    await bell.click();

    // 23. Logout — httpOnly cookie tozalanishi kerak
    await page.getByRole('button', { name: /Hamkor xodimi/ }).click();
    await page.getByRole('menuitem', { name: 'Chiqish' }).click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    const cookiesAfterLogout = await context.cookies();
    const refreshCookieAfter = cookiesAfterLogout.find((c) => c.name === 'safaar_partner_rt');
    expect(refreshCookieAfter?.value ?? '').toBe('');

    // TASK 17/18 — kutilmagan console xatolari yoki 401/403/404/422/500 bo'lmasin
    expect(issues.consoleErrors, `Kutilmagan konsol xatolari: ${issues.consoleErrors.join(' | ')}`).toHaveLength(0);
    expect(
      issues.unexpectedResponses,
      `Kutilmagan network xatolari: ${JSON.stringify(issues.unexpectedResponses)}`,
    ).toHaveLength(0);
  });
});
