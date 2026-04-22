import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { WebhookEmbedFactoryI } from '@/webhook/interfaces/webhook-embed-factory.interface'
import { type WebhookPayloadI } from '@/webhook/interfaces/webhook-payload.interface'

@Injectable()
export class WebhookEmbedFactory implements WebhookEmbedFactoryI {
    constructor(private readonly configService: ConfigService) {}

    userRegistered(email: string): WebhookPayloadI {
        const url = this.configService.getOrThrow<string>('app.discordWebhookUserRegistered')

        return {
            url,
            embed: {
                title: 'Новая регистрация',
                description: `Пользователь ${email} зарегистрировался`,
                color: 0x00ff00,
            },
        }
    }
}
