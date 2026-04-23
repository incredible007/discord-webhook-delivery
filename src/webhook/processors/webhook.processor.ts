import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { DelayedError, Job, Queue, UnrecoverableError } from 'bullmq'

import { DLQ_JOB, DLQ_QUEUE, WEBHOOK_QUEUE } from '@/common/constants'
import { DISCORD_WEBHOOK_BODY } from '@/common/constants/discord.constants'
import { EventStatesValues } from '@/database/types'
import { DlqJobPayloadI } from '@/webhook/interfaces/dlq-job-payload.interface'
import { WebhookJobPayloadI } from '@/webhook/interfaces/webhook-job-payload.interface'
import {
    WEBHOOK_REPOSITORY,
    WebhookRepositoryI,
} from '@/webhook/interfaces/webhook-repository.interface'

@Processor(WEBHOOK_QUEUE)
export class WebhookProcessor extends WorkerHost {
    private readonly logger = new Logger(WebhookProcessor.name)

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
                ...DISCORD_WEBHOOK_BODY,
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
            await this.webhookRepository.updateStatus(outboxId, 'PENDING')
            this.logger.warn(`Rate limited, retry after ${retryAfter}s, outboxId: ${outboxId}`)
            await job.moveToDelayed(Date.now() + retryAfter * 1000)
            throw new DelayedError()
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
