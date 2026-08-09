import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = dirname(__dirname);
const srcRoot = join(backendRoot, 'src');
const outDir = __dirname;

const collectionFile = join(outDir, 'safaar_API.postman_collection.json');
const environmentFile = join(outDir, 'safaar_Local.postman_environment.json');

const controllerFiles = walk(srcRoot).filter((file) =>
  file.endsWith('.controller.ts'),
);

const routes = controllerFiles.flatMap(readControllerRoutes).sort((left, right) =>
  `${left.group}:${left.path}:${left.method}`.localeCompare(
    `${right.group}:${right.path}:${right.method}`,
  ),
);

const collection = {
  info: {
    name: 'safaar Backend API',
    description:
      'Generated from NestJS controllers. Run auth requests first to populate tokens, then run the rest of the folders.',
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:4000/v1' },
    { key: 'paymentWebhookSecret', value: 'safaar-development-payment-secret' },
  ],
  event: [
    {
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: [
          'pm.test("status is not 5xx", function () {',
          '  pm.expect(pm.response.code).to.be.below(500);',
          '});',
          'pm.test("response time is below 10s", function () {',
          '  pm.expect(pm.response.responseTime).to.be.below(10000);',
          '});',
          'if (pm.response.text()) {',
          '  pm.test("response is JSON", function () {',
          '    pm.response.to.be.json;',
          '  });',
          '}',
        ],
      },
    },
  ],
  item: Object.entries(groupBy(routes, (route) => route.group)).map(
    ([group, groupRoutes]) => ({
      name: title(group),
      item: groupRoutes.map(toPostmanItem),
    }),
  ),
};

const environment = {
  name: 'safaar Local',
  values: [
    variable('baseUrl', 'http://localhost:4000/v1'),
    variable('phone', '+998901234567'),
    variable('userOtpChallengeId', ''),
    variable('userOtpCode', ''),
    variable('partnerEmail', 'partner@safaar.uz'),
    variable('partnerPassword', 'password'),
    variable('adminUsername', 'admin'),
    variable('adminPassword', 'admin'),
    variable('admin2faChallengeId', ''),
    variable('admin2faCode', '000000'),
    variable('accessToken', ''),
    variable('refreshToken', ''),
    variable('userAccessToken', ''),
    variable('userRefreshToken', ''),
    variable('partnerAccessToken', ''),
    variable('partnerRefreshToken', ''),
    variable('adminAccessToken', ''),
    variable('adminRefreshToken', ''),
    variable('partnerApiKey', ''),
    variable('paymentWebhookSecret', 'safaar-development-payment-secret'),
    variable('userId', 'demo-user-id'),
    variable('partnerId', 'demo-partner-org-id'),
    variable('adminUserId', 'demo-admin-id'),
    variable('hotelId', 'hotel-samarkand-plaza'),
    variable('hotelSlugOrId', 'hotel-samarkand-plaza'),
    variable('roomId', 'room-standard-1'),
    variable('tripId', 'trip-tashkent-samarkand-001'),
    variable('bookingId', ''),
    variable('paymentId', ''),
    variable('refundId', ''),
    variable('reviewId', ''),
    variable('ticketId', ''),
    variable('notificationId', ''),
    variable('pushTokenId', ''),
    variable('uploadId', ''),
    variable('exportId', ''),
    variable('apiKeyId', ''),
    variable('webhookId', ''),
    variable('cmsResource', 'news'),
    variable('cmsEntryId', ''),
    variable('promoId', ''),
    variable('withdrawalId', ''),
    variable('vehicleId', 'vehicle-demo'),
    variable('routeId', 'route-tashkent-samarkand'),
    variable('deliveryId', ''),
    variable('imageId', '0'),
    variable('messageId', ''),
    variable('provider', 'click'),
    variable('slug', 'demo'),
    variable('id', ''),
    variable('action', 'close'),
    variable('settingsGroup', 'general'),
    variable('adminRoleId', 'SUPPORT_ADMIN'),
  ],
};

