import { Injectable, Module } from '@nestjs/common'

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
    ],
})
export class WebhookModule {}
