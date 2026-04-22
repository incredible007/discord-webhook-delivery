import { Injectable, Module } from '@nestjs/common'

import { WebhookEmbedFactory } from '@/webhook/factory/webhook-embed.factory'
import { WEBHOOK_EMBED_FACTORY } from '@/webhook/interfaces/webhook-embed-factory.interface'

import { WebhookController } from './controllers/webhook.controller'
import { WEBHOOK_REPOSITORY } from './interfaces/webhook-repository.interface'
import { WebhookRepository } from './webhook.repository'
import { WebhookService } from './webhook.service'

@Module({
    controllers: [WebhookController],
    imports: [],
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
    ],
})
export class WebhookModule {}
