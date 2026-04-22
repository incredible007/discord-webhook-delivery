import { type DiscordEmbedI } from '@/webhook/interfaces/discord-embed.interface'

export interface IWebhookPayload {
    url: string
    embed: DiscordEmbedI
}
