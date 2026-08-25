import { test, expect } from '@playwright/test';
import { trackPageIssues } from '../helpers/console-tracker';
import { Client } from 'pg';

const DACHA_PHONE = '+998901112299';
const DB_URL = process.env.DATABASE_URL;

test.describe('Dacha Regression Tests', () => {
  test.skip(!DB_URL, 'DATABASE_URL env var required for direct DB assertions');
  let pgClient: Client;

  test.beforeAll(async () => {
    pgClient = new Client({ connectionString: DB_URL });
    await pgClient.connect();

    const check = await pgClient.query("SELECT id FROM partner_organizations WHERE phone = $1", [DACHA_PHONE]);
    
    if (check.rows.length === 0) {
      const orgId = '00000000-0000-3001-0000-000000000099';
      await pgClient.query(`
        INSERT INTO partner_organizations (id, type, legal_name, brand_name, tax_id, phone, email, city_id, address, status, default_commission_rate, approved_by, approved_at, created_at, updated_at)
        VALUES ($1, 'dacha', 'Regression Dacha LLC', 'Regression Dacha', 'REGRESSION-DACHA-001', $2, 'dacha@regression.uz', '00000000-0000-1002-0000-000000000001', 'Toshkent, Dacha ko''chasi 1', 'approved', 10.00, '00000000-0000-1006-0000-000000000001', NOW(), NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [orgId, DACHA_PHONE]);

      await pgClient.query(`
        INSERT INTO partner_users (id, organization_id, email, password_hash, full_name, status, created_at, updated_at)
        VALUES ('00000000-0000-3002-0000-000000000099', $1, 'dacha@regression.uz', '$argon2id$v=19$m=65536,t=3,p=4$JY830cRTn6tOBJGtMMPuDQ$eFgy85wei//6a/ITO6qS/PCetIyqYaBQLg+q7JTXvKM', 'Dacha Manager', 'active', NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [orgId]);
    } else {
      const orgId = check.rows[0].id;
      await pgClient.query(`DELETE FROM hotel_rooms WHERE hotel_id = $1`, [orgId]);
      await pgClient.query(`DELETE FROM room_types WHERE code LIKE '%' || $1 || '%'`, [orgId]);
      await pgClient.query(`UPDATE hotels SET capacity_people = NULL WHERE partner_organization_id = $1`, [orgId]);
    }
  });

  test.afterAll(async () => {
    await pgClient.end();
  });

  test('Bug flow: Recreate Dacha and check ghost data', async ({ page }) => {
    page.on('dialog', (d) => d.accept());
    const issues = trackPageIssues(page);

    await page.goto('/login');
    await page.locator('#phone').fill(DACHA_PHONE);
    await page.getByRole('button', { name: 'SMS Kodini yuborish' }).click();

    const devCodeStrong = page.locator('text=Dasturlash rejimi kodi:').locator('..').locator('strong');
    await expect(devCodeStrong).toBeVisible({ timeout: 15_000 });
    const code = await devCodeStrong.textContent();
    await page.locator('#code').fill(code!.trim());
    await page.getByRole('button', { name: 'Kabinetga kirish' }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });

    await page.goto('/listing');
    
    const isDacha = await page.getByRole('heading', { name: 'Dacha E\'loni' }).first().isVisible();
    expect(isDacha).toBeTruthy();

    const roomStep = page.locator('button').filter({ hasText: /Dacha narxlari|Xonalar/i }).first();
    await roomStep.click();
    
    // Check if we are in RoomsView or DachaDetailsView
    // Wait for network idle or a specific element
    await page.waitForTimeout(2000);
    
    const hasAddRoomButton = await page.getByRole('button', { name: /Xona qo\'shish|Yangi xona qo\'shish/i }).first().isVisible();
    
    if (hasAddRoomButton) {
      // It's using RoomsView (deployed version before DachaDetailsView feature)
      await page.getByRole('button', { name: /Xona qo\'shish|Yangi xona qo\'shish/i }).first().click();
      await page.getByLabel('Nomi').fill('Butun dacha');
      await page.getByLabel(/Sig'imi|Sig'im/i).fill('6');
      await page.getByLabel(/Narxi/i).fill('250000');
      await page.getByRole('button', { name: 'Saqlash' }).click();
      await expect(page.getByText('Muvaffaqiyatli saqlandi')).toBeVisible();
    } else {
      // It's using DachaDetailsView (maybe deployed version has it now?)
      await page.getByLabel(/Sig'imi/i).fill('6');
      // Assume DachaDetailsView doesn't have price field yet in production
      await page.getByRole('button', { name: 'Saqlash' }).click();
    }

    await page.goto('/listing');
    await page.getByRole('button', { name: 'Qayta e\'lon yaratish' }).click();
    await expect(page.getByText('E\'lon tozalandi')).toBeVisible();

    const progressText = page.locator('text=0% to\'ldirildi');
    await expect(progressText).toBeVisible();

    await page.getByRole('button', { name: 'Oldindan ko\'rish' }).click();
    const previewModal = page.locator('[role="dialog"]');
    await expect(previewModal.getByText('[object Object]')).toHaveCount(0);
    await expect(previewModal.getByText('6 kishi')).toHaveCount(0);
    await expect(previewModal.getByText('250 000')).toHaveCount(0);

    await page.reload();
    await page.getByRole('button', { name: 'Oldindan ko\'rish' }).click();
    await expect(page.locator('[role="dialog"]').getByText('250 000')).toHaveCount(0);

    const org = await pgClient.query("SELECT id FROM partner_organizations WHERE phone = $1", [DACHA_PHONE]);
    const hotelId = org.rows[0].id;
    const roomTypes = await pgClient.query("SELECT * FROM room_types WHERE code LIKE '%' || $1 || '%'", [hotelId]);
    expect(roomTypes.rows.length).toBe(0);
  });
});