mkdirSync(outDir, { recursive: true });
writeFileSync(collectionFile, `${JSON.stringify(collection, null, 2)}\n`);
writeFileSync(environmentFile, `${JSON.stringify(environment, null, 2)}\n`);

console.log(`Generated ${relative(process.cwd(), collectionFile)}`);
console.log(`Generated ${relative(process.cwd(), environmentFile)}`);
console.log(`Routes: ${routes.length}`);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function readControllerRoutes(file) {
  const source = readFileSync(file, 'utf8');
  const controllerMatch = source.match(/@Controller\(([^)]*)\)/);
  const bases = parseDecoratorPath(controllerMatch?.[1] ?? '');
  const moduleName = basename(file).replace('.controller.ts', '');
  const routeMatches = [...source.matchAll(/@(Get|Post|Patch|Put|Delete)\(([^)]*)\)/g)];

  return routeMatches.flatMap((match) => {
    const method = match[1].toUpperCase();
    const routePaths = parseDecoratorPath(match[2] ?? '');
    return bases.flatMap((basePath) =>
      routePaths.map((routePath) => {
        const path = normalizePath(basePath, routePath);
        return {
          method,
          path,
          originalPath: path,
          group: moduleName,
          source: relative(backendRoot, file),
        };
      }),
    );
  });
}

function parseDecoratorPath(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return [''];
  }

  if (trimmed.startsWith('[')) {
    const matches = [...trimmed.matchAll(/['"`]([^'"`]*)['"`]/g)].map(
      (match) => match[1],
    );
    return matches.length ? matches : [''];
  }

  const stringMatch = trimmed.match(/^['"`]([^'"`]*)['"`]$/);
  return [stringMatch?.[1] ?? ''];
}

function normalizePath(basePath, routePath) {
  return `/${[basePath, routePath]
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')}`.replace(/\/+/g, '/');
}

function toPostmanItem(route) {
  const body = sampleBody(route);
  const item = {
    name: `${route.method} ${route.originalPath}`,
    request: {
      method: route.method,
      header: headersFor(route, body),
      url: {
        raw: `{{baseUrl}}${postmanPath(route.path)}`,
        host: ['{{baseUrl}}'],
        path: postmanPath(route.path).replace(/^\//, '').split('/'),
      },
      description: `Source: ${route.source}`,
    },
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: testsFor(route) } }],
  };

  const auth = authFor(route);
  if (auth) {
    item.request.auth = auth;
  }

  const prerequest = prerequestFor(route);
  if (prerequest.length) {
    item.event.unshift({
      listen: 'prerequest',
      script: { type: 'text/javascript', exec: prerequest },
    });
  }

  if (body !== undefined) {
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: 'json' } },
    };
  }

  return item;
}

function authFor(route) {
  const token = tokenVariable(route);
  if (!token) {
    return undefined;
  }

  return {
    type: 'bearer',
    bearer: [{ key: 'token', value: `{{${token}}}`, type: 'string' }],
  };
}

function tokenVariable(route) {
  if (isPublic(route)) {
    return undefined;
  }
  if (route.path.startsWith('/partner-api')) {
    return undefined;
  }
  if (route.path.startsWith('/admin')) {
    return 'adminAccessToken';
  }
  if (route.path.startsWith('/partner') || route.path.startsWith('/partners')) {
    return 'partnerAccessToken';
  }
  if (
    route.path.startsWith('/me') ||
    route.path === '/auth/user/complete-profile' ||
    route.path.startsWith('/bookings') ||
    route.path.startsWith('/payments') ||
    route.path.startsWith('/refunds') ||
    route.path.startsWith('/uploads') ||
    route.path.startsWith('/reviews') ||
    route.path.startsWith('/support') ||
    route.path.startsWith('/notifications') ||
    route.path.startsWith('/exports') ||
    route.path.startsWith('/promos')
  ) {
    return 'userAccessToken';
  }
  if (route.path.startsWith('/auth/admin/2fa')) {
    return 'adminAccessToken';
  }
  if (
    route.path.startsWith('/auth/social-accounts') ||
    route.path.startsWith('/auth/logout') ||
    route.path.startsWith('/auth/sessions') ||
    route.path.startsWith('/auth/logout-all')
  ) {
    return 'accessToken';
  }

  return undefined;
}

