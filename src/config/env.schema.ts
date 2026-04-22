import { z } from 'zod'

export const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['DEV', 'PROD', 'TEST']).default('DEV'),

    APP_URL: z.string().url(),
    DB_URL: z.string().url(),

    DISCORD_WEBHOOK_USER_REGISTERED: z.string().url(),

    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_TTL: z.coerce.number().default(300),

    BULL_BOARD_USER: z.string().min(1),
    BULL_BOARD_PASSWORD: z.string().min(1),

    API_KEY: z.string().min(32),
})

export type Env = z.infer<typeof envSchema>
