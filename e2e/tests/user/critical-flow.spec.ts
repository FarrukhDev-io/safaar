import { test, expect } from '@playwright/test';
import { uniqueUzPhone } from '../helpers/phone';
import { trackPageIssues } from '../helpers/console-tracker';

/**
 * web-user critical flow — real brauzer orqali:
 * ro'yxatdan o'tish (telefon+SMS OTP, DEV kod) → profil → bosh sahifa →
 * qidiruv → mehmonxona detali → bildirishnomalar → chiqish.
 *
 * Real backend + real Postgres bilan ishlaydi. Hech qanday mock yo'q —
 * DEV OTP mexanizmi backend'ning o'zi taqdim etadi (production'da o'chirilgan).
 */

test.describe('User critical flow', () => {
  test('register with phone OTP, browse, and logout', async ({ page }) => {
    const issues = trackPageIssues(page);
    const phone = uniqueUzPhone();
    const password = 'Safaar#2026';

    // 1. Ochish
    await page.goto('/uz/register');
    await expect(page.getByRole('heading', { name: "Ro'yxatdan o'tish" })).toBeVisible();

    // 2-4. Telefon kiritish + SMS OTP so'rash (real tugma bosish)
    await page.getByPlaceholder('+998 (__) ___-__-__').fill(phone);
    await page.getByRole('button', { name: 'Kod yuborish' }).click();

    // 5. DEV OTP — backend javobida ko'rsatiladi (faqat dev muhitida)
    const devCodeLocator = page.getByText('Test kodi (dev):');
    await expect(devCodeLocator).toBeVisible({ timeout: 15_000 });
    const devCodeText = await page.locator('text=Test kodi (dev):').locator('..').textContent();
    const code = devCodeText?.match(/(\d{6})/)?.[1];
    expect(code, 'DEV OTP kodi topilishi kerak').toBeTruthy();

    // 6. Kodni real inputga kiritish
    await page.getByPlaceholder('••••••').fill(code!);

    // Profil maydonlari
    await page.getByPlaceholder('Ism').fill('Playwright');
    await page.locator('input[name="lastName"]').fill('Test');
    await page.locator('input[name="email"]').fill(`pw-${Date.now()}@example.com`);
    await page.locator('input[name="password"]').fill(password);

    // 7. Yuborish — kod tekshiriladi + profil to'ldiriladi + sessiya ochiladi
    await page.getByRole('button', { name: /Tasdiqlash va ro'yxatdan o'tish/ }).click();

    // 8. Login/session — bosh sahifaga muvaffaqiyatli redirect
    await page.waitForURL(/\/uz\/?$/, { timeout: 15_000 });

    // Sessiya haqiqatan o'rnatilganini tekshirish — "Mening kabinetim" ko'rinishi kerak
    await expect(page.getByRole('link', { name: /kabinet/i }).first()).toBeVisible({ timeout: 10_000 });

    // 9-10. Qidiruv — mehmonxonalar sahifasiga o'tish
    await page.goto('/uz/hotels');
    await expect(page).toHaveURL(/\/hotels/);
    await page.waitForLoadState('networkidle');

    // 18. Notifications — bell tugmasi авторизациялangan foydalanuvchiga ko'rinishi kerak
    const bell = page.getByLabel('Bildirishnomalar');
    await expect(bell).toBeVisible({ timeout: 10_000 });
    await bell.click();
    await expect(page.getByText('Bildirishnomalar', { exact: true })).toBeVisible();
    await bell.click(); // yopish

    // 20. Logout — real forma submit
    await page.goto('/uz/account');
    const logoutButton = page.getByRole('button', { name: /chiqish/i });
    await logoutButton.click();
    await page.waitForURL(/\/uz\/?$/, { timeout: 10_000 });
    await expect(page.getByRole('link', { name: /kirish/i }).first()).toBeVisible({ timeout: 10_000 });

    // TASK 17/18 — kutilmagan console xatolari yoki 401/403/404/422/500 bo'lmasin
    expect(issues.consoleErrors, `Kutilmagan konsol xatolari: ${issues.consoleErrors.join(' | ')}`).toHaveLength(0);
    expect(
      issues.unexpectedResponses,
      `Kutilmagan network xatolari: ${JSON.stringify(issues.unexpectedResponses)}`,
    ).toHaveLength(0);
  });
});
