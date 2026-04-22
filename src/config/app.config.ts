import { registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => ({
    port: parseInt(process.env.PORT!, 10),
    nodeEnv: process.env.NODE_ENV!,
    apiUrl: process.env.APP_URL!,
}))