function headersFor(route, body) {
  const headers = [];
  if (body !== undefined) {
    headers.push({ key: 'Content-Type', value: 'application/json' });
  }
  if (route.path.startsWith('/partner-api')) {
    headers.push({ key: 'x-api-key', value: '{{partnerApiKey}}' });
  }
  if (route.path.startsWith('/webhooks/')) {
    headers.push({
      key: 'x-safaar-mock-signature',
      value: '{{paymentWebhookSignature}}',
    });
  }
  return headers;
}

function isPublic(route) {
  if (route.path.startsWith('/health')) {
    return true;
  }
  if (route.path.startsWith('/catalog')) {
    return true;
  }
  if (route.path.startsWith('/cms')) {
    return route.method === 'GET';
  }
  if (route.path === '/settings/public') {
    return true;
  }
  if (route.path.startsWith('/hotels') && route.method === 'GET') {
    return true;
  }
  if (route.path.startsWith('/bus-routes') || route.path.startsWith('/bus-trips')) {
    return route.method === 'GET' || route.path.endsWith('/quote');
  }
  if (route.path.startsWith('/bus-companies') && route.method === 'GET') {
    return true;
  }
  if (route.path.startsWith('/webhooks/')) {
    return true;
  }
  if (!route.path.startsWith('/auth')) {
    return false;
  }

  return ![
    '/auth/user/complete-profile',
    '/auth/social-accounts',
    '/auth/logout',
    '/auth/logout-all',
    '/auth/sessions',
    '/auth/user/logout',
    '/auth/partner/logout',
    '/auth/admin/logout',
    '/auth/admin/2fa/setup',
    '/auth/admin/2fa/confirm',
    '/auth/admin/2fa/disable',
  ].some((protectedPath) => route.path.startsWith(protectedPath));
}

