import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Job, Queue, UnrecoverableError } from 'bullmq'

import { DLQ_JOB, DLQ_QUEUE, WEBHOOK_QUEUE } from '@/common/constants'
import { EventStatesValues } from '@/database/types'
import { DlqJobPayloadI } from '@/webhook/interfaces/dlq-job-payload.interface'
import { WebhookJobPayloadI } from '@/webhook/interfaces/webhook-job-payload.interface'
import {
    WEBHOOK_REPOSITORY,
    WebhookRepositoryI,
} from '@/webhook/interfaces/webhook-repository.interface'

@Processor(WEBHOOK_QUEUE, {
    limiter: {
        max: 2,
        duration: 1000,
    },
})
export class WebhookProcessor extends WorkerHost {
    private readonly logger = new Logger(WebhookProcessor.name)

    private readonly WEBHOOK_BODY = {
        content: '',
        tts: false,
        components: [],
    }

    constructor(
        @InjectQueue(DLQ_QUEUE)
        private readonly dlQueue: Queue<DlqJobPayloadI>,
        @Inject(WEBHOOK_REPOSITORY)
        private readonly webhookRepository: WebhookRepositoryI,
    ) {
        super()
    }

    async process(job: Job<WebhookJobPayloadI>): Promise<void> {
        const { payload, outboxId } = job.data

        const res = await fetch(payload.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...this.WEBHOOK_BODY,
                embeds: [payload.embed],
            }),
        })

        if (res.ok) {
            await this.webhookRepository.markProcessed(outboxId)
            this.logger.log(`Webhook sent successfully, outboxId: ${outboxId}`)
            return
        }

        if (res.status === 429) {
            const retryAfter = Number(res.headers.get('Retry-After') ?? 1)
            this.logger.warn(`Rate limited, retry after ${retryAfter}s, outboxId: ${outboxId}`)
            throw new Error(`Rate limited. Retry after ${retryAfter}s`)
        }

        if (res.status === 400) {
            this.logger.error(`Invalid webhook payload, outboxId: ${outboxId}`)
            await this.webhookRepository.updateStatus(outboxId, EventStatesValues.FAILED)
            await this.dlQueue.add(DLQ_JOB, {
                originalJob: job.data,
                reason: 'Invalid webhook payload (400)',
                failedAt: new Date(),
            })
            throw new UnrecoverableError('Invalid webhook payload')
        }

        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 0)
        if (isLastAttempt) {
            await this.webhookRepository.updateStatus(outboxId, EventStatesValues.FAILED)
            await this.dlQueue.add(DLQ_JOB, {
                originalJob: job.data,
                reason: `Exhausted all ${job.opts.attempts} attempts`,
                failedAt: new Date(),
            })
        }

        throw new Error(`Unexpected response status: ${res.status}`)
    }
}
