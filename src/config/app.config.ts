import { registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => ({
    port: parseInt(process.env.PORT!, 10),
    nodeEnv: process.env.NODE_ENV!,
    apiUrl: process.env.APP_URL!,
    discordWebhookUserRegistered: process.env.DISCORD_WEBHOOK_USER_REGISTERED!,

    bullBoardUser: process.env.BULL_BOARD_USER,
    bullBoardPassword: process.env.BULL_BOARD_PASSWORD,

    apiKey: process.env.API_KEY,
}))
