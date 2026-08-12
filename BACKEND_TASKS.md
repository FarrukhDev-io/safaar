 🔥 Safaar Backend — Senior Code Review (Shafqatsiz Tahlil)
  │ O'qigan fayllar: main.ts, app.module.ts, auth/ (to'liq), common/ (to'liq), hotels/, users/, bookings/controller, uploads/controller, infrastructure/ (to'liq). Jami ~3000+ satr
  │ ko'rildi.
  ──────
  ## 1. 🔐 SECURITY — "Bu haqiqatdan production'ga chiqadimi?"

  ### 🚨 KRITIK: auth.service.ts:356 — Mass Assignment (God Object Body)
    // auth.service.ts:356–457
    async completeProfile(actor, body: Record<string, unknown>) {
      const firstName = String(body.first_name ?? body.firstName ?? ...)
      const lastName  = String(body.last_name  ?? body.lastName  ?? ...)
      const phone     = body.phone ?? body.phone_number ?? body.phoneNumber
      ...
      const passwordHash = body.password
        ? await argon2.hash(String(body.password))
        : rows[0]['password_hash'];

  body: Record<string, unknown> — bu Mass Assignment. Controller auth.controller.ts:89-95 CompleteProfileDto bilan @Body() qabul qilib, keyin body as unknown as Record<string, unknown>
  deb cast qilyapti. Ya'ni whitelist: true ValidationPipe ishlamayapti — DTO cast qilinib "teshilib" o'tkazilmoqda. Foydalanuvchi body.status = 'admin' yubora oladimi? Yo'q, lekin bu
  pattern xavfli precedent.
  ### 🚨 KRITIK: auth.controller.ts:68,80,220,226 — DTO yo'q, Record<string, unknown> himoyasiz
    // auth.controller.ts:68
    requestPartnerEmailOtp(@Body() body: Record<string, unknown>) {
    // auth.controller.ts:80
    verifyPartnerEmailOtp(@Body() body: Record<string, unknown>) {
    // auth.controller.ts:220
    partnerPhoneLogin(@Body() body: Record<string, unknown>) {
    // auth.controller.ts:226
    partnerEmailLogin(@Body() body: Record<string, unknown>) {

  4 ta auth endpoint'da class-validator umuman ishlamaydi. whitelist: true va forbidNonWhitelisted: true global qo'yilgan, lekin Record<string, unknown> bilan class validator ishlashning
  imkoni yo'q — hamma input o'tib ketadi. Bu login endpoint'lari uchun juda jiddiy zaiflik.
  ### 🚨 KRITIK: users.controller.ts:83 — addFavorite DTO yo'q
    // users.controller.ts:83
    addFavorite(@Body() body: Record<string, unknown>)
    // users.service.ts:232
    const targetType = String(body.target_type ?? 'hotel');
    const targetId   = String(body.target_id ?? body.hotel_id ?? '');

  targetType hech qanday validatsiyasiz to'g'ridan-to'g'ri SQL'ga kiradi (parametrlashtirilgan bo'lsa ham). Foydalanuvchi target_type: "'; DROP TABLE favorites; --" yubora oladi —
  parametrlash tufayli SQL injection bo'lmaydi, lekin ixtiyoriy String ma'lumotlar DB'ga kiradi.

  ### ⚠️ HIGH: auth.controller.ts:100,213,244,260,279,293 — body as unknown as Record<string, unknown>

    // auth.controller.ts:100-103
    userLogin(@Body() body: UserLoginDto) {
      return this.authService.userLogin(
        body as unknown as Record<string, unknown>,  // ← nima bu???
      );
  UserLoginDto bor, lekin service Record<string, unknown> qabul qiladi va ichida body.email, body.password deb o'zi extract qiladi. Agar DTO bo'lsa — service ham shu DTO tipini olishi
  kerak edi. Hozir DTO faqat Swagger uchun bezak bo'lib qolgan. Bu pattern butun auth controller'da 10 marta takrorlanadi.

  ### ⚠️ HIGH: auth.service.ts:1973-1987 — ENABLE_DEMO_AUTH production xavfi
    // auth.service.ts:1973-1974
    private isDemoAuthEnabled(): boolean {
      return String(process.env.ENABLE_DEMO_AUTH ?? '').toLowerCase() === 'true';
    }
  Demo rejimda dev_code javobda ochiq holda OTP kodini qaytaradi. Bu production'ga yetib borsa — istalgan kishi istalgan telefon/email bilan login qila oladi. Kodni o'zi to'g'ri, lekin:
  • Env validatsiyasida bu flag isProduction() bilan cross-check qilinmaydi
  • Swagger v1/docs production'da ham ochiq (faqat SWAGGER_ENABLED=false bilan o'chiriladi, lekin bu default true)
  ### ⚠️ HIGH: auth.service.ts:1505-1508 — Hardcoded magic string

    // auth.service.ts:1505-1508
    private async findAdminUser(login: string) {
      const email = login === 'admin' ? 'admin@safaar.uz' : login;

  'admin' username → 'admin@safaar.uz' mapping hardcode qilingan. Bu security through obscurity emas — bu backdoor. Agar admin@safaar.uz DB'da bo'lsa, admin deb login qilish ishlaydi.
  Username admin@safaar.uz o'zgarsa bu qatorni unutish mumkin.

  ### ⚠️ MEDIUM: session-store.ts:260 — Singleton yashil DB pool

    // session-store.ts:260
    export const authSessionStore = new AuthSessionStore();
  AuthSessionStore NestJS DI sistemasidan tashqarida — modul singleton sifatida export qilingan. Bu NestJS lifecycle'iga bog'liq emas, OnModuleDestroy yo'q, pool hech qachon yopilmaydi.
  Agar DB o'zgarsa (rotate credentials), pool eski ulanishlar bilan qoladi. AuthService va RolesGuard bu klassni to'g'ridan-to'g'ri import qiladi — bu hidden global state.
  ### ⚠️ MEDIUM: security.ts:170 — Hardcoded pepper
    // security.ts:170
    export function hashSecret(value: string, pepper = ''): string {
      return createHmac('sha256', pepper || 'safaar-local-pepper')
        .update(value)
        .digest('hex');
    }
  'safaar-local-pepper' — bu literal hardcoded fallback. session-store.ts:114 bu funksiyani hashSecret(input.refreshToken) deb chaqiradi — pepper bo'sh string bilan keladi, ya'ni doim
  'safaar-local-pepper' ishlatiladi. Refresh token hash'lari bu pepperga bog'liq — agar bilinib qolsa barcha session hash'larini brute-force qilish osonlashadi.
  ### ⚠️ MEDIUM: auth.dto.ts:218-228 — Verify2faDto challenge_id Optional

    // auth.dto.ts:218-228
    export class Verify2faDto {
      @IsOptional()
      @IsString()
      challenge_id?: string;  // ← Optional???

      @Length(6, 6)
      code!: string;
    }

  2FA verify'da challenge_id optional! Bu mantiqsiz — challenge_id bo'lmasa service undefined qabul qiladi va service ichida (line 920) body.chalenge_id (typo!) deb qidiradi. Bu typo
  hali ham VerifyOtpRequestDto:63da ham saqlanib turibdi: chalenge_id (bir 'l').
  ──────
  ## 2. 🏗️ ARCHITECTURE & DRY — "Spagetti NestJS"

  ### 🚨 KRITIK: auth.service.ts — 2045 satri, God Service

  2045 satr bitta service faylida. Bu NestJS'da qabul qilinmaydigan god class. Ichida bor:
  • OTP logikasi (createOtpChallenge, consumeOtp, sendOtpDemoOrFail)
  • Partner auth (3 xil login metodi)
  • Admin auth (login, 2FA setup/confirm/disable, recovery codes)
  • User auth (phone OTP, email OTP, OAuth, password reset)
  • Session management (issueTokens, signTokenPair)
  • OAuth (Google + Facebook profile fetch, upsert)
  • Lock-out mexanizmi (assertNotLockedOut, recordFailedLogin)
  Bu kamida 5-6 ta alohida service bo'lishi kerak edi: OtpService, UserAuthService, PartnerAuthService, AdminAuthService, OAuthService, SessionService.
  ### 🚨 KRITIK: Repository Pattern yo'q — Service = Repository + Business Logic

    // hotels.service.ts:83-102
    const rows = await this.pg.query(`SELECT h.id::text, h.partner_organization_id::text, ...`)
    // users.service.ts:86-91
    const sql = `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}...`
    // auth.service.ts:214-222
    const rows = await this.pg.query<DbRow>(`SELECT id::text, phone, status...`)

  Hamma service SQL to'g'ridan-to'g'ri yozadi. Repository abstraction yo'q. HotelsService, UsersService, AuthService hammasi PostgresService bilan to'g'ridan-to'g'ri gaplashadi. Bu
  layering yo'q demak — test yozish, DB o'zgartirish, query optimize qilish bir joyda amalga oshiriladi.

  ### ⚠️ HIGH: DRY buzilishi — requireActor() ko'paytirilgan
    // auth.service.ts:1240-1251 → private requireActor()
    // users.service.ts:45-53    → private requireActor()  ← KOPI!

  Ikkita alohida requireActor() private metodi — identik logika. Bu common/actor.ts yoki common/guard.ts'ga ko'chirish kerak edi. AuthService dan import qilib ishlatishdan qo'rqqanlar
  copycat route tanlaganlar.
  ### ⚠️ HIGH: session-store.ts — NestJS DI tashqarisidagi singleton

  Yuqorida aytildi. Lekin arxitektura nuqtai nazaridan ham: AuthSessionStore NestJS module sifatida ro'yxatdan o'tmagan. Bu injeksiya qilinmaydi, mock qilinmaydi, lifecycle
  boshqarilmaydi. NestJS'da bu anti-pattern.

  ### ⚠️ HIGH: auth.controller.ts:363-427 — Controller ichida Business Logic
    // auth.controller.ts:363-427
    private async startOAuth(...) {
      response.cookie(this.oauthCookieName(provider), result.state, {...})
      response.cookie(this.oauthReturnCookieName(provider), JSON.stringify({...}), {...})
      return response.redirect(302, result.redirectUrl)
    }

    private cookieValue(header: string | undefined, name: string) { ... }
    private webUserUrl(): string { return process.env.WEB_USER_URL ?? ... }
    private oauthReturnContext(value: string | undefined) { ... }
    private oauthLocale(value: unknown) { ... }
    private safeNext(value: unknown) { ... }
  Controller ichida 7 ta private metod — cookie parsing, URL construction, locale normalization. Bu hammasi Service da bo'lishi kerak. Controller faqat HTTP so'rovni qabul qilib,
  service'ga uzatishi va javobni qaytarishi kerak.
  ### ⚠️ MEDIUM: Error handling izchilsizligi

    // auth.service.ts:758-762 (userForgotPassword)
    try {
      await this.emailService.send(message);
    } catch {
      // Email yuborilmasa ham xatolik bermaymiz (security)
    }
    // auth.service.ts:1946-1960 (sendEmailOrFail)
    private async sendEmailOrFail(message) {
      try { return await this.emailService.send(message); }
      catch (error) { throw new ServiceUnavailableException(...) }
    }

  sendUserEmailOtp (line 139): sendEmailOrFail() ishlatadi → xato tashlaydi.
  userForgotPassword (line 759): emailService.send() to'g'ridan-to'g'ri → xatoni yutadi.
  sendPartnerEmailOtp (line 183): sendEmailOrFail() VA jobs.add() ikkalasi ham chaqiriladi (line 191) — ya'ni email ham direct, ham queue orqali yuborilishi mumkin!
  ──────
  ## 3. ⚡ PERFORMANCE & DATABASE
  ### 🚨 KRITIK: users.service.ts:161 — SELECT * FROM bookings

    // users.service.ts:161
    const sql = `SELECT * FROM bookings WHERE user_id = $1 ORDER BY ${sortCol} ...`;
  SELECT * — bookings jadvalida nechta ustun bor? 20? 30? Foydalanuvchiga hamma ustunlar kerakmi? Yoq. Bu over-fetching. Katta loyihalarda SELECT * qat'iyan taqiqlanadi.
  ### 🚨 KRITIK: hotels.service.ts:282-294 — Pagination yo'q
    // hotels.service.ts:282-294
    async reviews(id: string) {
      return this.pg.query(`
        SELECT r.id::text, ... FROM reviews r
        WHERE r.target_type = 'hotel' AND r.target_id = $1 AND r.status = 'published'
        ORDER BY r.created_at DESC`   // ← LIMIT yo'q!!!
      [id]);
    }
  Mehmonxona 10,000 ta review'ga ega bo'lsa? Server hammani qaytaradi. Bu DoS zaiflik — bitta so'rov serverini tiqvora oladi.
  ### ⚠️ HIGH: users.service.ts:198-205 — Bonus ledger hardcoded LIMIT 100
    // users.service.ts:198-205
    const ledger = await this.pg.query(
      `SELECT ... FROM user_bonus_ledger WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 100`,
    );

  LIMIT 100 hardcode. Agar foydalanuvchining 50,000 ta bonus operatsiyasi bo'lsa? Pagination yo'q, total yo'q, page yo'q. Frontend 100 tadan keyingisini ko'ra olmaydi.

  ### ⚠️ HIGH: hotels.service.ts:104-132 — N+1 qisman hal, lekin...

    // hotels.service.ts:104-106
    const listingData = await this.loadListingData(
      rows.map((row) => String((row as Record<string, unknown>).id)),
    );
  loadListingData() 3 ta parallel query (Promise.all) ishlaydi — bu yaxshi! Ammo findOne() ichida (line 173-181) ham loadListingData() + alohida roomRows so'rovi = 4 ta so'rov ketma-ket.
  Bu Promise.all bilan parallel qilinishi mumkin edi.

  ### ⚠️ HIGH: hotels.service.ts:371-384 — map() findAll() ni chaqiradi — kesh + mapping keraksiz

    // hotels.service.ts:371-384
    async map(query: QueryLike) {
      const hotels = (await this.findAll(query)) as { items: Array<...> };
      return hotels.items.map((hotel) => ({
        id, slug, name, latitude, longitude, rating_average, min_price
      }));
    }

  findAll() to'liq hotel ma'lumotlarini (amenities, images, descriptions) keshlab qaytaradi. map() esa faqat 6 ta maydonni ishlatadi. Ya'ni xarita uchun har safar images va amenities ham
  yuklanadi, keshlanadi — lekin ular map() natijasida yo'q. Bu behuda resurs sarfi.

  ### ⚠️ MEDIUM: postgres.service.ts:65-87 — Retry loop ishlash vaqtida bloklaydi
    // postgres.service.ts:65-87
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try { ... }
      catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }

  Retryable xatoda 300ms + 600ms = 900ms kutiladi. Bu Node.js event loop'ni bloklash demak emas (async), lekin so'rov 900ms "sarflaydi". Agar DB muammosi bo'lsa — barcha parallel
  so'rovlar shu kutishda yotadi, connection pool tugaydi.
  ──────
  ## 4. 🌐 API DESIGN & CONTRACTS

  ### ⚠️ HIGH: Nomuvofiq Response Formatlar
    // http-error.filter.ts:113-122 → {statusCode, code, message, fields, meta}
    // http-error.filter.ts:125-135 → {success: false, error: {...}, meta}
    // users.service.ts:240-246 → {id, user_id, target_type, target_id, created_at}
    // hotels.service.ts:134-141 → {items, total, page, limit, total_pages}
    // auth.service.ts:656-668 → {accessToken, refreshToken, organization_id, organizationId, ...}

  organization_id va organizationId bir javobda ikkalasi ham bor (line 664-665)! Nima bu? Frontend organization_id ishlatadimi yoki organizationId? Bu API contract kafolati yo'q.

  ### ⚠️ HIGH: HTTP Metodlar noto'g'ri

    // bookings.controller.ts:64-69
    @Post('lookup')    // ← GET bo'lishi kerak (ma'lumot o'qish)
    @HttpCode(200)
    lookupBooking(@Body() dto: LookupBookingDto)
  Bron qidirish uchun POST + @HttpCode(200) — bu REST anti-pattern. Sababi body bilan ma'lumot yuboring deyilgan, lekin bu idempotent, caching uchun GET bo'lishi kerak. Ehtimol @Body()
  orqali nozik ma'lumot (email) yuborishni xohlashgan — bu tushuniladi, lekin arxitektura jihatidan noto'g'ri.

  ### ⚠️ HIGH: hotels.controller.ts — Swagger annotatsiyalari yo'q

    // hotels.controller.ts
    @ApiTags('hotels')
    @Controller('hotels')
    export class HotelsController {
      @Get()
      findAll(@Query() query: Record<string, string | undefined>) { ... }
  @ApiResponse(), @ApiQuery() annotatsiyalari yo'q. query: Record<string, string | undefined> uchun Swagger hech narsa ko'rsatmaydi — API hujjat to'liq bo'sh.
  ### ⚠️ MEDIUM: Versioning noto'g'ri amalga oshirilgan
    // main.ts:28,77
    const apiPrefix = config.get<string>('API_PREFIX', 'v1');
    app.setGlobalPrefix(apiPrefix);
  URL versioning (/v1/) bor, lekin bu bitta global prefix — /v1/hotels, /v1/auth. NestJS enableVersioning() bilan proper versioning (@Version('1')) ishlatilmagan. Kelgusida /v2/
  chiqarganda butun routing qayta yoziladi. main.ts:70-75da /api/ prefix'ni v1'ga manual rewrite qilish esa — bu masxaralik. /api/ → /${apiPrefix}/ — bu ikkita prefix tizimini qo'llab-
  quvvatlash uchun middleware yozilgan.
  ──────
  ## 5. 🚀 CACHING & SCALABILITY
  ### ✅ Yaxshi tomoni: Redis + Memory Fallback

  cache.service.ts — Redis yo'q bo'lsa in-memory fallback ishlatadi, getOrSet() race condition'ni inFlight Map bilan oldini oladi — bu yaxshi ishlangan.

  ### ✅ Yaxshi tomoni: BullMQ bor, background jobs ishlayapti

  job-queue.service.ts — BullMQ bilan retry, exponential backoff, idempotency key bor.

  ### 🚨 KRITIK: sendPartnerEmailOtp — Email ikki marta yuboriladi!
    // auth.service.ts:183-193
    const delivery = await this.sendEmailOrFail(message);  // ← 1-marta direct
    if (!delivery.accepted) { throw ... }

    await this.jobs.add(JOBS.SEND_EMAIL, message, {         // ← 2-marta queue orqali!!!
      idempotencyKey: `partner-login-email:${response.challenge_id}`,
    });

  LINE 183 va LINE 191 — partner login email'i ham direct, ham queue'ga qo'shiladi. Agar direct yuborilsa → queue ham ishlaydi → partner 2 ta email oladi. Bu bug.
  ### ⚠️ HIGH: Rate Limiting umumiy, auth'ga juda "yumshoq"
    // app.module.ts:49-54
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])  // global: 120/min
    // auth.controller.ts:49 → limit: 5, ttl: 60_000  (OTP)
    // auth.controller.ts:55 → limit: 10, ttl: 60_000 (verify)

  Global 120 req/min — bu API gateway yoki bot uchun mo'ljallangan? OTP endpoint'lar alohida 5/min limitlangan — bu yaxshi. Ammo auth/refresh (line 292) va auth/partner/login uchun hech
  qanday alohida limit yo'q — global 120 ta ishlaydi. Refresh token brute force'si 120 urinish/min.

  ### ⚠️ HIGH: File Upload — Content-Type validatsiya yo'q

    // uploads.controller.ts:29-31
    @Post('images')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))

  5MB limit bor — yaxshi. Lekin mimetype validatsiya yo'q. Foydalanuvchi image.php ni image/jpeg deb yuborsa? UploadsService tomonida tekshirilayotgan bo'lishi mumkin, ammo controller
  darajasida fileFilter mutlaqo yo'q.

  ### ⚠️ MEDIUM: Cities/Categories keshlanmagan

  Katalog (cities, amenities, room types) — tez-tez o'zgarmaydigan ma'lumotlar. hotels.service.ts:307-337 da loadListingData() doim hotel_translations, media_files, hotel_amenities dan
  o'qiydi — bu ma'lumotlar kesh qilinmaydi. findAll() natijasi keshlanadi (line 15-17), lekin har yangi query kombinatsiyasi yangi kesh yozadi.
  ──────
  ## 📊 Xulosaviy Reyting

   Soha                                                    | Baho                                                    | Asosiy muammo
  ---------------------------------------------------------|---------------------------------------------------------|--------------------------------------------------------------------
   Security                                                | 5/10                                                    | Record<unknown> DTO, dual email bug, hardcoded magic strings
   Architecture                                            | 4/10                                                    | 2045-satrli God Service, Repository pattern yo'q, NestJS DI bypass
   Performance                                             | 6/10                                                    | SELECT *, reviews'da LIMIT yo'q, keraksiz over-fetch
   API Design                                              | 5/10                                                    | Nomuvofiq format, ikki xil camelCase/snake_case, Swagger bo'sh
   Caching                                                 | 7/10                                                    | Redis/memory fallback yaxshi, BullMQ bor, lekin dual-send bug bor

  Umumiy: 5.4/10 — Poydevor qo'yilgan (Argon2, JWT rotation, session store), lekin yetuklik yo'q. Auth service parcha-parcha bo'lishi kerak, DTO'lar to'liq bo'lishi kerak.
  ──────
  "Endi tuzat" desangiz, tartib bo'yicha boshlaymiz:

  1. Eng kritik: Record<string, unknown> DTO'larini to'g'ri tipli DTO'larga o'tkazish
  2. Bug: sendPartnerEmailOtp dual-send
  3. Performance: reviews() ga pagination, SELECT * o'chirish
  4. Architecture: AuthService ni parchalash, authSessionStore ni NestJS DI'ga kiritish*