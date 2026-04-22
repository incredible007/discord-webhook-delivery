import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { EventVariantValues } from '@/database/types'

import { SendWebhookDto } from '../dto/send-webhook.dto'
import { WebhookService } from '../webhook.service'

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
    constructor(private readonly webhookService: WebhookService) {}

    @Post('send')
    @ApiOperation({ summary: 'Enqueue a Discord webhook' })
    async send(@Body() dto: SendWebhookDto) {
        // await this.webhookService.enqueue(EventVariantValues.USER_REGISTERED, dto)
        // return { queued: true }
    }
}
