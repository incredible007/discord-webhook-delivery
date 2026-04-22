import { type WebhookPayloadI } from '@/webhook/interfaces/webhook-payload.interface'

export interface WebhookJobPayloadI {
    payload: WebhookPayloadI
    outboxId: number
}
