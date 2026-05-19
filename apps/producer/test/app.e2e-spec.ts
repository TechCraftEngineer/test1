import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RabbitMqService } from '../src/infrastructure/rabbitmq/rabbitmq.service';

describe('Producer (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMqService)
      .useValue({
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
        publishEvent: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/events validates and returns published event', () => {
    return request(app.getHttpServer())
      .post('/api/v1/events')
      .send({ type: 'order.created', payload: { orderId: 1 } })
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('published');
        expect(res.body.event.type).toBe('order.created');
        expect(res.body.event.id).toBeDefined();
      });
  });
});
