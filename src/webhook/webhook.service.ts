import { InjectQueue } from '@nestjs/bullmq'
import { Inject, Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'

import { WEBHOOK_JOB, WEBHOOK_QUEUE } from '@/common/constants'
import { EventVariants } from '@/database/types'
import { IWebhookPayload } from '@/webhook/interfaces/webhook-payload.interface'
import {
    WEBHOOK_REPOSITORY,
    WebhookRepositoryI,
} from '@/webhook/interfaces/webhook-repository.interface'

@Injectable()
export class WebhookService {
    constructor(
        @Inject(WEBHOOK_REPOSITORY)
        private readonly webhookRepository: WebhookRepositoryI,
        @InjectQueue(WEBHOOK_QUEUE)
        private readonly webhookQueue: Queue,
    ) {}

    async enqueue(variant: EventVariants, payload: IWebhookPayload): Promise<void> {
        const inserted = await this.webhookRepository.insertEvent(variant, payload)

        await this.webhookQueue.add(WEBHOOK_JOB, {
            payload,
            outboxId: inserted.oid,
        })
    }
}
