# EventPing

## Что нужно

- [Bun](https://bun.sh/) ≥ 1.1  
  Windows (PowerShell): `irm bun.sh/install.ps1 | iex`  
  Linux/macOS: `curl -fsSL https://bun.sh/install | bash`
- [Docker](https://www.docker.com/) — для RabbitMQ (и опционально для всех сервисов)

## Установка

```bash
git clone <url-репозитория>
cd eventping

cp .env.example .env
```

Откройте `.env` и укажите `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` (см. ниже).

```bash
bun install
bun run build
```

## Запуск

### Локально (RabbitMQ в Docker)

```bash
docker compose up -d rabbitmq
bun run dev
```

Сервисы: producer — http://localhost:3001, consumer — http://localhost:3002, telegram — http://localhost:3003.

### Всё в Docker

```bash
docker compose up --build
```

Перед этим заполните `.env` (токен и chat id).

### Проверка

```bash
curl -X POST http://localhost:3001/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{"type":"order.created","payload":{"orderId":42}}'
```

В Telegram должно прийти уведомление.

RabbitMQ Management UI: http://localhost:15672 (логин `guest`, пароль `guest`).

## Telegram: токен и chat id

### 1. Токен бота

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather).
2. Отправьте `/newbot` (или `/token`, если бот уже есть).
3. Укажите имя и username бота (username должен заканчиваться на `bot`).
4. BotFather пришлёт токен вида `123456789:AAH...` — скопируйте его в `.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Chat id

Бот может писать только туда, куда вы его «подключили».

**Личные сообщения**

1. Напишите боту любое сообщение (например `/start`).
2. Откройте в браузере (подставьте свой токен):

   `https://api.telegram.org/bot<ТОКЕН>/getUpdates`

3. В ответе найдите `"chat":{"id":123456789,...}` — это `TELEGRAM_CHAT_ID`.

**Группа**

1. Добавьте бота в группу.
2. Напишите в группе любое сообщение.
3. Снова откройте `getUpdates` и возьмите `chat.id` (для групп id обычно отрицательный, например `-1001234567890`).

В `.env`:

```env
TELEGRAM_CHAT_ID=123456789
```

Перезапустите сервисы после изменения `.env`.

## Переменные окружения

Полный список — в [.env.example](.env.example). Обязательно для работы уведомлений: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
