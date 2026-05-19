export default () => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken?.trim()) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }
  if (!chatId?.trim()) {
    throw new Error('TELEGRAM_CHAT_ID is required');
  }

  return {
    port: parseInt(process.env.TELEGRAM_PORT ?? '3003', 10),
    rabbitmq: {
      url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
      prefetch: parseInt(process.env.RABBITMQ_PREFETCH ?? '10', 10),
      maxRetries: parseInt(process.env.RABBITMQ_CONSUMER_MAX_RETRIES ?? '3', 10),
    },
    telegram: {
      botToken,
      chatId,
      apiBaseUrl: 'https://api.telegram.org',
    },
  };
};
