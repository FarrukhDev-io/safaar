# Logic & Business Rule Testing — Prompt

Salom. Loyihaning funksional testlari allaqachon bajarildi — endi sendan chuqurroq narsa kerak:
kodning MANTIQIY to'g'riligini tekshirib chiqishingni so'rayman. Bu darajadagi tekshiruv "tugma
bosilyaptimi" darajasidan yuqori — bu yerda savol shu: "kod aytilgan qoidaga chinakam amal
qilyaptimi, yoki faqat shunday ko'rinib turibdimi?"

## VAZIFA

Loyihaning biznes-mantig'ini (business logic) tarkibiy qismlarga ajrat va har birini alohida,
puxta tekshir. Har bir hisob-kitob, shart, holat o'zgarishi (state transition) va ruxsat
tekshiruvini kod darajasida o'qi, keyin uni qo'lda (mustaqil ravishda, kodga ishonmasdan)
qayta hisoblab, natijalarni solishtir.

Quyidagi tartibda ish olib bor:

### 1) MANTIQIY XARITA TUZ
- Loyihadagi barcha "qoidaga asoslangan" joylarni ro'yxatga ol: narx/hisob-kitob formulalari,
  ruxsat va rol tizimlari, holat mashinalari (masalan: buyurtma statusi draft → tasdiqlangan
  → bajarilgan), cheklovlar (limit, kvota, muddat), va shartli tarmoqlanishlar (if/else
  zanjirlari, ayniqsa uzun va ko'p shartli joylar).
- Har bir qoida uchun manba topib ko'rsat: qaysi fayl, qaysi funksiya, qaysi qator.

### 2) HAR BIR QOIDANI MUSTAQIL RAVISHDA QAYTA HISOBLA
- Kodga qarab emas — talab/spetsifikatsiyaga (yoki mantiqiy jihatdan "shunday bo'lishi
  kerak" degan asosga) qarab, natijani o'zing hisobla.
- Keyin kodning haqiqiy natijasi bilan solishtir. Ikkalasi mos kelmasa — bu topilma.
- "Kod shunday yozilgan, demak to'g'ri" degan mantiqqa berilma. Kod ham xato bo'lishi mumkin.

### 3) BIR NECHTA SHART BIR VAQTDA ISHLAGANDA MANTIQ BUZILISHINI TEKSHIR
- Ikki yoki undan ko'p qoida bir vaqtda faollashganda nima bo'ladi? (masalan: chegirma +
  promokod, yoki ruxsat + cheklov bir vaqtda qo'llanilsa)
- Qoidalar ketma-ketligi (order of operations) natijaga ta'sir qiladimi? Agar ha — bu
  qasddan shundaymi yoki tasodifiy xato natijasimi, aniqla.
- Race condition yoki parallel so'rovlar holatida mantiq izchil qoladimi (masalan, ikkita
  so'rov bir vaqtda bir xil resursni o'zgartirsa)?

### 4) CHEGARA VA NOODATIY QIYMATLARDA MANTIQNI SINA
- Nol, manfiy son, juda katta son, bo'sh qiymat, null/undefined holatlarida hisob-kitob
  mantiqan to'g'ri natija beradimi, yoki "texnik jihatdan ishlaydi lekin ma'nosiz natija"
  chiqaradimi?
- Vaqt/sana bilan bog'liq mantiqda: chegara kunlar (oxirgi kun, yarim tun, vaqt zonalari)
  to'g'ri hisoblanyaptimi?

### 5) MA'LUMOTLAR OQIMI IZCHILLIGINI TEKSHIR
- Frontendda ko'rsatilgan qiymat bilan backend/database'dagi haqiqiy qiymat mos keladimi?
- Bir joyda o'zgartirilgan ma'lumot (masalan, foydalanuvchi balansi, o'yin holati, XP)
  boshqa joyda eskirib qolmayaptimi yoki ikki marta hisoblanib ketmayaptimi?
- Kesh (cache) yoki lokal state bilan haqiqiy manba (source of truth) orasida nomuvofiqlik
  bormi?

### 6) HAR BIR TOPILGAN MUAMMONI QAT'IY FORMATDA HUJJATLA

```
### [Jiddiylik darajasi] Qisqa sarlavha

**Fayl/funksiya:** ...
**Kutilgan mantiq:** aniq, formula yoki qoida ko'rinishida
**Amaldagi mantiq (kodda):** aniq, kod parchasi bilan
**Nima uchun bu muammo:** ta'siri (foydalanuvchiga, biznesga, xavfsizlikka)
**Qanday tekshirib ko'rish mumkin:** minimal reproduksiya qadamlari
**Tavsiya (ixtiyoriy):** tuzatish yo'nalishi, lekin o'zing tuzatma — faqat aniqla va yoz
```

### 7) NOANIQ JOYLARDA TAXMIN QILMA
- Agar "to'g'ri mantiq qanday bo'lishi kerak" hujjatlashtirilmagan bo'lsa yoki ikki xil
  talqin qilsa bo'ladigan bo'lsa — buni taxmin qilib, o'zingcha "to'g'ri" deb belgilab
  qo'yma. Buni alohida ro'yxatga ("Aniqlashtirish talab qilinadigan joylar") yoz va aniq
  savol ber.

## NATIJA

Ishning oxirida quyidagi tuzilishda hisobot ber:

- **Tekshirilgan mantiqiy modullar ro'yxati** (qisqacha)
- **Topilgan mantiqiy nomuvofiqliklar** — yuqoridagi formatda, jiddiylik bo'yicha guruhlangan
- **Aniqlashtirish talab qilinadigan joylar** — hujjatlashtirilmagan yoki noaniq qoidalar
- **Eng xavfli 3 ta mantiqiy zaiflik** — agar bular tuzatilmasa, ishlab chiqarishda (production)
  qanday oqibatlarga olib kelishi mumkinligi bilan

## MUHIM TAMOYIL

Kod "compile bo'lyapti" yoki "crash bermayapti" degani "mantiqan to'g'ri" degani
emas. Sen aynan shu ikkisi o'rtasidagi farqni topishing kerak.