function sampleBody(route) {
  if (['GET', 'DELETE'].includes(route.method)) {
    return undefined;
  }

  const path = route.path;
  if (path.endsWith('/send-otp') || path.endsWith('/otp/request')) {
    return { phone: '{{phone}}' };
  }
  if (path.endsWith('/verify-otp')) {
    return {
      phone: '{{phone}}',
      challenge_id: '{{userOtpChallengeId}}',
      code: '{{userOtpCode}}',
    };
  }
  if (path.endsWith('/otp/verify')) {
    return {
      phone: '{{phone}}',
      challenge_id: '{{userOtpChallengeId}}',
      code: '{{userOtpCode}}',
    };
  }
  if (path.endsWith('/partner/login')) {
    return { email: '{{partnerEmail}}', password: '{{partnerPassword}}' };
  }
  if (path.endsWith('/admin/login')) {
    return { username: '{{adminUsername}}', password: '{{adminPassword}}' };
  }
  if (path.endsWith('/admin/verify-2fa')) {
    return {
      challenge_id: '{{admin2faChallengeId}}',
      chalenge_id: '{{admin2faChallengeId}}',
      code: '{{admin2faCode}}',
    };
  }
  if (path.endsWith('/refresh')) {
    return { refresh_token: '{{refreshToken}}' };
  }
  if (path.endsWith('/complete-profile') || path === '/me') {
    return {
      first_name: 'Demo',
      last_name: 'User',
      email: 'demo.user@safaar.uz',
      preferred_language: 'uz',
    };
  }
  if (path === '/bookings/hotel') {
    return {
      hotel_id: '{{hotelId}}',
      room_id: '{{roomId}}',
      check_in: '2026-07-10',
      check_out: '2026-07-11',
      rooms: 1,
      adults: 1,
      children: 0,
      payment_method: 'click',
    };
  }
  if (path === '/bookings/bus') {
    return {
      trip_id: '{{tripId}}',
      seats: ['1'],
      passengers: [{ full_name: 'Demo User', phone: '{{phone}}' }],
      payment_method: 'click',
    };
  }
  if (path.includes('/quote')) {
    return { seats: ['1'], rooms: 1, adults: 1, children: 0 };
  }
  if (path.includes('/payments/') && path.endsWith('/create')) {
    return { provider: 'click' };
  }
  if (path.startsWith('/webhooks/')) {
    return {
      booking_id: '{{bookingId}}',
      transaction_id: 'postman-{{$timestamp}}',
      amount: 45000000,
      currency: 'UZS',
    };
  }
  if (path === '/refunds') {
    return { booking_id: '{{bookingId}}', reason: 'Postman test' };
  }
  if (path === '/uploads/images') {
    return { filename: 'image.png', mime_type: 'image/png', size: 1024 };
  }
  if (path === '/uploads/documents') {
    return { filename: 'document.pdf', mime_type: 'application/pdf', size: 2048 };
  }
  if (path === '/uploads/presign') {
    return { type: 'image', filename: 'image.png', mime_type: 'image/png', size: 1024 };
  }
  if (path === '/reviews') {
    return {
      booking_id: '{{bookingId}}',
      target_type: 'hotel',
      target_id: '{{hotelId}}',
      rating: 5,
      body: 'Postman test review',
    };
  }
  if (path.endsWith('/reply') || path.endsWith('/messages')) {
    return { body: 'Postman test message' };
  }
  if (path === '/support/tickets') {
    return { subject: 'Postman test ticket', priority: 'normal' };
  }
  if (path.endsWith('/favorites')) {
    return { target_type: 'hotel', target_id: '{{hotelId}}' };
  }
  if (path.endsWith('/notifications/preferences')) {
    return { sms: true, email: true, push: true, in_app: true };
  }
  if (path.endsWith('/push-tokens')) {
    return { token: 'postman-push-token', platform: 'web' };
  }
  if (path.endsWith('/validate')) {
    return { code: 'WELCOME10', amount: 100000 };
  }
  if (path.includes('/users/') && path.endsWith('/status')) {
    return { status: 'active' };
  }
  if (path.includes('/bonus-adjustment')) {
    return { amount: 1000, reason: 'Postman test' };
  }
  if (path.includes('/message')) {
    return { title: 'Postman', body: 'Test message' };
  }
  if (path.includes('/partners/') && path.endsWith('/reject')) {
    return { reason: 'Postman test' };
  }
  if (path.includes('/partners/') && path.endsWith('/request-information')) {
    return { reason: 'Postman test' };
  }
  if (path.includes('/partners/') && path.endsWith('/commission')) {
    return { rate: 12 };
  }
  if (path.includes('/partners/') && path.endsWith('/adjustment')) {
    return { amount: 1000, reason: 'Postman test' };
  }
  if (path.includes('/hotels/') && path.endsWith('/visibility')) {
    return { visible: true };
  }
  if (path.includes('/bus-companies/') && path.endsWith('/status')) {
    return { status: 'active' };
  }
  if (path.includes('/bookings/') && path.endsWith('/cancel')) {
    return { reason: 'Postman test cancel' };
  }
  if (path.includes('/bookings/') && path.endsWith('/status-action')) {
    return { status: 'confirmed' };
  }
  if (path.includes('/refunds/') && path.endsWith('/reject')) {
    return { reason: 'Postman test' };
  }
  if (path.includes('/withdrawals/') && path.endsWith('/reject')) {
    return { reason: 'Postman test' };
  }
  if (path.includes('/cms/') && path.endsWith('/translations')) {
    return { language: 'uz', title: 'Postman title', body: 'Postman body' };
  }
  if (path.includes('/cms/')) {
    return { title: { uz: 'Postman title' }, body: { uz: 'Postman body' }, status: 'draft' };
  }
  if (path === '/admin/promos') {
    return { code: 'POSTMAN10', discount_type: 'percent', value: 10 };
  }
  if (path.includes('/support/tickets/') && path.includes('/:action')) {
    return { body: 'Postman action' };
  }
  if (path === '/admin/notifications/broadcast') {
    return { title: 'Postman broadcast', body: 'Test', audience: 'all' };
  }
  if (path === '/admin/admin-users') {
    return { email: 'operator@safaar.uz', role: 'SUPPORT_ADMIN', full_name: 'Operator' };
  }
  if (path.includes('/admin-users/')) {
    return { status: 'active', role: 'SUPPORT_ADMIN' };
  }
  if (path.includes('/roles/') && path.endsWith('/permissions')) {
    return { permissions: ['users:read'] };
  }
  if (path.includes('/settings/providers/')) {
    return { enabled: false };
  }
  if (path.includes('/settings/')) {
    return { value: 'postman-test' };
  }
  if (path === '/partner/team') {
    return { email: 'operator@partner.safaar.uz', role: 'operator' };
  }
  if (path.includes('/partner/team/')) {
    return { role: 'operator', status: 'active' };
  }
  if (path === '/partner/documents' || path === '/partners/documents') {
    return { type: 'license', file_id: '{{uploadId}}' };
  }
  if (path.endsWith('/profile')) {
    return { brand_name: 'safaar Demo Partner', phone: '{{phone}}', address: 'Postman' };
  }
  if (path.endsWith('/hotels')) {
    return { name: 'Postman Hotel', city_id: 'city-samarkand', address: 'Postman street', stars: 4 };
  }
  if (path.includes('/rooms')) {
    return { room_type_id: 'standard', code: 'PM', name: 'Postman room', total_inventory: 1, base_price: 450000 };
  }
  if (path.includes('/inventory')) {
    return { items: [{ room_id: '{{roomId}}', date: '2026-07-10', total_count: 1 }] };
  }
  if (path.includes('/blackout-dates')) {
    return { dates: ['2026-07-10'] };
  }
  if (path.endsWith('/vehicles')) {
    return { name: 'Postman Bus', plate_number: '01PMA001', seats_count: 45 };
  }
  if (path.includes('/seat-layout')) {
    return { layout: [{ seat: '1' }] };
  }
  if (path.endsWith('/routes')) {
    return { from_city_id: 'city-tashkent', to_city_id: 'city-samarkand', duration_minutes: 270 };
  }
  if (path.endsWith('/trips')) {
    return {
      route_id: '{{routeId}}',
      from_city_id: 'city-tashkent',
      to_city_id: 'city-samarkand',
      departure_at: '2026-07-10T04:00:00.000Z',
      base_price: 120000,
    };
  }
  if (path.includes('/withdrawals')) {
    return { amount: 100000 };
  }
  if (path.includes('/exports/')) {
    return { format: 'csv' };
  }
  if (path.endsWith('/api-keys')) {
    return { name: 'Postman API key', scopes: ['bookings:read', 'bookings:write'] };
  }
  if (path.endsWith('/webhooks')) {
    return { url: 'https://example.com/safaar/webhook', events: ['booking.created'] };
  }
  if (path.startsWith('/partner-api/bookings/') && path.endsWith('/status')) {
    return { status: 'completed' };
  }
  if (path === '/partner-api/webhooks/test') {
    return { event: 'booking.created' };
  }

  return {};
}

