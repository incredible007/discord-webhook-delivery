import { Body, Controller, Inject, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { EventVariantValues } from '@/database/types'
import {
    WEBHOOK_EMBED_FACTORY,
    WebhookEmbedFactoryI,
} from '@/webhook/interfaces/webhook-embed-factory.interface'

import { SendWebhookDto } from '../dto/send-webhook.dto'
import { WebhookService } from '../webhook.service'

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
    constructor(
        private readonly webhookService: WebhookService,
        @Inject(WEBHOOK_EMBED_FACTORY)
        private readonly webhookEmbedFactory: WebhookEmbedFactoryI,
    ) {}

    @Post('send')
    @ApiOperation({ summary: 'Enqueue a Discord webhook' })
    async send(@Body() dto: SendWebhookDto) {
        const payload = this.webhookEmbedFactory.userRegistered(dto.email)
        await this.webhookService.enqueue(EventVariantValues.USER_REGISTERED, payload)
        return { queued: true }
    }
}
