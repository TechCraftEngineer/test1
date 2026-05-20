export default () => ({
  port: parseInt(process.env.PRODUCER_PORT ?? '3001', 10),
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
    publishRetries: parseInt(process.env.RABBITMQ_PUBLISH_RETRIES ?? '3', 10),
    drainTimeoutMs: parseInt(process.env.RABBITMQ_DRAIN_TIMEOUT_MS ?? '30000', 10),
  },
});
