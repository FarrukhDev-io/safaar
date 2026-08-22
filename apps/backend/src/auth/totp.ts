import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { base64UrlEncode, isProduction } from './security';

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const stepSeconds = 30;
const codeDigits = 6;

export interface TotpSetup {
  secret: string;
  encryptedSecret: string;
  otpauthUrl: string;
  recoveryCodes: string[];
  recoveryCodeHashes: string[];
}

export function createTotpSetup(accountName: string): TotpSetup {
  const secret = base32Encode(randomBytes(20));
  const encryptedSecret = encryptSecret(secret);
  const recoveryCodes = Array.from({ length: 8 }, () =>
    base64UrlEncode(randomBytes(9)).slice(0, 12),
  );

  return {
    secret,
    encryptedSecret,
    otpauthUrl: `otpauth://totp/safaar:${encodeURIComponent(accountName)}?secret=${secret}&issuer=safaar&algorithm=SHA1&digits=6&period=30`,
    recoveryCodes,
    recoveryCodeHashes: recoveryCodes.map(hashRecoveryCode),
  };
}

export function verifyTotpCode(
  encryptedSecret: string,
  code: string,
  window = 1,
): boolean {
  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  const secret = decryptSecret(encryptedSecret);
  const currentCounter = Math.floor(Date.now() / 1000 / stepSeconds);

  for (let offset = -window; offset <= window; offset += 1) {
    const generated = totp(secret, currentCounter + offset);
    if (timingSafeEqualString(code, generated)) {
      return true;
    }
  }

  return false;
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256')
    .update(`${recoveryCodePepper()}:${code}`)
    .digest('hex');
}

function recoveryCodePepper(): string {
  const configured = process.env.RECOVERY_CODE_PEPPER;
  if (configured) {
    return configured;
  }

  if (isProduction()) {
    throw new Error('RECOVERY_CODE_PEPPER production muhitida majburiy');
  }

  return 'safaar-development-recovery-pepper';
}

export function encryptSecret(secret: string): string {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext]
    .map((buffer) => buffer.toString('base64url'))
    .join('.');
}

export function decryptSecret(encrypted: string): string {
  const [ivValue, tagValue, ciphertextValue] = encrypted.split('.');
  if (!ivValue || !tagValue || !ciphertextValue) {
    throw new Error('TOTP_SECRET_INVALID');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function totp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 10 ** codeDigits).padStart(codeDigits, '0');
}

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(value: string): Buffer {
  let bits = 0;
  let current = 0;
  const bytes: number[] = [];

  for (const char of value.replace(/=+$/g, '').toUpperCase()) {
    const index = base32Alphabet.indexOf(char);
    if (index < 0) {
      throw new Error('TOTP_SECRET_INVALID');
    }

    current = (current << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((current >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function encryptionKey(): Buffer {
  const configured = process.env.TOTP_ENCRYPTION_KEY;
  if (configured) {
    const value = configured.startsWith('base64:')
      ? Buffer.from(configured.slice('base64:'.length), 'base64')
      : Buffer.from(configured);
    return value.length === 32
      ? value
      : createHash('sha256').update(value).digest();
  }

  if (isProduction()) {
    throw new Error('TOTP_ENCRYPTION_KEY production muhitida majburiy');
  }

  return createHash('sha256').update('safaar-development-totp-key').digest();
}

function timingSafeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}
