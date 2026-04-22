import { InjectQueue } from '@nestjs/bullmq'
import { Inject, Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'

import { WEBHOOK_JOB, WEBHOOK_QUEUE } from '@/common/constants'
import { EventVariants } from '@/database/types'
import { IDiscordEmbed } from '@/webhook/interfaces/discord-embed.interface'
import {
    WEBHOOK_REPOSITORY,
    WebhookRepositoryInterface,
} from '@/webhook/interfaces/webhook-repository.interface'

@Injectable()
export class WebhookService {
    constructor(
        @Inject(WEBHOOK_REPOSITORY)
        private readonly webhookRepository: WebhookRepositoryInterface,
        @InjectQueue(WEBHOOK_QUEUE)
        private readonly webhookQueue: Queue,
    ) {}

    async enqueue(variant: EventVariants, embed: IDiscordEmbed): Promise<void> {
        await this.webhookRepository.insertEvent(variant, embed)
        await this.webhookQueue.add(WEBHOOK_JOB, embed)
    }
}
