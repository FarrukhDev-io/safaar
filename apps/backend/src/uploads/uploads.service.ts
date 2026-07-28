import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Role } from '@safaar/types';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { RequestActor } from '../common/actor';
import { PostgresService } from '../infrastructure/postgres.service';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

interface StoreMediaOptions {
  bucket?: string;
  maxSize?: number;
}

interface StoredUpload {
  absolutePath?: string;
  objectKey: string;
  url: string;
}

interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  publicBaseUrl?: string;
}

@Injectable()
export class UploadsService {
  constructor(private readonly pg: PostgresService) {}

  async create(
    actor: RequestActor | undefined,
    type: 'image' | 'document',
    body: Record<string, unknown>,
    file?: UploadedFile,
  ) {
    const currentActor = this.requireActor(actor);
    return this.storeMedia(
      currentActor.actorType,
      currentActor.id,
      type,
      body,
      file,
    );
  }

  async createForOwner(
    ownerType: string,
    ownerId: string,
    type: 'image' | 'document',
    body: Record<string, unknown>,
    file: UploadedFile,
    options: StoreMediaOptions = {},
  ) {
    return this.storeMedia(ownerType, ownerId, type, body, file, options);
  }

  presign(actor: RequestActor | undefined, body: Record<string, unknown>) {
    const currentActor = this.requireActor(actor);
    const type =
      String(body.type ?? 'image') === 'document' ? 'document' : 'image';
    const mimeType = String(body.mime_type ?? body.mimeType ?? '');
    const size = Number(body.size ?? 0);
    this.assertUploadAllowed(type, mimeType, size);

    return {
      owner_id: currentActor.id,
      upload_url: `${this.publicOrigin()}/uploads/${type === 'document' ? 'documents' : 'images'}`,
      method: 'POST',
      fields: {},
      expires_in_seconds: 900,
      filename: this.safeFilename(String(body.filename ?? `${type}.bin`)),
      mime_type: mimeType,
      max_size: this.maxSize(type),
    };
  }

