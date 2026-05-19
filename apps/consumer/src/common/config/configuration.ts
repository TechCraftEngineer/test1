export default () => ({
  port: parseInt(process.env.CONSUMER_PORT ?? '3002', 10),
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
    prefetch: parseInt(process.env.RABBITMQ_PREFETCH ?? '10', 10),
    maxRetries: parseInt(process.env.RABBITMQ_CONSUMER_MAX_RETRIES ?? '3', 10),
  },
});
