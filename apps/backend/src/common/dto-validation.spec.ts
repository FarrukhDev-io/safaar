import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSupportTicketDto } from '../support/dto/support.dto';
import { ValidatePromoDto } from '../promos/dto/promo.dto';
import { UpdateProfileDto } from '../users/dto/user.dto';
import { CreateMediaDto, PresignUploadDto } from '../uploads/dto/upload.dto';

/**
 * Regression: M-3 — bir nechta controller @Body()'ni Record<string,
 * unknown> sifatida qabul qilgani uchun global ValidationPipe
 * (whitelist/forbidNonWhitelisted) ularga umuman ta'sir qilmas edi.
 * Bu testlar aynan Nest'ning ValidationPipe o'zi ichida ishlatadigan
 * class-transformer + class-validator juftligini to'g'ridan-to'g'ri
 * chaqirib, endi haqiqiy DTO klasslari real tekshiruv qilishini
 * tasdiqlaydi (butun ilovani ko'tarmasdan, tezkor).
 */
describe('DTO validation now actually runs (regression: M-3)', () => {
  it('CreateSupportTicketDto rejects an empty body (missing required subject)', async () => {
    const dto = plainToInstance(CreateSupportTicketDto, {});
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('CreateSupportTicketDto rejects unexpected extra fields', async () => {
    const dto = plainToInstance(CreateSupportTicketDto, {
      subject: 'Yordam kerak',
      assigned_to_admin_id: '11111111-1111-1111-1111-111111111111',
    });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.some((e) => e.property === 'assigned_to_admin_id')).toBe(true);
  });

  it('CreateSupportTicketDto accepts a well-formed body', async () => {
    const dto = plainToInstance(CreateSupportTicketDto, {
      subject: 'Yordam kerak',
      priority: 'high',
    });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors).toHaveLength(0);
  });

  it('ValidatePromoDto rejects a missing code (was silently accepted before)', async () => {
    const dto = plainToInstance(ValidatePromoDto, {});
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('UpdateProfileDto rejects an invalid email format', async () => {
    const dto = plainToInstance(UpdateProfileDto, { email: 'not-an-email' });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('UpdateProfileDto rejects unexpected fields (mass-assignment guard, e.g. status/role)', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      first_name: 'Laziz',
      status: 'admin',
    });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });

  it('CreateMediaDto tolerates a string size (multipart form-data quirk) without erroring', async () => {
    const dto = plainToInstance(CreateMediaDto, { url: 'https://x.test/a.png', size: '12345' });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors).toHaveLength(0);
  });

  it('PresignUploadDto rejects an invalid type value', async () => {
    const dto = plainToInstance(PresignUploadDto, { type: 'video' });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });
});
