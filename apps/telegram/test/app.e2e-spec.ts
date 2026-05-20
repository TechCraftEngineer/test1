import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RabbitMqService } from '../src/infrastructure/rabbitmq/rabbitmq.service';
import { TelegramService } from '../src/infrastructure/telegram/telegram.service';

describe('Telegram (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.TELEGRAM_BOT_TOKEN ??= 'test-token';
    process.env.TELEGRAM_CHAT_ID ??= '123456789';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMqService)
      .useValue({
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
        setNotificationHandler: jest.fn(),
      })
      .overrideProvider(TelegramService)
      .useValue({ sendMessage: jest.fn().mockResolvedValue(undefined) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /health returns ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'telegram' });
  });

  it('POST /notifications/send', () => {
    return request(app.getHttpServer())
      .post('/notifications/send')
      .send({ text: 'Test message' })
      .expect(201)
      .expect({ status: 'sent' });
  });
});
