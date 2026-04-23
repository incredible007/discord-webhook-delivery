import { ConflictException, Inject, Injectable } from '@nestjs/common'

import { EventVariants } from '@/database/types'
import { WebhookPayloadI } from '@/webhook/interfaces/webhook-payload.interface'
import {
    WEBHOOK_REPOSITORY,
    WebhookRepositoryI,
} from '@/webhook/interfaces/webhook-repository.interface'

@Injectable()
export class WebhookService {
    constructor(
        @Inject(WEBHOOK_REPOSITORY)
        private readonly webhookRepository: WebhookRepositoryI,
    ) {}

    async enqueue(variant: EventVariants, payload: WebhookPayloadI): Promise<void> {
        const inserted = await this.webhookRepository.insertEvent(variant, payload)

        if (!inserted) {
            throw new ConflictException(`Webhook with key ${payload.idempotencyKey} already exists`)
        }
    }
}
