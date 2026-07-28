import { Injectable } from '@nestjs/common';
import { parseGeoBounds } from '../common/geo-bounds';
import { AppCacheService } from '../infrastructure/cache.service';
import { PostgresService } from '../infrastructure/postgres.service';

type DbRow = Record<string, unknown>;
type CatalogQuery = Record<string, string | string[] | undefined>;

const latitudeSql = `COALESCE(
  latitude,
  CASE WHEN metadata ->> 'latitude' ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (metadata ->> 'latitude')::numeric END,
  CASE WHEN metadata ->> 'lat' ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (metadata ->> 'lat')::numeric END
)`;

const longitudeSql = `COALESCE(
  longitude,
  CASE WHEN metadata ->> 'longitude' ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (metadata ->> 'longitude')::numeric END,
  CASE WHEN metadata ->> 'lng' ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (metadata ->> 'lng')::numeric END,
  CASE WHEN metadata ->> 'lon' ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (metadata ->> 'lon')::numeric END
)`;

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberValue(value: unknown, fallback = 0): number {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function nullableNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly cache: AppCacheService,
    private readonly postgres: PostgresService,
  ) {}

  async regions() {
    return this.cache.getOrSet('catalog:regions', 3600, async () => {
      return this.postgres.query(`
        select id::text, name, created_at, updated_at
        from regions
        order by name ->> 'uz'
      `);
    });
  }

  async cities() {
    return this.cache.getOrSet('catalog:cities', 3600, async () => {
      return this.postgres.query(`
        select id::text, region_id::text, name, created_at, updated_at
        from cities
        order by name ->> 'uz'
      `);
    });
  }

  async amenities() {
    return this.cache.getOrSet('catalog:amenities', 3600, async () => {
      return this.postgres.query(`
        select id::text, code, name, created_at, updated_at
        from amenities
        order by name ->> 'uz'
      `);
    });
  }

  async roomTypes() {
    return this.cache.getOrSet('catalog:room-types', 3600, async () => {
      return this.postgres.query(`
        select id::text, code, name, created_at, updated_at
        from room_types
        order by name ->> 'uz'
      `);
    });
  }

  async busTypes() {
    return this.cache.getOrSet('catalog:bus-types', 3600, async () => {
      return this.postgres.query(`
        select id::text, code, name, created_at, updated_at
        from bus_types
        order by name ->> 'uz'
      `);
    });
  }

  async cancellationPolicies() {
    return this.cache.getOrSet(
      'catalog:cancellation-policies',
      3600,
      async () => {
        return this.postgres.query(`
        select id::text, name, rules, refundable_until_hours, created_at, updated_at
        from cancellation_policies
        order by name ->> 'uz'
      `);
      },
    );
  }

  async popularCities() {
    return this.cache.getOrSet('catalog:popular-cities', 3600, async () => {
      return this.postgres.query(`
        SELECT c.id::text, c.name, c.slug, c.image_url,
          c.sort_order,
          COUNT(h.id)::int as hotel_count
        FROM cities c
        LEFT JOIN hotels h ON h.city_id = c.id AND h.status = 'published'
        GROUP BY c.id, c.name, c.slug, c.image_url, c.sort_order
        ORDER BY c.sort_order, hotel_count DESC
      `);
    });
  }

  async partnersShowcase() {
    return this.cache.getOrSet('catalog:partners-showcase', 3600, async () => {
      return this.postgres.query(`
        SELECT po.id::text, po.brand_name as company_name,
          po.logo_url, po.type, 0 as sort_order
        FROM partner_organizations po
        WHERE po.status = 'approved' AND po.showcase = true
        ORDER BY po.brand_name
      `);
    });
  }

  async attractions(query: CatalogQuery = {}) {
    return this.cache.getOrSet(
      `catalog:attractions:${cacheKey(query)}`,
      3600,
      async () => {
        const { conditions, params } = boundsConditions('attraction', query);
        const rows = await this.postgres.query<DbRow>(
          `
        SELECT id::text, slug, title, body, metadata,
          ${latitudeSql}::float8 AS latitude,
          ${longitudeSql}::float8 AS longitude,
          published_at, updated_at
        FROM cms_entries
        WHERE ${conditions.join(' AND ')}
        ORDER BY
          COALESCE((metadata ->> 'sortOrder')::int, (metadata ->> 'order')::int, 9999),
          COALESCE(published_at, created_at) DESC
      `,
          params,
        );
        return rows.map((row) => {
          const meta = objectValue(row.metadata);
          return {
            id: row.id,
            slug: row.slug,
            name: row.title,
            city_name: meta.city_name ?? meta.cityName ?? {},
            category_key: meta.category_key ?? meta.categoryKey ?? '',
            category_default:
              meta.category_default ?? meta.categoryDefault ?? '',
            description: row.body,
            rating: numberValue(meta.rating),
            latitude:
              nullableNumber(row.latitude) ??
              nullableNumber(meta.latitude ?? meta.lat),
            longitude:
              nullableNumber(row.longitude) ??
              nullableNumber(meta.longitude ?? meta.lng ?? meta.lon),
            image_url: meta.image_url ?? meta.imageUrl ?? '',
            best_time_to_visit:
              meta.best_time_to_visit ?? meta.bestTimeToVisit ?? '',
            updated_at: row.updated_at,
          };
        });
      },
    );
  }

  async restaurants(query: CatalogQuery = {}) {
    return this.cache.getOrSet(
      `catalog:restaurants:${cacheKey(query)}`,
      3600,
      async () => {
        const { conditions, params } = boundsConditions('restaurant', query);
        const rows = await this.postgres.query<DbRow>(
          `
        SELECT id::text, slug, title, metadata,
          ${latitudeSql}::float8 AS latitude,
          ${longitudeSql}::float8 AS longitude,
          published_at, updated_at
        FROM cms_entries
        WHERE ${conditions.join(' AND ')}
        ORDER BY
          COALESCE((metadata ->> 'sortOrder')::int, (metadata ->> 'order')::int, 9999),
          COALESCE(published_at, created_at) DESC
      `,
          params,
        );
        return rows.map((row) => {
          const meta = objectValue(row.metadata);
          return {
            id: row.id,
            slug: row.slug,
            name: row.title,
            city_name: meta.city_name ?? meta.cityName ?? {},
            address: meta.address ?? '',
            cuisine: meta.cuisine ?? '',
            rating: numberValue(meta.rating),
            reviews_count: numberValue(meta.reviews_count ?? meta.reviewsCount),
            average_check: numberValue(meta.average_check ?? meta.averageCheck),
            latitude:
              nullableNumber(row.latitude) ??
              nullableNumber(meta.latitude ?? meta.lat),
            longitude:
              nullableNumber(row.longitude) ??
              nullableNumber(meta.longitude ?? meta.lng ?? meta.lon),
            working_hours: meta.working_hours ?? meta.workingHours ?? '',
            image_url: meta.image_url ?? meta.imageUrl ?? '',
            phone: meta.phone ?? '',
            updated_at: row.updated_at,
          };
        });
      },
    );
  }

  async transports() {
    return this.cache.getOrSet('catalog:transports', 3600, async () => {
      return this.postgres.query(`
        SELECT
          v.id::text,
          v.name,
          c.name AS city_name,
          'transfer' AS category_key,
          'Transport' AS category_default,
          v.seats_count AS seats,
          true AS has_driver,
          '' AS fuel_type,
          '' AS transmission,
          COALESCE(MIN(t.base_price), 0)::float8 AS price_per_day,
          bc.rating_average::float8 AS rating,
          COALESCE(po.logo_url, '') AS image_url,
          po.phone,
          v.updated_at
        FROM vehicles v
        JOIN bus_companies bc ON bc.id = v.company_id
        JOIN partner_organizations po ON po.id = bc.partner_organization_id
        LEFT JOIN cities c ON c.id = po.city_id
        LEFT JOIN trips t
          ON t.vehicle_id = v.id
         AND t.status = 'scheduled'
         AND t.departure_at >= now()
        WHERE v.status = 'active'
          AND bc.status = 'active'
          AND po.status = 'approved'
        GROUP BY v.id, v.name, c.name, v.seats_count, bc.rating_average,
                 po.logo_url, po.phone, v.updated_at
        ORDER BY v.updated_at DESC
      `);
    });
  }
}

