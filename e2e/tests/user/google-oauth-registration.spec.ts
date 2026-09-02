import { test, expect } from '@playwright/test';
import { trackPageIssues } from '../helpers/console-tracker';

function randomPhone(): string {
  const suffix = Math.floor(100000 + Math.random() * 800000);
  return `+99890${suffix}`;
}

async function readDevCode(page: import('@playwright/test').Page): Promise<string> {
  const devCodeStrong = page.locator('text=Test kodi (dev):').locator('..').locator('strong');
  await expect(devCodeStrong).toBeVisible({ timeout: 15_000 });
  const text = await devCodeStrong.textContent();
  return text!.trim();
}

/**
 * Next.js client-side navigation can leave a form visible for a brief
 * hydration window before React attaches its handlers — a click landing in
 * that window is silently swallowed (no request, no error). Retries the
 * click once if navigation doesn't happen quickly; harmless for idempotent
 * form submits (OTP-verify, login) since the inputs are unchanged.
 */
async function clickAndWaitForNavAway(
  page: import('@playwright/test').Page,
  button: ReturnType<import('@playwright/test').Page['getByRole']>,
  excludesPath: string,
): Promise<void> {
  await button.click();
  try {
    await page.waitForURL((url) => !url.pathname.includes(excludesPath), {
      timeout: 5_000,
      waitUntil: 'commit',
    });
  } catch {
    await button.click();
    await page.waitForURL((url) => !url.pathname.includes(excludesPath), {
      timeout: 15_000,
      waitUntil: 'commit',
    });
  }
}

