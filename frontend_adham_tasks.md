# Admin panel uchun vazifa: Admin 2FA (ikki bosqichli tasdiqlash)

**Assalomu alaykum Frontend Developer!**

Backend tomonda admin panel uchun 2FA (Google Authenticator/Authy orqali) to'liq ishlab chiqildi va production'da tekshirilib, ishlayotgani tasdiqlandi. Lekin admin panel frontend'ida bunga mos hech qanday interfeys yo'q.

## ⚠️ Muhim — bu shunchaki "yetishmayotgan feature" emas

Hozirgi login sahifasi (`app/(auth)/login/page.tsx`) va `AdminApi.login()` (`lib/api/admin-api.ts`) faqat `data.accessToken` kelishini kutadi. Agar kelajakda (yoki hozir) biror admin akkauntda 2FA yoqilgan bo'lsa, backend token qaytarmaydi — o'rniga `{ requires_2fa: true, challenge_id, ... }` qaytaradi. Hozirgi kodda bu holat uchun faqat:

```ts
if (data.requires_2fa) {
  throw new Error('2FA kerak');
}
```

— ya'ni admin ekranda faqat "2FA kerak" degan xato ko'radi va **kira olmay qoladi, chunki kodni kiritadigan joy umuman yo'q**. Bu bosqich albatta qo'shilishi kerak, aks holda 2FA yoqilgan har qanday admin akkaunti login qila olmaydi.

---

## 1-qism: Login oqimiga 2FA bosqichini qo'shish

### Oqim sxemasi

```
1. Admin login/parol kiritadi
   → POST /v1/auth/admin/login

2a. Agar admin'da 2FA YO'Q bo'lsa:
    → javobda accessToken/refreshToken keladi — hozirgidek davom etaveradi.

2b. Agar admin'da 2FA YOQILGAN bo'lsa:
    → javobda token YO'Q, o'rniga { requires_2fa: true, challenge_id, expires_in_seconds } keladi.
    → Frontend "6 xonali kodni kiriting" ekranini ko'rsatishi kerak.
    → Admin Google Authenticator'dagi 6 xonali kodni kiritadi.
    → POST /v1/auth/admin/verify-2fa { challenge_id, code }
    → Muvaffaqiyatli bo'lsa — endi accessToken/refreshToken keladi.
```

### API — Login

**`POST /v1/auth/admin/login`**

