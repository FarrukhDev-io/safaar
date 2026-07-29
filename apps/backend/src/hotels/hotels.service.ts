import { Injectable, NotFoundException } from '@nestjs/common';
import {
  paginatedObject,
  parsePagination,
  type QueryLike,
} from '../common/pagination';
import { AppCacheService } from '../infrastructure/cache.service';
import { PostgresService } from '../infrastructure/postgres.service';
import { parseGeoBounds } from '../common/geo-bounds';

@Injectable()
export class HotelsService {
  constructor(
    private readonly cache: AppCacheService,
    private readonly pg: PostgresService,
  ) {}

  async findAll(query: QueryLike) {
    return this.cache.getOrSet(`hotels:list:${cacheKey(query)}`, 60, () => {
      return this.findAllFresh(query);
    });
  }

  private async findAllFresh(query: QueryLike) {
    const conditions = [
      "h.status = 'published'",
      'h.deleted_at IS NULL',
      "po.status = 'approved'",
    ];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (query.city_id) {
      conditions.push(`h.city_id = $${paramIndex++}`);
      params.push(query.city_id);
    }

    if (query.stars) {
      conditions.push(`h.stars = $${paramIndex++}`);
      params.push(Number(query.stars));
    }

    if (query.featured === 'true') {
      conditions.push('h.featured = true');
    }

    if (query.min_rating) {
      conditions.push(`h.rating_average >= $${paramIndex++}`);
      params.push(Number(query.min_rating));
    }

    const bounds = parseGeoBounds(query.bounds);
    if (bounds) {
      conditions.push(
        `h.latitude IS NOT NULL AND h.longitude IS NOT NULL AND h.latitude BETWEEN $${paramIndex++} AND $${paramIndex++}`,
      );
      params.push(bounds.south, bounds.north);

      if (bounds.west <= bounds.east) {
        conditions.push(
          `h.longitude BETWEEN $${paramIndex++} AND $${paramIndex++}`,
        );
        params.push(bounds.west, bounds.east);
      } else {
        conditions.push(
          `(h.longitude >= $${paramIndex++} OR h.longitude <= $${paramIndex++})`,
        );
        params.push(bounds.west, bounds.east);
      }
    }

    const rows = await this.pg.query(
      `SELECT h.id::text, h.partner_organization_id::text, h.slug, h.city_id::text,
        h.address, h.latitude::float8, h.longitude::float8, h.stars,
        h.rating_average::float8, h.reviews_count, h.status::text, h.featured,
        h.check_in_time, h.check_out_time,
        h.created_at, h.updated_at,
        ht.name, ht.description,
        c.name as city_name, c.region_id::text,
        rp.min_price::float8
      FROM hotels h
      JOIN partner_organizations po ON po.id = h.partner_organization_id
      LEFT JOIN hotel_translations ht ON ht.hotel_id = h.id AND ht.language = 'uz'
      LEFT JOIN cities c ON c.id = h.city_id
      LEFT JOIN (SELECT hotel_id, MIN(base_price) as min_price FROM hotel_rooms WHERE status = 'active' GROUP BY hotel_id) rp ON rp.hotel_id = h.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY h.rating_average DESC`,
      params,
    );

    const listingData = await this.loadListingData(
      rows.map((row) => String((row as Record<string, unknown>).id)),
    );

    const mapped = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      partner_organization_id: r.partner_organization_id,
      slug: r.slug,
      city_id: r.city_id,
      address: r.address,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      stars: Number(r.stars),
      rating_average: Number(r.rating_average),
      reviews_count: Number(r.reviews_count),
      status: r.status,
      featured: r.featured ?? false,
      check_in_time: r.check_in_time,
      check_out_time: r.check_out_time,
      created_at: r.created_at,
      updated_at: r.updated_at,
      name: listingData.names.get(String(r.id)) ?? localized(r.name),
      description:
        listingData.descriptions.get(String(r.id)) ?? localized(r.description),
      city: { id: r.city_id, region_id: r.region_id, name: r.city_name },
      amenities: listingData.amenities.get(String(r.id)) ?? [],
      images: listingData.images.get(String(r.id)) ?? [],
      min_price: Number(r.min_price || 0),
    }));

    const pagination = parsePagination(query, 'public', {
      allowedSortBy: ['created_at', 'rating_average', 'stars', 'min_price'],
      defaultSortBy: 'rating_average',
    });

    return paginatedObject(mapped, pagination);
  }

  async findOne(slugOrId: string) {
    const rows = await this.pg.query(
      `SELECT h.id::text, h.partner_organization_id::text, h.slug, h.city_id::text,
        h.address, h.latitude::float8, h.longitude::float8, h.stars,
        h.rating_average::float8, h.reviews_count, h.status::text,
        h.check_in_time, h.check_out_time,
        h.created_at, h.updated_at,
        ht.name, ht.description,
        c.name as city_name, c.region_id::text
      FROM hotels h
      JOIN partner_organizations po ON po.id = h.partner_organization_id
      LEFT JOIN hotel_translations ht ON ht.hotel_id = h.id AND ht.language = 'uz'
      LEFT JOIN cities c ON c.id = h.city_id
      WHERE (h.id::text = $1 OR h.slug = $1)
        AND h.status = 'published'
        AND h.deleted_at IS NULL
        AND po.status = 'approved'`,
      [slugOrId],
    );

    if (rows.length === 0) {
      throw new NotFoundException({
        code: 'HOTEL_NOT_FOUND',
        message: 'Hotel topilmadi',
      });
    }

    const h = rows[0] as Record<string, unknown>;
    const listingData = await this.loadListingData([String(h.id)]);
    const roomRows = await this.pg.query(
      `SELECT hr.id::text, hr.hotel_id::text, hr.room_type_id::text, hr.code,
        hr.base_occupancy, hr.max_adults, hr.max_children,
        hr.total_inventory, hr.base_price::float8, hr.status::text
      FROM hotel_rooms hr
      WHERE hr.hotel_id = $1 AND hr.status = 'active'`,
      [h.id],
    );
    const rooms = roomRows.map((r: Record<string, unknown>) => ({
      id: r.id,
      hotel_id: r.hotel_id,
      room_type_id: r.room_type_id,
      code: r.code,
      base_occupancy: Number(r.base_occupancy),
      max_adults: Number(r.max_adults),
      max_children: Number(r.max_children),
      total_inventory: Number(r.total_inventory),
      base_price: Number(r.base_price),
      status: r.status,
      available: Number(r.total_inventory),
    }));

    return {
      id: h.id,
      partner_organization_id: h.partner_organization_id,
      slug: h.slug,
      city_id: h.city_id,
      address: h.address,
      latitude: Number(h.latitude),
      longitude: Number(h.longitude),
      stars: Number(h.stars),
      rating_average: Number(h.rating_average),
      reviews_count: Number(h.reviews_count),
      status: h.status,
      check_in_time: h.check_in_time,
      check_out_time: h.check_out_time,
      created_at: h.created_at,
      updated_at: h.updated_at,
      name: listingData.names.get(String(h.id)) ?? localized(h.name),
      description:
        listingData.descriptions.get(String(h.id)) ?? localized(h.description),
      city: { id: h.city_id, region_id: h.region_id, name: h.city_name },
      amenities: listingData.amenities.get(String(h.id)) ?? [],
      images: listingData.images.get(String(h.id)) ?? [],
      rooms,
    };
  }

  async rooms(id: string) {
    const rows = await this.pg.query(
      `SELECT hr.id::text, hr.hotel_id::text, hr.room_type_id::text, hr.code,
        hr.base_occupancy, hr.max_adults, hr.max_children,
        hr.total_inventory, hr.base_price::float8, hr.status::text
      FROM hotel_rooms hr
      WHERE hr.hotel_id = $1 AND hr.status = 'active'`,
      [id],
    );

    return rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      hotel_id: r.hotel_id,
      room_type_id: r.room_type_id,
      code: r.code,
      base_occupancy: Number(r.base_occupancy),
      max_adults: Number(r.max_adults),
      max_children: Number(r.max_children),
      total_inventory: Number(r.total_inventory),
      base_price: Number(r.base_price),
      status: r.status,
      available: Number(r.total_inventory),
    }));
  }

  async quote(id: string, body: Record<string, unknown>) {
    const rooms = await this.rooms(id);
    const roomId = String(body.room_id ?? rooms[0]?.id ?? '');
    const room = rooms.find((item) => item.id === roomId);

    if (!room) {
      throw new NotFoundException({
        code: 'ROOM_NOT_AVAILABLE',
        message: 'Xona mavjud emas',
      });
    }

    const checkIn = String(body.check_in ?? '');
    const checkOut = String(body.check_out ?? '');
    const nights = this.calculateNights(checkIn, checkOut);
    const roomsCount = Number(body.rooms ?? 1);
    const subtotal = Number(room.base_price) * nights * roomsCount;

    return {
      quote_id: `quote-${Date.now()}`,
      hotel_id: id,
      room,
      check_in: checkIn,
      check_out: checkOut,
      nights,
      rooms: roomsCount,
      currency: 'UZS',
      subtotal,
      discount_amount: 0,
      service_fee: 0,
      total_amount: subtotal,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    };
  }

  async reviews(id: string) {
    return this.pg.query(
      `SELECT r.id::text, r.user_id::text, r.booking_id::text,
         r.target_type, r.target_id::text, r.rating::float8,
         r.cleanliness::float8, r.staff::float8, r.location::float8,
         r.value_for_money::float8, r.photos, r.body, r.status::text,
         r.created_at, r.updated_at, u.first_name, u.last_name
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.target_type = 'hotel' AND r.target_id = $1 AND r.status = 'published'
       ORDER BY r.created_at DESC`,
      [id],
    );
  }

  private async loadListingData(ids: string[]) {
    if (ids.length === 0) {
      return {
        names: new Map<string, Record<string, string | null>>(),
        descriptions: new Map<string, Record<string, string | null>>(),
        images: new Map<string, string[]>(),
        amenities: new Map<string, string[]>(),
      };
    }

    const [translations, media, amenities] = await Promise.all([
      this.pg.query<{
        hotel_id: string;
        language: string;
        name: string | null;
        description: string | null;
      }>(
        `SELECT hotel_id::text, language::text, name, description
         FROM hotel_translations
         WHERE hotel_id = ANY($1::uuid[])`,
        [ids],
      ),
      this.pg.query<{ hotel_id: string; url: string }>(
        `SELECT owner_id::text as hotel_id, url
         FROM media_files
         WHERE owner_type = 'hotel'
           AND owner_id = ANY($1::uuid[])
           AND deleted_at IS NULL
           AND url IS NOT NULL
         ORDER BY sort_order ASC, created_at ASC`,
        [ids],
      ),
      this.pg.query<{ hotel_id: string; code: string }>(
        `SELECT ha.hotel_id::text, a.code
         FROM hotel_amenities ha
         JOIN amenities a ON a.id = ha.amenity_id
         WHERE ha.hotel_id = ANY($1::uuid[])
         ORDER BY a.code ASC`,
        [ids],
      ),
    ]);

    const names = new Map<string, Record<string, string | null>>();
    const descriptions = new Map<string, Record<string, string | null>>();
    const images = new Map<string, string[]>();
    const amenityMap = new Map<string, string[]>();

    for (const row of translations) {
      const name = names.get(row.hotel_id) ?? { uz: null, ru: null, en: null };
      const description = descriptions.get(row.hotel_id) ?? {
        uz: null,
        ru: null,
        en: null,
      };
      if (row.language in name) name[row.language] = row.name;
      if (row.language in description)
        description[row.language] = row.description;
      names.set(row.hotel_id, name);
      descriptions.set(row.hotel_id, description);
    }
    for (const row of media) {
      const list = images.get(row.hotel_id) ?? [];
      list.push(row.url);
      images.set(row.hotel_id, list);
    }
    for (const row of amenities) {
      const list = amenityMap.get(row.hotel_id) ?? [];
      list.push(row.code);
      amenityMap.set(row.hotel_id, list);
    }

    return { names, descriptions, images, amenities: amenityMap };
  }

  async map(query: QueryLike) {
    const hotels = (await this.findAll(query)) as {
      items: Array<Record<string, unknown>>;
    };
    return hotels.items.map((hotel) => ({
      id: hotel['id'],
      slug: hotel['slug'],
      name: hotel['name'],
      latitude: hotel['latitude'],
      longitude: hotel['longitude'],
      rating_average: hotel['rating_average'],
      min_price: hotel['min_price'],
    }));
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    const start = Date.parse(checkIn);
    const end = Date.parse(checkOut);

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return 1;
    }

    return Math.max(1, Math.ceil((end - start) / 86_400_000));
  }
}

function localized(value: unknown): Record<string, string | null> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const source = value as Record<string, unknown>;
    return {
      uz: source.uz == null ? null : String(source.uz),
      ru: source.ru == null ? null : String(source.ru),
      en: source.en == null ? null : String(source.en),
    };
  }
  const text = value == null ? null : String(value);
  return { uz: text, ru: text, en: text };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function cacheKey(query: QueryLike): string {
  return Object.keys(query)
    .sort()
    .map(
      (key) => `${key}=${encodeURIComponent(String(first(query[key]) ?? ''))}`,
    )
    .join('&');
}
