import { registerAs } from '@nestjs/config'

export const redisConfig = registerAs('redis', () => ({
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!, 10),
    ttl: parseInt(process.env.REDIS_TTL!, 10),
}))