So'rov:
```json
{ "username": "admin", "password": "..." }
```
(`username` o'rniga `email` ham yuborish mumkin)

Javob variant A — 2FA yo'q (hozirgidek):
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "admin": {
    "id": "...",
    "email": "admin@safaar.uz",
    "full_name": "...",
    "role": "SUPER_ADMIN",
    "status": "active",
    "has_2fa": false
  }
}
```

Javob variant B — 2FA talab qilinadi (**yangi, hozir handle qilinmayapti**):
```json
{
  "requires_2fa": true,
  "challenge_id": "b1a2c3d4-...",
  "expires_in_seconds": 300
}
```

### API — 2FA kodni tasdiqlash (login'ni yakunlash)

**`POST /v1/auth/admin/verify-2fa`**

So'rov:
```json
{ "challenge_id": "b1a2c3d4-...", "code": "482913" }
```

Javob (muvaffaqiyatli) — login variant A bilan bir xil shaklda (`accessToken`, `refreshToken`, `admin`).

Xato holatlari:
| Kod | Ma'no | Frontend nima qilishi kerak |
|---|---|---|
| `AUTH_2FA_EXPIRED` (401) | `challenge_id` 5 daqiqadan keyin eskiradi | "Vaqt tugadi, qaytadan kiring" — login sahifasiga qaytarish |
| `AUTH_2FA_INVALID` (401) | Kod noto'g'ri | "Kod noto'g'ri" xatoligini ko'rsatib, qayta kiritishga ruxsat berish (challenge_id o'zgarmaydi, qayta urinish mumkin) |

**Eslatma:** hozircha recovery kod orqali login qilish backendda yo'q (faqat pastda tasvirlangan "yaratish" bor) — shuning uchun bu ekranda "recovery kod bilan kirish" tugmasi hozircha qo'shilmasin.

---

## 2-qism: Sozlamalarda "2FA yoqish/o'chirish" bo'limi

Bu — admin o'zi (login qilgandan keyin) 2FA'ni yoqadigan/o'chiradigan joy. Eng mos joy: `app/(dashboard)/settings/page.tsx` yoki profil sahifasi (o'zingiz belgilaysiz).

`admin` obyektidagi `has_2fa: boolean` maydonidan foydalanib, "Yoqilgan"/"O'chirilgan" holatini ko'rsating.

### Yoqish oqimi (3 qadam)

**1-qadam — sozlashni boshlash:**

`POST /v1/auth/admin/2fa/setup` (Authorization header — login token bilan)

Javob:
```json
{
  "setup_id": "6e4057f0-...",
  "otpauth_url": "otpauth://totp/safaar:admin%40safaar.uz?secret=...&issuer=safaar&algorithm=SHA1&digits=6&period=30",
  "secret": "66ISUEWTIFZECZCRXPRCNAX72M62XLX5",
  "recovery_codes": ["Nm6PWYsMYFkY", "oGizWlyKTFQx", "...", "..."],
  "expires_in_seconds": 600
}
```

- `otpauth_url`ni QR kod qilib chizing (masalan `qrcode.react` yoki `react-qr-code` kutubxonasi bilan) — admin buni Google Authenticator/Authy bilan skanerlaydi.
- Agar kamera/skanerlashda muammo bo'lsa, `secret`ni matn sifatida ham ko'rsating ("qo'lda kiritish" varianti uchun).
- **`recovery_codes` — bu javobda FAQAT BIR MARTA keladi.** Backend faqat hash'ini saqlaydi, keyinroq qayta so'rab bo'lmaydi. Admin'ga aniq ogohlantirish bilan ko'rsating: *"Bu kodlarni xavfsiz joyga saqlab qo'ying — bu sahifani yopgandan keyin qayta ko'rsatib bo'lmaydi"* (nusxalash tugmasi/yuklab olish qo'shsangiz yaxshi bo'ladi).
- `setup_id` 10 daqiqa amal qiladi — shu vaqt ichida 2-qadam bajarilishi kerak.

**2-qadam — tasdiqlash (haqiqatan yoqish):**

Admin authenticator ilovasidan 6 xonali kodni kiritadi:

`POST /v1/auth/admin/2fa/confirm`
```json
{ "setup_id": "6e4057f0-...", "code": "482913" }
```

Javob: `{ "enabled": true }`

Xato: `AUTH_2FA_EXPIRED` (setup_id eskirgan — 1-qadamdan qaytadan boshlash kerak) yoki `AUTH_2FA_INVALID` (kod noto'g'ri — qayta kiritishga ruxsat bering).

### O'chirish

`POST /v1/auth/admin/2fa/disable` (Authorization header bilan, boshqa parametr shart emas)

Javob: `{ "disabled": true, "sessions_revoked": true }`

**Muhim:** `sessions_revoked: true` — bu chaqiruvdan keyin admin'ning BARCHA sessiyalari (shu jumladan hozirgi) bekor qilinadi. Ya'ni disable qilingandan keyin frontend darhol logout qilib, login sahifasiga qaytarishi kerak (keyingi so'rovlar `401`/`AUTH_SESSION_REVOKED` qaytaradi).

---

## Yakuniy endpoint jadvali

| Endpoint | Method | Auth | Vazifa |
|---|---|---|---|
| `/v1/auth/admin/login` | POST | Yo'q | Login (token yoki 2FA challenge qaytaradi) |
| `/v1/auth/admin/verify-2fa` | POST | Yo'q | 2FA kodni tasdiqlab, login'ni yakunlash |
| `/v1/auth/admin/2fa/setup` | POST | Ha (login token) | QR/secret/recovery kodlarni generatsiya qilish |
| `/v1/auth/admin/2fa/confirm` | POST | Ha (login token) | Kodni tasdiqlab, 2FA'ni haqiqatan yoqish |
| `/v1/auth/admin/2fa/disable` | POST | Ha (login token) | 2FA'ni o'chirish (barcha sessiyalarni bekor qiladi) |

Savol chiqsa yozing — rahmat!
