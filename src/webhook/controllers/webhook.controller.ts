import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger'

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
@ApiSecurity('x-api-key')
export class WebhookController {
    constructor(
        private readonly webhookService: WebhookService,
        @Inject(WEBHOOK_EMBED_FACTORY)
        private readonly webhookEmbedFactory: WebhookEmbedFactoryI,
    ) {}

    @Post('send')
    @ApiHeader({ name: 'x-api-key', required: true })
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({
        summary: 'Enqueue a Discord webhook',
        description:
            'Помещает вебхук в очередь. Доставка гарантирована через Outbox Pattern + BullMQ.',
    })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        description: 'Вебхук принят в очередь',
        schema: {
            example: { queued: true },
        },
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Неверный или отсутствующий API ключ',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Невалидные данные запроса',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Вебхук с таким ключом уже существует',
    })
    async send(@Body() dto: SendWebhookDto) {
        const payload = this.webhookEmbedFactory.userRegistered(dto.email)
        await this.webhookService.enqueue(EventVariantValues.USER_REGISTERED, payload)
        return { queued: true }
    }
}
