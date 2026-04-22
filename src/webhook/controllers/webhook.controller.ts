import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger'

import { ApiKeyGuard } from '@/common/guards/api-key.guard'
import { EventVariantValues } from '@/database/types'
import {
    WEBHOOK_EMBED_FACTORY,
    WebhookEmbedFactoryI,
} from '@/webhook/interfaces/webhook-embed-factory.interface'

import { SendWebhookDto } from '../dto/send-webhook.dto'
import { WebhookService } from '../webhook.service'

@ApiTags('webhook')
@Controller('webhook')
@UseGuards(ApiKeyGuard)
export class WebhookController {
    constructor(
        private readonly webhookService: WebhookService,
        @Inject(WEBHOOK_EMBED_FACTORY)
        private readonly webhookEmbedFactory: WebhookEmbedFactoryI,
    ) {}

    @Post('send')
    @ApiOperation({ summary: 'Enqueue a Discord webhook' })
    @ApiHeader({ name: 'x-api-key', required: true })
    async send(@Body() dto: SendWebhookDto) {
        const payload = this.webhookEmbedFactory.userRegistered(dto.email)
        await this.webhookService.enqueue(EventVariantValues.USER_REGISTERED, payload)
        return { queued: true }
    }
}
