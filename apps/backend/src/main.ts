import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, static as expressStatic, urlencoded } from 'express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { ApiResponseInterceptor } from './common/api-response.interceptor';
import { HttpErrorFilter } from './common/http-error.filter';
import { corsOriginsFromEnv } from './config/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressInstance = app.getHttpAdapter().getInstance() as {
    disable?: (setting: string) => void;
    set?: (setting: string, value: unknown) => void;
  };
  expressInstance.disable?.('x-powered-by');
  // Nginx/Railway kabi reverse-proxy orqasida ishga tushadi — bu
  // bo'lmasa Express har doim proxy'ning o'z manzilini "mijoz IP"
  // sifatida ko'radi va IP-asosidagi rate-limit (@nestjs/throttler)
  // barcha foydalanuvchilar uchun bitta umumiy hovuzga aylanib qoladi.
  // "1" — aynan bitta proxy qatlamiga ishonish (to'g'ridan-to'g'ri orqada
  // turgan nginx/edge), undan uzoqroqdagi sarlavhalarga ishonilmaydi.
  expressInstance.set?.('trust proxy', 1);
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('API_PREFIX', 'v1');
  const uploadRoot = config.get<string>(
    'UPLOADS_DIR',
    join(process.cwd(), 'uploads'),
  );

  // Uchala frontend (user, partner, admin) shu API'ga ulanadi.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use('/uploads', expressStatic(uploadRoot));
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));
  app.use(
    (
      _request: unknown,
      response: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      // API javoblari brauzer/oraliq keshda saqlanmasin — masalan, admin
      // panel sozlamalarini (texnik xizmat rejimi kabi) yangilagandan
      // keyin eski qiymat keshdan "qaytib qolishi" mumkin edi.
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=()',
      );
      next();
    },
  );
  app.enableCors({
    origin: corsOriginsFromEnv(config.get<string>('CORS_ORIGINS')),
    credentials: true,
  });
  app.use(
    (
      request: { url: string; legacyApiPrefix?: boolean },
      _response: unknown,
      next: () => void,
    ) => {
      if (request.url === '/api' || request.url.startsWith('/api/')) {
        request.legacyApiPrefix = true;
        request.url = request.url.replace(/^\/api(?=\/|$)/, `/${apiPrefix}`);
      }
      next();
    },
  );
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());

  if (config.get<string>('SWAGGER_ENABLED', 'true') !== 'false') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('safaar API')
      .setDescription('safaar.uz user, partner and admin backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey(
        { type: 'apiKey', name: 'x-api-key', in: 'header' },
        'partner-api-key',
      )
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(config.get<number>('PORT', 4000));
}
void bootstrap();
