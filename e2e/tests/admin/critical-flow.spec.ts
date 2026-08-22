import { test, expect } from '@playwright/test';
import { trackPageIssues } from '../helpers/console-tracker';

/**
 * web-admin critical flow — real brauzer orqali:
 * login → dashboard → users → partners → bookings → CMS → notifications →
 * logout.
 *
 * Eslatma: bu demo admin hisobida 2FA yoqilmagan (backend'da tekshirildi),
 * shu sabab login bir bosqichli.
 */

const ADMIN_EMAIL = 'admin@safaar.uz';
const ADMIN_PASSWORD = 'LocalTest123!';

test.describe('Admin critical flow', () => {
  test('login, users, partners, bookings, CMS, notifications, logout', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
    const issues = trackPageIssues(page);

    // 1-2. Login (2FA bu hisobda o'chirilgan)
    await page.goto('/login');
    await page.getByPlaceholder('admin').fill(ADMIN_EMAIL);
    await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Boshqaruv Paneliga Kirish' }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    // 3. Dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // 4-5. Users
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

    // 7-8. Partners
    await page.goto('/partners/list');
    await page.waitForLoadState('networkidle');

    // 9-10. Bookings
    await page.goto('/bookings/hotels');
    await page.waitForLoadState('networkidle');

    // 17-18. CMS News/Offers
    await page.goto('/cms/news');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('tez orada');

    // 21. Roles/permissions — read-only ro'yxat haqiqiy backend'dan
    await page.goto('/team');
    await expect(page.getByText('Rollar va ruxsatlar')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Ruxsatlarni yuklab bo'lmadi")).toHaveCount(0);

    // 24. Notifications — web-admin'da avvaldan ishlaydigan funksiya, regressiya tekshiruvi
    await page.goto('/dashboard');
    const bell = page.locator('header button:has(svg.lucide-bell)').first();
    await expect(bell).toBeVisible({ timeout: 10_000 });
    await bell.click();
    await expect(page.getByText('Bildirishnomalar', { exact: true })).toBeVisible({ timeout: 10_000 });
    await bell.click();

    // 25. Logout — header'dagi oxirgi tugma profil trigeri (qo'ng'iroq + ajratuvchidan keyin)
    await page.locator('header button').last().click();
    await page.getByRole('button', { name: 'Chiqish' }).click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Boshqaruv Paneliga Kirish' })).toBeVisible({ timeout: 10_000 });

    // TASK 17/18 — kutilmagan console xatolari yoki 401/403/404/422/500 bo'lmasin
    expect(issues.consoleErrors, `Kutilmagan konsol xatolari: ${issues.consoleErrors.join(' | ')}`).toHaveLength(0);
    expect(
      issues.unexpectedResponses,
      `Kutilmagan network xatolari: ${JSON.stringify(issues.unexpectedResponses)}`,
    ).toHaveLength(0);
  });
});
