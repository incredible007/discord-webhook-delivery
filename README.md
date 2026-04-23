# Discord Webhook Delivery Service

Микросервис для **надёжной асинхронной доставки Discord-вебхуков** с гарантией at-least-once delivery.

**Бизнес-задача:** когда внешнее приложение (например, система регистрации пользователей) хочет отправить уведомление в Discord, прямой HTTP-вызов ненадёжен — Discord может быть недоступен, вернуть rate-limit или временную ошибку. Этот сервис принимает запрос мгновенно, сохраняет его в БД и гарантирует доставку, даже если Discord временно не отвечает.

---

## Архитектура


| Компонент | Ответственность                                                                                                                                         |
|---|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `WebhookController` | Принимает HTTP-запросы, валидирует DTO, проверяет API-ключ                                                                                              |
| `WebhookService` | Записывает событие в outbox-таблицу                                                                                                                     |
| `WebhookRepository` | Вся работа с БД: вставка, claim batch, обновление статусов                                                                                              |
| `OutboxPoller` | Каждые 2 секунды читает `PENDING`-события из outbox и пушит их в BullMQ, сброс зависших джобов                                                          |
| `WebhookProcessor` | Забирает джобы из очереди, делает HTTP POST в Discord, обрабатывает rate-limit (429) и ошибки                                                           |
| `DlqProcessor` | Обрабатывает мёртвые джобы (Dead Letter Queue): записывает причину финального фейла в outbox                                                            |
| `WebhookEmbedFactory` | Отвечает за формирование Discord embed-объекта под конкретный тип события. Это единственное место, где знают, как событие выглядит визуально в Discord. |

---

## Схема базы данных

> Полная DBML-схема: [dbdiagram.io](https://dbdiagram.io/d/discord-webhook-delivery-69e8e5f41bbca03312144667)

### Таблица `outbox`

| Колонка | Тип | Описание |
|---|---|---|
| `oid` | `bigint` (PK, identity) | Первичный ключ |
| `idempotency_key` | `varchar(200)` | Уникальный ключ для идемпотентности |
| `event_variant` | `enum` | Тип события (`USER_REGISTERED`) |
| `event_state` | `enum` | Статус: `PENDING` → `PROCESSING` → `SUCCEEDED` / `FAILED` |
| `payload` | `jsonb` | Данные для отправки в Discord |
| `attempts` | `smallint` | Счётчик попыток (≥ 0, есть check constraint) |
| `error_message` | `text` | Причина финального фейла (заполняется DLQ) |
| `created_at` | `timestamptz` | Дата создания |
| `processing_at` | `timestamptz` | Когда взято в работу (для детекции зависших) |
| `processed_at` | `timestamptz` | Когда успешно доставлено |

### Индексы

| Индекс | Тип | Назначение |
|---|---|---|
| `idx_outbox_event_state_pending` | **Partial B-tree** (`WHERE event_state = 'PENDING'`) | Быстрый поллинг незаконченных событий, не тратит место на `SUCCEEDED`/`FAILED` |
| `idx_outbox_created_at` | B-tree по `created_at` | Сортировка и аналитика по времени создания |
| `idempotency_key_unique` | Unique | Гарантия уникальности на уровне БД (ON CONFLICT DO NOTHING) |

---

## Идемпотентность

При попытке вставить событие с уже существующим `idempotency_key` срабатывает `ON CONFLICT DO NOTHING` на уровне БД, и сервис возвращает `409 Conflict`. Это исключает дублирование доставки даже при повторных запросах от клиента.

Дополнительно, при добавлении джоба в BullMQ используется `jobId: webhook-{idempotencyKey}` — BullMQ не создаст дубль джоба с тем же `jobId`.

---

## Защита API

Все эндпоинты контроллера защищены `ApiKeyGuard`. Ключ передаётся в заголовке:

x-api-key: <your-api-key>


Ключ задаётся через переменную окружения и валидируется через `ConfigService`. При неверном или отсутствующем ключе возвращается `401 Unauthorized`.

---

## Переменные окружения

```env
API_KEY

NODE_ENV
APP_URL
PORT
DB_URL

REDIS_HOST
REDIS_PORT
REDIS_TTL

BULL_BOARD_USER
BULL_BOARD_PASSWORD

DISCORD_WEBHOOK_USER_REGISTERED
```

---

## Почему BullMQ?

- **Персистентность** — очередь хранится в Redis, джобы не теряются при перезапуске
- **Retry с backoff** — экспоненциальная задержка между попытками (настраивается через `backoffStrategy`)
- **Rate limiting** — встроенный `limiter` (2 req/s) для соблюдения лимитов Discord API
- **Delayed jobs** — при получении `429` джоб откладывается на точное время из заголовка `Retry-After`
- **Dead Letter Queue** — неизлечимые ошибки (`400`, исчерпание попыток) уходят в DLQ для аудита
- **Bull Board** — готовый UI для мониторинга очередей из коробки

Альтернативы (`pg-boss`, самописный cron) не дают такого уровня наблюдаемости и гибкости одновременно.

---

## Логирование и мониторинг

- **NestJS Logger** — структурированные логи в каждом процессоре: успех, rate-limit warn, финальные ошибки
- **Bull Board UI** — визуальный мониторинг очередей: `discord-webhook.andrewpodgola.pro/queues`
- **Health check** — эндпоинт `/health` для проверки состояния сервиса (используется в Docker healthcheck)
- **Swagger** — документация API: `discord-webhook.andrewpodgola.pro/api-doc`

---

## Деплой

Сервис задеплоен на: **[webhook-discord.andrewpodgola.pro](https://webhook-discord.andrewpodgola.pro/)**

| Ресурс | URL |
|---|---|
| Swagger UI | [webhook-discord.andrewpodgola.pro/api-doc](https://webhook-discord.andrewpodgola.pro/api-doc) |
| Bull Board | [webhook-discord.andrewpodgola.pro/queues](https://webhook-discord.andrewpodgola.pro/queues) |

Деплой производится через **Docker + Docker Compose**:

bash docker compose up -d --build


Стек контейнеров:
- **app** — NestJS-приложение (порт 3000 внутри, проброшен на 24000)
- **redis** — Redis 7 Alpine для BullMQ (healthcheck через `redis-cli ping`)

Оба контейнера объединены в общую сеть `nestjs-network`. Redis-данные персистируются через named volume `redis_data`. Приложение стартует только после того, как Redis пройдёт healthcheck.

---

## Пути развития

### Что можно упростить

- **Убрать outbox-таблицу + OutboxPoller** — если требования к надёжности снижены, можно добавлять джобы напрямую в BullMQ без персистентности в Postgres. Тогда при падении Redis часть сообщений потеряется, но реализация станет значительно проще
- **Убрать DLQ** — в совсем простом варианте достаточно просто логировать финальные ошибки без отдельной очереди

### Что можно добавить

- **Поддержка нескольких типов событий** — сейчас реализован только `USER_REGISTERED`. Легко расширяется через новые значения `event_variants` enum и методы в `WebhookEmbedFactory`
- **Вебхуки для внешних систем** — сейчас URL захардкожен. Можно сделать `url` динамическим полем, принимаемым в запросе
- **Метрики (Prometheus + Grafana)** — добавить счётчики успешных/упавших доставок, latency, глубину очереди
- **Retry-политика на уровне DLQ** — сейчас DLQ финален. Можно добавить ручной или автоматический повтор через UI
- **Архивация завершённых записей** — партиционирование или перенос старых `SUCCEEDED` записей в архивную таблицу, чтобы outbox не разрастался