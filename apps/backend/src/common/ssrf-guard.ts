import { BadRequestException } from '@nestjs/common';
import { isIP } from 'node:net';
import { lookup as dnsLookup } from 'node:dns/promises';

/**
 * Partner-provided URL'larni serverdan fetch qilishdan oldin tekshiradi
 * (webhook endpoints). Hostname va u DNS orqali qaysi IP'larga
 * yechilishini (nafaqat sirtqi ko'rinishini) tekshiradi — aks holda
 * `internal-looking.attacker.com` kabi ochiq domen ichki IP'ga
 * yo'naltirilishi mumkin edi.
 *
 * Hozircha qamrab OLINMAYDI: DNS rebinding (bu yerda validatsiya qilingan
 * IP bilan `fetch()` haqiqatda ulanadigan IP orasidagi TOCTOU oynasi) —
 * buni to'liq yopish uchun ulanishni aynan tekshirilgan IP'ga "pin"
 * qiladigan maxsus dispatcher/connector kerak bo'ladi. Shu sabab bu
 * himoya (a) webhook yaratish/yangilashda VA (b) har bir yetkazishdan
 * OLDIN qayta chaqiriladi — oyna deyarli nolga yaqinlashadi, lekin
 * nazariy jihatdan mutlaqo yo'q emas.
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BadRequestException({
      code: 'WEBHOOK_URL_INVALID',
      message: "To'g'ri URL manzil kiriting",
    });
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BadRequestException({
      code: 'WEBHOOK_URL_SCHEME_NOT_ALLOWED',
      message: 'Faqat http/https URL manzillar ruxsat etiladi',
    });
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw blockedError();
  }

  const addresses = await resolveAllAddresses(hostname);
  if (addresses.length === 0) {
    throw new BadRequestException({
      code: 'WEBHOOK_URL_UNRESOLVABLE',
      message: "URL manzilini aniqlab bo'lmadi",
    });
  }

  for (const address of addresses) {
    if (isBlockedIp(address)) {
      throw blockedError();
    }
  }

  return url;
}

async function resolveAllAddresses(hostname: string): Promise<string[]> {
  if (isIP(hostname)) {
    return [hostname];
  }

  try {
    const records = await dnsLookup(hostname, { all: true, verbatim: true });
    return records.map((record) => record.address);
  } catch {
    return [];
  }
}

function blockedError(): BadRequestException {
  return new BadRequestException({
    code: 'WEBHOOK_URL_NOT_ALLOWED',
    message:
      'Bu URL manzilga ruxsat berilmagan (ichki/lokal tarmoq manzillari taqiqlangan)',
  });
}

/**
 * IPv4/IPv6 loopback, private, link-local (shu jumladan
 * 169.254.169.254 cloud metadata), va boshqa reserved diapazonlarni
 * bloklaydi.
 */
function isBlockedIp(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    return isBlockedIpv4(address);
  }
  if (version === 6) {
    return isBlockedIpv6(address);
  }
  return true;
}

function isBlockedIpv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((value) => Number.isNaN(value))) {
    return true;
  }
  const [a, b] = octets;

  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 192 && b === 0 && octets[2] === 2) return true; // 192.0.2.0/24 TEST-NET-1
  if (a === 198 && b === 18) return true; // 198.18.0.0/15 benchmarking
  if (a === 198 && b === 51 && octets[2] === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && octets[2] === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast (224+) va reserved (240+)

  return false;
}

function isBlockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized === '::1') return true; // loopback
  if (normalized === '::') return true; // unspecified
  if (normalized.startsWith('::ffff:')) {
    // IPv4-mapped IPv6 — o'ralgan IPv4 manzilni tekshiramiz
    const mapped = normalized.slice('::ffff:'.length);
    return isIP(mapped) === 4 ? isBlockedIpv4(mapped) : true;
  }
  if (normalized.startsWith('fe80:')) return true; // link-local
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local (fc00::/7)

  return false;
}
