import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { PostgresService } from '../infrastructure/postgres.service';
import { UploadsService, type UploadedFile } from '../uploads/uploads.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly pg: PostgresService,
    private readonly uploads: UploadsService,
  ) {}

  async photos(actor: RequestActor | undefined, files: UploadedFile[]) {
    const currentActor = this.requireActor(actor);
    if (files.length === 0 || files.length > 5) {
      throw new BadRequestException({
        code: 'REVIEW_PHOTOS_COUNT_INVALID',
        message: '1 tadan 5 tagacha rasm yuboring',
      });
    }

    const uploaded = await Promise.all(
      files.map((file) =>
        this.uploads.createForOwner(
          'review_photo',
          currentActor.id,
          'image',
          {},
          file,
          {
            bucket: 'reviews',
            maxSize: 10 * 1024 * 1024,
          },
        ),
      ),
    );

    return {
      urls: uploaded
        .map((file) => String(file['url'] ?? ''))
        .filter((url) => url.length > 0),
    };
  }

  async create(actor: RequestActor | undefined, body: Record<string, unknown>) {
    const currentActor = this.requireActor(actor);
    const targetType = String(body.target_type ?? body.targetType ?? 'hotel');
    const targetId = String(
      body.target_id ?? body.targetId ?? body.hotel_id ?? body.hotelId ?? '',
    );
    if (!targetId) {
      throw new BadRequestException({
        code: 'REVIEW_TARGET_REQUIRED',
        message: 'Sharh obyekti ko‘rsatilishi kerak',
      });
    }

    const booking = await this.resolveVerifiedBooking(
      currentActor.id,
      targetType,
      targetId,
      stringValue(body.booking_id ?? body.bookingId),
    );
    const criteria = this.reviewCriteria(body);
    const rating = ratingValue(
      body.rating,
      averageRating(Object.values(criteria).filter(isNumber)),
    );
    const reviewBody = String(body.body ?? '');
    const photos = photoList(body.photos);
    const id = randomUUID();
    const now = new Date().toISOString();
    await this.pg.query(
      `INSERT INTO reviews
         (id, user_id, booking_id, target_type, target_id, rating,
          cleanliness, staff, location, value_for_money, photos,
          body, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15)`,
      [
        id,
        currentActor.id,
        booking.id,
        targetType,
        targetId,
        rating,
        criteria.cleanliness,
        criteria.staff,
        criteria.location,
        criteria.valueForMoney,
        JSON.stringify(photos),
        reviewBody,
        'published',
        now,
        now,
      ],
    );
    return {
      id,
      user_id: currentActor.id,
      booking_id: booking.id,
      target_type: targetType,
      target_id: targetId,
      rating,
      cleanliness: criteria.cleanliness,
      staff: criteria.staff,
      location: criteria.location,
      value_for_money: criteria.valueForMoney,
      photos,
      body: reviewBody,
      status: 'published',
      created_at: now,
      updated_at: now,
    };
  }

  async update(
    actor: RequestActor | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    const review = await this.assertReview(id);
    this.assertReviewOwner(actor, review);
    const now = new Date().toISOString();
    const criteria = this.reviewCriteria(body, review);
    const rating = ratingValue(body.rating, Number(review['rating'] ?? 5));
    const reviewBody = String(body.body ?? review['body']);
    const photos =
      body.photos === undefined
        ? photoList(review['photos'])
        : photoList(body.photos);
    await this.pg.query(
      `UPDATE reviews
       SET rating = $1,
           cleanliness = $2,
           staff = $3,
           location = $4,
           value_for_money = $5,
           photos = $6::jsonb,
           body = $7,
           updated_at = $8
       WHERE id = $9`,
      [
        rating,
        criteria.cleanliness,
        criteria.staff,
        criteria.location,
        criteria.valueForMoney,
        JSON.stringify(photos),
        reviewBody,
        now,
        id,
      ],
    );
    return {
      ...review,
      rating,
      cleanliness: criteria.cleanliness,
      staff: criteria.staff,
      location: criteria.location,
      value_for_money: criteria.valueForMoney,
      photos,
      body: reviewBody,
      updated_at: now,
    };
  }

  async delete(actor: RequestActor | undefined, id: string) {
    const review = await this.assertReview(id);
    this.assertReviewOwner(actor, review);
    const now = new Date().toISOString();
    await this.pg.query(
      'UPDATE reviews SET status = $1, updated_at = $2 WHERE id = $3',
      ['hidden', now, id],
    );
    return { ...review, status: 'hidden', updated_at: now };
  }

  async reply(
    actor: RequestActor | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    const currentActor = this.requireActor(actor);
    const review = await this.assertReview(id);
    await this.assertPartnerCanReply(currentActor, review);
    const reply = {
      id: randomUUID(),
      review_id: id,
      partner_user_id: currentActor.id,
      body: String(body.body ?? ''),
      created_at: new Date().toISOString(),
    };
    return reply;
  }

  private async assertReview(id: string) {
    const [review] = await this.pg.query(
      'SELECT * FROM reviews WHERE id = $1',
      [id],
    );
    if (!review) {
      throw new NotFoundException({
        code: 'VALIDATION_ERROR',
        message: 'Sharh topilmadi',
      });
    }
    return review;
  }

  private assertReviewOwner(
    actor: RequestActor | undefined,
    review: Record<string, unknown>,
  ) {
    const currentActor = this.requireActor(actor);
    if (
      currentActor.role === Role.SUPER_ADMIN ||
      currentActor.actorType === 'admin' ||
      review['user_id'] === currentActor.id
    ) {
      return;
    }
    throw new ForbiddenException({
      code: 'REVIEW_FORBIDDEN',
      message: 'Bu sharh sizga tegishli emas',
    });
  }

  private async assertPartnerCanReply(
    actor: RequestActor,
    review: Record<string, unknown>,
  ) {
    const [booking] = await this.pg.query<{
      partner_organization_id: string;
    }>('SELECT partner_organization_id FROM bookings WHERE id = $1', [
      String(review['booking_id'] ?? ''),
    ]);
    if (
      booking &&
      actor.actorType === 'partner' &&
      booking.partner_organization_id === actor.organizationId
    ) {
      return;
    }
    throw new ForbiddenException({
      code: 'REVIEW_REPLY_FORBIDDEN',
      message: 'Bu sharh sizning tashkilotingizga tegishli emas',
    });
  }

  private requireActor(actor: RequestActor | undefined): RequestActor {
    if (!actor) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Sessiya topilmadi yoki token yaroqsiz',
      });
    }
    return actor;
  }

  private async resolveVerifiedBooking(
    userId: string,
    targetType: string,
    targetId: string,
    bookingId?: string,
  ) {
    const allowedStatuses = ['confirmed', 'completed', 'checked_out'];

    if (bookingId) {
      const [booking] = await this.pg.query<{
        id: string;
        user_id: string | null;
        hotel_id: string | null;
        status: string;
      }>(
        `SELECT id::text, user_id::text, hotel_id::text, status::text
         FROM bookings
         WHERE id = $1`,
        [bookingId],
      );
      if (!booking || booking.user_id !== userId) {
        throw new ForbiddenException({
          code: 'REVIEW_BOOKING_FORBIDDEN',
          message: 'Faqat o‘z broningiz uchun sharh qoldirasiz',
        });
      }
      if (!allowedStatuses.includes(booking.status)) {
        throw new ForbiddenException({
          code: 'REVIEW_BOOKING_NOT_VERIFIED',
          message:
            'Faqat tasdiqlangan yoki yakunlangan bron uchun sharh qoldiriladi',
        });
      }
      if (targetType === 'hotel' && booking.hotel_id !== targetId) {
        throw new ForbiddenException({
          code: 'REVIEW_BOOKING_TARGET_MISMATCH',
          message: 'Bron qilingan hotel bilan sharh obyekti mos emas',
        });
      }
      return booking;
    }

    if (targetType !== 'hotel') {
      throw new BadRequestException({
        code: 'REVIEW_BOOKING_REQUIRED',
        message: 'Sharh uchun booking_id yuboring',
      });
    }

    const [booking] = await this.pg.query<{
      id: string;
      user_id: string | null;
      hotel_id: string | null;
      status: string;
    }>(
      `SELECT id::text, user_id::text, hotel_id::text, status::text
       FROM bookings
       WHERE user_id = $1
         AND hotel_id = $2
         AND status::text = ANY($3::text[])
       ORDER BY confirmed_at DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [userId, targetId, allowedStatuses],
    );

    if (!booking) {
      throw new ForbiddenException({
        code: 'REVIEW_BOOKING_NOT_VERIFIED',
        message: 'Bu hotel uchun tasdiqlangan bron topilmadi',
      });
    }
    return booking;
  }

  private reviewCriteria(
    body: Record<string, unknown>,
    fallback: Record<string, unknown> = {},
  ) {
    return {
      cleanliness: optionalRatingValue(body.cleanliness, fallback.cleanliness),
      staff: optionalRatingValue(body.staff, fallback.staff),
      location: optionalRatingValue(body.location, fallback.location),
      valueForMoney: optionalRatingValue(
        body.value_for_money ?? body.valueForMoney,
        fallback.value_for_money ?? fallback.valueForMoney,
      ),
    };
  }
}

function ratingValue(value: unknown, fallback = 5): number {
  return boundedRating(value ?? fallback, 'rating');
}

function optionalRatingValue(
  value: unknown,
  fallback?: unknown,
): number | null {
  if (value === undefined && fallback == null) return null;
  if (value === null) return null;
  return boundedRating(value ?? fallback, 'rating');
}

function boundedRating(value: unknown, field: string): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) {
    throw new BadRequestException({
      code: 'REVIEW_RATING_INVALID',
      message: `${field} 1 dan 5 gacha bo‘lishi kerak`,
    });
  }
  return Math.round(numeric * 10) / 10;
}

function averageRating(values: number[]): number {
  if (values.length === 0) return 5;
  return (
    Math.round(
      (values.reduce((sum, value) => sum + value, 0) / values.length) * 10,
    ) / 10
  );
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function photoList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter((item) => item.length > 0);
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return photoList(parsed);
    } catch {
      return [value.trim()];
    }
  }
  return [];
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