function testsFor(route) {
  const lines = [
    'function unwrap(value) { return value && value.success === true && value.data !== undefined ? value.data : value; }',
    'let payload = null;',
    'try { payload = pm.response.text() ? unwrap(pm.response.json()) : null; } catch (error) { payload = null; }',
  ];

  if (route.path === '/auth/user/send-otp') {
    lines.push(
      'if (payload) {',
      '  pm.environment.set("userOtpChallengeId", payload.challenge_id || "");',
      '  if (payload.dev_code) pm.environment.set("userOtpCode", payload.dev_code);',
      '}',
    );
  }

  if (route.path === '/auth/user/verify-otp') {
    captureTokens(lines, 'user');
  }
  if (route.path === '/auth/partner/login') {
    captureTokens(lines, 'partner');
    lines.push('if (payload && payload.organization_id) pm.environment.set("partnerId", payload.organization_id);');
  }
  if (route.path === '/auth/admin/login') {
    captureTokens(lines, 'admin');
    lines.push('if (payload && payload.challenge_id) pm.environment.set("admin2faChallengeId", payload.challenge_id);');
  }
  if (route.path === '/auth/admin/verify-2fa') {
    captureTokens(lines, 'admin');
  }
  if (route.path.endsWith('/refresh')) {
    captureTokens(lines, undefined);
  }

  if (route.path === '/bookings/hotel' || route.path === '/bookings/bus') {
    lines.push(
      'if (payload && payload.booking) pm.environment.set("bookingId", payload.booking.id);',
      'if (payload && payload.payment) pm.environment.set("paymentId", payload.payment.id);',
    );
  }

  const idCaptures = [
    ['/refunds', 'refundId'],
    ['/reviews', 'reviewId'],
    ['/support/tickets', 'ticketId'],
    ['/uploads/images', 'uploadId'],
    ['/uploads/documents', 'uploadId'],
    ['/partner/api-keys', 'apiKeyId'],
    ['/partners/api-keys', 'apiKeyId'],
    ['/partner/webhooks', 'webhookId'],
    ['/partners/webhooks', 'webhookId'],
    ['/partner/hotels', 'hotelId'],
    ['/partners/hotels', 'hotelId'],
    ['/admin/promos', 'promoId'],
    ['/admin/cms/:resource', 'cmsEntryId'],
  ];
  for (const [path, variableName] of idCaptures) {
    if (route.method === 'POST' && route.path === path) {
      lines.push(`if (payload && payload.id) pm.environment.set("${variableName}", payload.id);`);
    }
  }

  if (route.path.endsWith('/api-keys') && route.method === 'POST') {
    lines.push(
      'if (payload && payload.api_key) pm.environment.set("partnerApiKey", payload.api_key);',
    );
  }

  return lines;
}

