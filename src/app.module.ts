import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { BullBoardModule } from '@bull-board/nestjs'
import * as expressBasicAuth from 'express-basic-auth'

import { DLQ_QUEUE, WEBHOOK_QUEUE } from '@/common/constants'
import { redisConfig } from '@/config/redis.config'
import { HealthModule } from '@/health/health.module'
import { WebhookModule } from '@/webhook/webhook.module'

import { appConfig } from './config/app.config'
import { envSchema } from './config/env.schema'
import { DatabaseModule } from './database/database.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, redisConfig],
            validate: (env) => {
                const result = envSchema.safeParse(env)
                if (!result.success) {
                    console.error('❌ Invalid env:', result.error.flatten().fieldErrors)
                    process.exit(1)
                }
                return result.data
            },
        }),

        BullModule.forRootAsync({
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.get<string>('redis.host'),
                    port: config.get<number>('redis.port'),
                },
            }),
            inject: [ConfigService],
        }),

        BullBoardModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                route: '/queues',
                adapter: ExpressAdapter,
                middleware: expressBasicAuth({
                    users: {
                        [configService.getOrThrow('app.bullBoardUser')]:
                            configService.getOrThrow('app.bullBoardPassword'),
                    },
                    challenge: true,
                }),
                options: {
                    uiConfig: {
                        boardTitle: 'Discord Webhook Delivery',
                        boardLogo: {
                            path: 'https://discord.com/assets/discord-mark-blue.svg',
                            width: 30,
                            height: 30,
                        },
                        miscLinks: [
                            {
                                text: 'Swagger',
                                url: '/api-doc',
                            },
                        ],
                        favIcon: {
                            default: 'https://discord.com/assets/favicon.ico',
                            alternative: 'https://discord.com/assets/favicon.ico',
                        },
                    },
                },
            }),
            inject: [ConfigService],
        }),

        BullBoardModule.forFeature({
            name: WEBHOOK_QUEUE,
            adapter: BullMQAdapter,
        }),

        BullBoardModule.forFeature({
            name: DLQ_QUEUE,
            adapter: BullMQAdapter,
        }),

        DatabaseModule,

        WebhookModule,

        HealthModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
