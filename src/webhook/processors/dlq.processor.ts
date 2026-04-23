import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import { DLQ_JOB, DLQ_QUEUE } from '@/common/constants'
import { DlqJobPayloadI } from '@/webhook/interfaces/dlq-job-payload.interface'
import {
    WEBHOOK_REPOSITORY,
    WebhookRepositoryI,
} from '@/webhook/interfaces/webhook-repository.interface'

@Processor(DLQ_QUEUE)
export class DlqProcessor extends WorkerHost {
    private readonly logger = new Logger(DlqProcessor.name)

    constructor(
        @Inject(WEBHOOK_REPOSITORY)
        private readonly webhookRepository: WebhookRepositoryI,
    ) {
        super()
    }

    async process(job: Job<DlqJobPayloadI>): Promise<void> {
        if (job.name !== DLQ_JOB) return

        const { originalJob, reason, failedAt } = job.data

        await this.webhookRepository.updateError(originalJob.outboxId, reason)

        this.logger.error({
            message: 'Webhook permanently failed',
            outboxId: originalJob.outboxId,
            reason,
            failedAt,
        })
    }
}
