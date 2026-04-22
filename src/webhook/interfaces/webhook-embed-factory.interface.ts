import type { WebhookPayloadI } from '@/webhook/interfaces/webhook-payload.interface'

export const WEBHOOK_EMBED_FACTORY = Symbol.for('WEBHOOK_EMBED_FACTORY')

export interface WebhookEmbedFactoryI {
    userRegistered(email: string): WebhookPayloadI
}
