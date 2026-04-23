import { InjectQueue } from '@nestjs/bullmq'
import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { Queue } from 'bullmq'

import { WEBHOOK_JOB, WEBHOOK_QUEUE } from '@/common/constants'
import { WebhookJobPayloadI } from '@/webhook/interfaces/webhook-job-payload.interface'
import {
    WEBHOOK_REPOSITORY,
    WebhookRepositoryI,
} from '@/webhook/interfaces/webhook-repository.interface'

@Injectable()
export class OutboxPoller implements OnModuleDestroy, OnModuleInit {
    private isRunning = true

    constructor(
        @InjectQueue(WEBHOOK_QUEUE)
        private readonly webhookQueue: Queue<WebhookJobPayloadI>,
        @Inject(WEBHOOK_REPOSITORY)
        private readonly webhookRepository: WebhookRepositoryI,
    ) {}

    async onModuleInit() {
        await this.scheduleNextPoll()
    }

    onModuleDestroy() {
        this.isRunning = false
    }

    private async scheduleNextPoll() {
        try {
            await this.poll()
        } finally {
            if (this.isRunning) {
                setTimeout(() => this.scheduleNextPoll(), 2000)
            }
        }
    }

    private async poll() {
        await this.webhookRepository.claimPendingBatch(async (res) => {
            for (const item of res) {
                await this.webhookQueue.add(
                    WEBHOOK_JOB,
                    {
                        payload: item.payload,
                        outboxId: item.oid,
                    },
                    {
                        jobId: `webhook-${item.idempotencyKey}`,
                    },
                )
            }
        })
    }
}
