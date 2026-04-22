import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { WebhookModule } from '@/webhook/webhook.module'

import { appConfig } from './config/app.config'
import { envSchema } from './config/env.schema'
import { DatabaseModule } from './database/database.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
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

        DatabaseModule,

        WebhookModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
