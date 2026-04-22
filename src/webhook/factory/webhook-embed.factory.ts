import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { WebhookEmbedFactoryI } from '@/webhook/interfaces/webhook-embed-factory.interface'
import { type WebhookPayloadI } from '@/webhook/interfaces/webhook-payload.interface'

export const DISCORD_COLORS = {
    SUCCESS: 0x00ff00, // зелёный
    ERROR: 0xff0000, // красный
    WARNING: 0xffa500, // оранжевый
    INFO: 0x0099ff, // синий
    PRIMARY: 0x5865f2, // фирменный цвет Discord
} as const

@Injectable()
export class WebhookEmbedFactory implements WebhookEmbedFactoryI {
    constructor(private readonly configService: ConfigService) {}

    userRegistered(email: string): WebhookPayloadI {
        const url = this.configService.getOrThrow<string>('app.discordWebhookUserRegistered')

        return {
            url,
            embed: {
                title: '🎉 Новая регистрация',
                color: DISCORD_COLORS.SUCCESS,
                timestamp: new Date().toISOString(), // время события

                author: {
                    name: 'Discord Webhook Delivery',
                    icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
                },

                fields: [
                    {
                        name: '📧 Email',
                        value: email,
                        inline: true,
                    },
                    {
                        name: '📅 Дата',
                        value: new Date().toLocaleDateString('ru-RU'),
                        inline: true,
                    },
                ],

                footer: {
                    text: 'DISCORD WEBHOOK DELIVERY',
                },

                thumbnail: {
                    url: 'https://cdn.discordapp.com/embed/avatars/0.png',
                },
            },
        }
    }
}
