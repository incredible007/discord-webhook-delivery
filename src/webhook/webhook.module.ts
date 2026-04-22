import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { DLQ_QUEUE, WEBHOOK_QUEUE } from '@/common/constants'
import { ApiKeyGuard } from '@/common/guards/api-key.guard'
import { WebhookEmbedFactory } from '@/webhook/factory/webhook-embed.factory'
import { WEBHOOK_EMBED_FACTORY } from '@/webhook/interfaces/webhook-embed-factory.interface'
import { OutboxPoller } from '@/webhook/outbox.poller'
import { WebhookProcessor } from '@/webhook/webhook.processor'

import { WebhookController } from './controllers/webhook.controller'
import { WEBHOOK_REPOSITORY } from './interfaces/webhook-repository.interface'
import { WebhookRepository } from './webhook.repository'
import { WebhookService } from './webhook.service'

@Module({
    controllers: [WebhookController],
    imports: [
        BullModule.registerQueue({
            name: WEBHOOK_QUEUE,
            defaultJobOptions: {
                attempts: 10,
                backoff: {
                    type: 'custom',
                },
                removeOnComplete: {
                    count: 100,
                },
                removeOnFail: false,
            },
        }),

        BullModule.registerQueue({
            name: DLQ_QUEUE,
            defaultJobOptions: {
                attempts: 10,
                backoff: {
                    type: 'custom',
                },
                removeOnComplete: {
                    count: 100,
                },
                removeOnFail: false,
            },
        }),
    ],
    providers: [
        WebhookService,

        {
            provide: WEBHOOK_REPOSITORY,
            useClass: WebhookRepository,
        },

        {
            provide: WEBHOOK_EMBED_FACTORY,
            useClass: WebhookEmbedFactory,
        },

        WebhookEmbedFactory,
        WebhookProcessor,
        OutboxPoller,
        ApiKeyGuard,
    ],
})
export class WebhookModule {}