function boundsConditions(
  type: 'attraction' | 'restaurant',
  query: CatalogQuery,
) {
  const conditions = [`type = $1`, "status IN ('published', 'active')"];
  const params: unknown[] = [type];
  let paramIndex = 2;
  const bounds = parseGeoBounds(query.bounds);

  if (!bounds) {
    return { conditions, params };
  }

  conditions.push(
    `${latitudeSql} IS NOT NULL`,
    `${longitudeSql} IS NOT NULL`,
    `${latitudeSql} BETWEEN $${paramIndex++} AND $${paramIndex++}`,
  );
  params.push(bounds.south, bounds.north);

  if (bounds.west <= bounds.east) {
    conditions.push(
      `${longitudeSql} BETWEEN $${paramIndex++} AND $${paramIndex++}`,
    );
    params.push(bounds.west, bounds.east);
  } else {
    conditions.push(
      `(${longitudeSql} >= $${paramIndex++} OR ${longitudeSql} <= $${paramIndex++})`,
    );
    params.push(bounds.west, bounds.east);
  }

  return { conditions, params };
}

function cacheKey(query: CatalogQuery): string {
  return Object.keys(query)
    .sort()
    .map((key) => {
      const value = query[key];
      const first = Array.isArray(value) ? value[0] : value;
      return `${key}=${encodeURIComponent(String(first ?? ''))}`;
    })
    .join('&');
}