  async delete(actor: RequestActor | undefined, id: string) {
    const currentActor = this.requireActor(actor);

    const [file] = await this.pg.query(
      'SELECT * FROM media_files WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );

    if (!file) {
      throw new NotFoundException({
        code: 'UPLOAD_NOT_FOUND',
        message: 'Fayl topilmadi',
      });
    }

    if (
      currentActor.role !== Role.SUPER_ADMIN &&
      currentActor.actorType !== 'admin' &&
      file.owner_id !== currentActor.id
    ) {
      throw new ForbiddenException({
        code: 'UPLOAD_FORBIDDEN',
        message: 'Bu fayl sizga tegishli emas',
      });
    }

    await this.pg.query(
      'UPDATE media_files SET deleted_at = $1 WHERE id = $2',
      [new Date().toISOString(), id],
    );

    return { id, deleted: true };
  }

  private assertUploadAllowed(
    type: 'image' | 'document',
    mimeType: string,
    size: number,
    maxSizeOverride?: number,
  ) {
    const allowed =
      type === 'image'
        ? ['image/jpeg', 'image/png', 'image/webp']
        : ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowed.includes(mimeType)) {
      throw new BadRequestException({
        code: 'UPLOAD_MIME_NOT_ALLOWED',
        message: 'Fayl turi ruxsat etilmagan',
      });
    }

    const maxSize = maxSizeOverride ?? this.maxSize(type);
    if (!Number.isFinite(size) || size <= 0 || size > maxSize) {
      throw new BadRequestException({
        code: 'UPLOAD_SIZE_INVALID',
        message: 'Fayl hajmi ruxsat etilgan chegaradan tashqarida',
      });
    }
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

  private async storeMedia(
    ownerType: string,
    ownerId: string,
    type: 'image' | 'document',
    body: Record<string, unknown>,
    file?: UploadedFile,
    options: StoreMediaOptions = {},
  ) {
    const mimeType =
      file?.mimetype ?? String(body.mime_type ?? body.mimeType ?? '');
    const size = file?.size ?? Number(body.size ?? 0);
    this.assertUploadAllowed(type, mimeType, size, options.maxSize);

    const id = randomUUID();
    const now = new Date().toISOString();
    const bucket = options.bucket ?? type;
    const stored = file ? await this.persistFile(bucket, file) : undefined;
    const providedUrl =
      typeof body.url === 'string' && body.url.trim()
        ? body.url.trim()
        : undefined;
    if (!stored && !providedUrl) {
      throw new BadRequestException({
        code: 'UPLOAD_FILE_REQUIRED',
        message: 'Fayl yoki real URL yuborilishi kerak',
      });
    }
    const objectKey =
      stored?.objectKey ?? `${ownerType}/${ownerId}/${randomUUID()}`;
    const url = stored?.url ?? providedUrl;

    try {
      const [media] = await this.pg.query(
        `INSERT INTO media_files (id, owner_type, owner_id, bucket, object_key, url, mime_type, size, visibility, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          id,
          ownerType,
          ownerId,
          bucket,
          objectKey,
          url,
          mimeType,
          size,
          'public',
          now,
        ],
      );
      return media;
    } catch (error) {
      if (stored?.absolutePath) {
        await unlink(stored.absolutePath).catch(() => undefined);
      }
      throw error;
    }
  }

  private async persistFile(bucket: string, file: UploadedFile) {
    const s3Config = this.s3Config();
    if (s3Config) {
      return this.persistS3File(bucket, file, s3Config);
    }
    return this.persistLocalFile(bucket, file);
  }

  private async persistLocalFile(
    bucket: string,
    file: UploadedFile,
  ): Promise<StoredUpload> {
    const extension = this.extensionForMime(file.mimetype);
    const filename = `${randomUUID()}${extension}`;
    const relativePath = join(bucket, filename);
    const absolutePath = join(this.uploadRoot(), relativePath);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.buffer, { flag: 'wx' });

    return {
      absolutePath,
      objectKey: relativePath,
      url: `${this.publicOrigin()}/uploads/${relativePath.replace(/\\/g, '/')}`,
    };
  }

  private async persistS3File(
    bucket: string,
    file: UploadedFile,
    config: S3StorageConfig,
  ): Promise<StoredUpload> {
    const extension = this.extensionForMime(file.mimetype);
    const objectKey = `${bucket}/${randomUUID()}${extension}`;
    const client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      objectKey,
      url: this.s3PublicUrl(config, objectKey),
    };
  }

  private uploadRoot(): string {
    return process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');
  }

  private publicOrigin(): string {
    return (
      process.env.PUBLIC_API_ORIGIN ??
      `http://localhost:${process.env.PORT ?? '4000'}`
    ).replace(/\/$/, '');
  }

  private extensionForMime(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'application/pdf':
        return '.pdf';
      default:
        return '.bin';
    }
  }

  private maxSize(type: 'image' | 'document'): number {
    return type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  }

  private s3Config(): S3StorageConfig | undefined {
    const bucket = process.env.S3_BUCKET ?? process.env.AWS_S3_BUCKET;
    const accessKeyId =
      process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
    if (!bucket || !accessKeyId || !secretAccessKey) {
      return undefined;
    }

    return {
      bucket,
      accessKeyId,
      secretAccessKey,
      region: process.env.S3_REGION ?? process.env.AWS_REGION ?? 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle:
        String(process.env.S3_FORCE_PATH_STYLE ?? '').toLowerCase() === 'true',
      publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
    };
  }

  private s3PublicUrl(config: S3StorageConfig, objectKey: string): string {
    if (config.publicBaseUrl) {
      return `${config.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`;
    }

    if (config.endpoint) {
      return `${config.endpoint.replace(/\/$/, '')}/${config.bucket}/${objectKey}`;
    }

    return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${objectKey}`;
  }

  private safeFilename(value: string): string {
    return value
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
  }
}
