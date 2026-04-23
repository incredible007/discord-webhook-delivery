import { type PaginationOptions } from '@/common/dto/pagination-options.dto'
import type * as schema from '@/database/schema'
import { type EventStates, type EventVariants } from '@/database/types'
import { type WebhookPayloadI } from '@/webhook/interfaces/webhook-payload.interface'

export type OutboxItem = typeof schema.outbox.$inferSelect

export interface WebhookRepositoryI {
    claimPendingBatch(pagination?: PaginationOptions): Promise<OutboxItem[]>
    insertEvent(variant: EventVariants, payload: WebhookPayloadI): Promise<OutboxItem | undefined>
    updateStatus(oid: number, status: EventStates): Promise<void>
    markProcessed(oid: number): Promise<void>
    updateError(oid: number, errorMessage: string): Promise<void>
    resetStuckJobs(timeoutMinutes: number): Promise<void>
}

export const WEBHOOK_REPOSITORY = Symbol.for('WebhookRepositoryInterface')