function captureTokens(lines, namespace) {
  const accessName = namespace ? `${namespace}AccessToken` : 'accessToken';
  const refreshName = namespace ? `${namespace}RefreshToken` : 'refreshToken';
  lines.push(
    'if (payload && payload.accessToken) {',
    `  pm.environment.set("${accessName}", payload.accessToken);`,
    '  pm.environment.set("accessToken", payload.accessToken);',
    '}',
    'if (payload && payload.refreshToken) {',
    `  pm.environment.set("${refreshName}", payload.refreshToken);`,
    '  pm.environment.set("refreshToken", payload.refreshToken);',
    '}',
  );
}

function prerequestFor(route) {
  if (!route.path.startsWith('/webhooks/')) {
    return [];
  }

  const parts = route.path.split('/').filter(Boolean);
  const provider = parts[1] === 'payment' ? '{{provider}}' : parts[1];
  const event = parts[1] === 'payment' ? 'callback' : (parts[2] ?? 'callback');
  return [
    'function stableStringify(value) {',
    '  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";',
    '  if (value && typeof value === "object") {',
    '    return "{" + Object.keys(value).sort().map(function (key) {',
    '      return JSON.stringify(key) + ":" + stableStringify(value[key]);',
    '    }).join(",") + "}";',
    '  }',
    '  return JSON.stringify(value);',
    '}',
    'function base64Url(wordArray) {',
    '  return CryptoJS.enc.Base64.stringify(wordArray).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");',
    '}',
    `const provider = "${provider}".replace("{{provider}}", pm.environment.get("provider") || "click");`,
    `const event = "${event}";`,
    'const body = pm.request.body && pm.request.body.raw ? JSON.parse(pm.request.body.raw) : {};',
    'const eventId = body.event_id || body.eventId || body.transaction_id || body.id || body.booking_id || body.bookingId || "";',
    'const eventKey = `${provider}:${event}:${eventId}`;',
    'const secret = pm.environment.get("paymentWebhookSecret") || pm.collectionVariables.get("paymentWebhookSecret");',
    'const canonical = `${provider}.${event}.${eventKey}.${stableStringify(body)}`;',
    'const signature = base64Url(CryptoJS.HmacSHA256(canonical, secret));',
    'pm.environment.set("paymentWebhookSignature", signature);',
  ];
}