test.describe('Google OAuth login-or-registration — local regression (no live Google account)', () => {
  test('normal phone+OTP registration still works (regression)', async ({ page, context }) => {
    const issues = trackPageIssues(page);
    const phone = randomPhone();
    const email = `qa.${Date.now()}@example.com`;
    const password = 'Qwerty123!';

    await page.goto('/uz/register', { waitUntil: 'networkidle' });
    await page.locator('input[name="phone"]').first().fill(phone);
    await page.getByRole('button', { name: 'Kod yuborish' }).click();

    const code = await readDevCode(page);
    await page.locator('input[name="code"]').fill(code);
    await page.locator('input[name="firstName"]').fill('Regression');
    await page.locator('input[name="lastName"]').fill('Tester');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await clickAndWaitForNavAway(
      page,
      page.getByRole('button', { name: "Tasdiqlash va ro'yxatdan o'tish" }),
      '/register',
    );

    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === 'safaar_session');
    expect(session, 'safaar_session cookie must be set after registration').toBeTruthy();

    // Plain email+password login is verified directly against the backend
    // API (see the separate `request` test below) rather than through this
    // browser session — the local `next dev` server was found to serve a
    // stale cached Server Action response for the login form specifically
    // (`x-nextjs-cache: HIT` even on a freshly restarted server with the
    // cache directory cleared), unrelated to the Google OAuth work and
    // reproducible even before any of this session's changes. Flagged to
    // the user separately; out of scope to fix here.
    expect(issues.consoleErrors, issues.consoleErrors.join('\n')).toEqual([]);
    expect(issues.unexpectedResponses, JSON.stringify(issues.unexpectedResponses)).toEqual([]);
  });

  test('phone+password login backend regression (direct API, bypassing the dev-server Server Action cache quirk)', async ({ request }) => {
    const phone = randomPhone();
    const email = `qa.api.${Date.now()}@example.com`;
    const password = 'Qwerty123!';
    const apiUrl = process.env.E2E_API_URL || 'http://localhost:4000/v1';

    const sendOtp = await request.post(`${apiUrl}/auth/user/send-otp`, { data: { phone } });
    expect(sendOtp.ok()).toBeTruthy();
    const sendOtpBody = await sendOtp.json();

    const verify = await request.post(`${apiUrl}/auth/user/verify-otp`, {
      data: {
        phone,
        code: sendOtpBody.data.dev_code,
        challenge_id: sendOtpBody.data.challenge_id,
      },
    });
    expect(verify.ok()).toBeTruthy();
    const verifyBody = await verify.json();

    const complete = await request.post(`${apiUrl}/auth/user/complete-profile`, {
      headers: { Authorization: `Bearer ${verifyBody.data.accessToken}` },
      data: { first_name: 'Api', last_name: 'Tester', email, password },
    });
    expect(complete.ok()).toBeTruthy();

    const login = await request.post(`${apiUrl}/auth/user/login`, { data: { email, password } });
    expect(login.status(), await login.text()).toBe(201);
    const loginBody = await login.json();
    expect(loginBody.data.user.email).toBe(email);
    expect(loginBody.data.accessToken).toEqual(expect.any(String));

    const wrongPassword = await request.post(`${apiUrl}/auth/user/login`, {
      data: { email, password: 'WrongPassword123!' },
    });
    expect(wrongPassword.status()).toBe(401);
  });

  test('social registration UI: Google prefill, locked email, hidden password, and expired-token error path', async ({ page, context }) => {
    const issues = trackPageIssues(page);
    const socialEmail = 'google.qa.user@gmail.com';

    await page.goto(
      '/uz/register?social=google&registrationToken=fake-token-for-ui-qa&email=' +
        encodeURIComponent(socialEmail) +
        '&firstName=Aziz&lastName=Karimov',
    );

    // Subtitle switches to the social-specific copy.
    await expect(page.getByText("Google orqali kirish uchun telefon raqamingizni tasdiqlang.")).toBeVisible();

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveValue(socialEmail);
    await expect(emailInput).toHaveAttribute('readonly', '');

    await expect(page.locator('input[name="firstName"]')).toHaveValue('Aziz');
    await expect(page.locator('input[name="lastName"]')).toHaveValue('Karimov');

    // No password field / requirements checklist in social mode.
    expect(await page.locator('input[name="password"]').count()).toBe(0);
    await expect(page.getByText('Parol talablari:')).toHaveCount(0);

    // Hidden social fields are present so the submit actually reaches the
    // new backend endpoint.
    expect(await page.locator('input[name="oauthProvider"]').getAttribute('value')).toBe('google');
    expect(await page.locator('input[name="registrationToken"]').getAttribute('value')).toBe(
      'fake-token-for-ui-qa',
    );

    // Complete the phone+OTP step — the registration token is fake, so
    // this must fail cleanly with the expired-session message (proves the
    // full frontend->backend round trip through completeOAuthRegistration).
    issues.markExpected('/auth/oauth/register');
    const phone = randomPhone();
    await page.locator('input[name="phone"]').first().fill(phone);
    await page.getByRole('button', { name: 'Kod yuborish' }).click();
    const code = await readDevCode(page);
    await page.locator('input[name="code"]').fill(code);
    await page.getByRole('button', { name: "Tasdiqlash va ro'yxatdan o'tish" }).click();

    await expect(
      page.getByText("Google orqali ro'yxatdan o'tish sessiyasi muddati tugagan. Qaytadan urinib ko'ring."),
    ).toBeVisible({ timeout: 15_000 });

    // Must still be on the register page, unauthenticated — a failed
    // social registration must not create/authenticate any session.
    expect(page.url()).toContain('/register');
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'safaar_session')).toBeFalsy();

    const unexpected = issues.unexpectedResponses.filter((r) => !r.url.includes('/auth/oauth/register'));
    expect(unexpected, JSON.stringify(unexpected)).toEqual([]);
    expect(issues.consoleErrors, issues.consoleErrors.join('\n')).toEqual([]);
  });

  test('social registration UI without a lastName still renders correctly (optional field)', async ({ page }) => {
    await page.goto(
      '/uz/register?social=google&registrationToken=fake-token-2&email=' +
        encodeURIComponent('no.lastname@gmail.com') +
        '&firstName=Madina',
    );
    await expect(page.locator('input[name="email"]')).toHaveValue('no.lastname@gmail.com');
    await expect(page.locator('input[name="firstName"]')).toHaveValue('Madina');
    await expect(page.locator('input[name="lastName"]')).toHaveValue('');
    expect(await page.locator('input[name="password"]').count()).toBe(0);
  });

  test('register page ignores social params when registrationToken is missing (no accidental lock)', async ({ page }) => {
    // social=google without a registrationToken must NOT put the form into
    // social mode (register/page.tsx requires both) — otherwise a bare
    // ?social=google link could lock the email field with no way to
    // complete registration.
    await page.goto('/uz/register?social=google&email=' + encodeURIComponent('stray@example.com'));
    expect(await page.locator('input[name="password"]').count()).toBe(1);
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).not.toHaveAttribute('readonly', '');
  });
});
