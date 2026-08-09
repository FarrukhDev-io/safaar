import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PostgresService } from './../src/infrastructure/postgres.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresService)
      .useValue({
        query: jest.fn().mockResolvedValue([]),
        transaction: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({
      status: 'ok',
      service: 'safaar-api',
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
