import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EVENT_PUBLISHER } from '../src/domain/ports/event-publisher.port';
import { RabbitMqEventPublisher } from '../src/infrastructure/rabbitmq/rabbitmq-event.publisher';

describe('Producer (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMqEventPublisher)
      .useValue({ onModuleInit: jest.fn(), onModuleDestroy: jest.fn() })
      .overrideProvider(EVENT_PUBLISHER)
      .useValue({ publish: jest.fn().mockResolvedValue(undefined) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(() => app.close());

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