function postmanPath(path) {
  const replacements = [
    ['payments/:bookingId', 'payments/{{bookingId}}'],
    ['users/:id', 'users/{{userId}}'],
    ['partners/:id', 'partners/{{partnerId}}'],
    ['hotels/:slugOrId', 'hotels/{{hotelSlugOrId}}'],
    ['hotels/:id', 'hotels/{{hotelId}}'],
    ['bus-trips/:id', 'bus-trips/{{tripId}}'],
    ['bus-companies/:id', 'bus-companies/{{partnerId}}'],
    ['bookings/:id', 'bookings/{{bookingId}}'],
    ['payments/:id', 'payments/{{paymentId}}'],
    ['refunds/:id', 'refunds/{{refundId}}'],
    ['reviews/:id', 'reviews/{{reviewId}}'],
    ['support/tickets/:id', 'support/tickets/{{ticketId}}'],
    ['notifications/:id', 'notifications/{{notificationId}}'],
    ['push-tokens/:id', 'push-tokens/{{pushTokenId}}'],
    ['exports/:id', 'exports/{{exportId}}'],
    ['api-keys/:id', 'api-keys/{{apiKeyId}}'],
    ['webhooks/:id', 'webhooks/{{webhookId}}'],
    ['finance/documents/:id', 'finance/documents/{{exportId}}'],
    ['vehicles/:id', 'vehicles/{{vehicleId}}'],
    ['routes/:id', 'routes/{{routeId}}'],
    ['trips/:id', 'trips/{{tripId}}'],
    ['rooms/:roomId', 'rooms/{{roomId}}'],
    ['images/:imageId', 'images/{{imageId}}'],
    ['messages/:messageId', 'messages/{{messageId}}'],
    ['deliveries/:deliveryId', 'deliveries/{{deliveryId}}'],
    ['cms/:resource', 'cms/{{cmsResource}}'],
    ['promos/:id', 'promos/{{promoId}}'],
    ['withdrawals/:id', 'withdrawals/{{withdrawalId}}'],
    ['admin-users/:id', 'admin-users/{{adminUserId}}'],
    ['roles/:id', 'roles/{{adminRoleId}}'],
    ['settings/:group', 'settings/{{settingsGroup}}'],
    ['providers/:provider', 'providers/{{provider}}'],
  ];

  return replacements
    .reduce((current, [from, to]) => current.replace(from, to), path)
    .replace(/:action/g, '{{action}}')
    .replace(/:group/g, '{{settingsGroup}}')
    .replace(/:resource/g, '{{cmsResource}}')
    .replace(/:provider/g, '{{provider}}')
    .replace(/:slug/g, '{{slug}}')
    .replace(/:id/g, '{{id}}');
}

function variable(key, value) {
  return { key, value, type: 'default', enabled: true };
}

function groupBy(values, keyFn) {
  return values.reduce((accumulator, value) => {
    const key = keyFn(value);
    accumulator[key] ??= [];
    accumulator[key].push(value);
    return accumulator;
  }, {});
}

function title(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
