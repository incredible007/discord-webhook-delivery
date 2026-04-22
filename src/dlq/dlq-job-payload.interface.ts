import { type WebhookJobPayloadI } from '@/webhook/interfaces/webhook-job-payload.interface'

export interface DlqJobPayloadI {
    originalJob: WebhookJobPayloadI
    reason: string
    failedAt: Date
}
