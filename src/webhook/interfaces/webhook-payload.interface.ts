import { type DiscordEmbedI } from '@/webhook/interfaces/discord-embed.interface'

export interface WebhookPayloadI {
    url: string
    embed: DiscordEmbedI
}
