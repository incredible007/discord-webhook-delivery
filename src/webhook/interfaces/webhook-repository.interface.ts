import { type SQL } from 'drizzle-orm'

import { type PaginationOptions } from '@/common/dto/pagination-options.dto'
import type * as schema from '@/database/schema'
import { type EventStates, type EventVariants } from '@/database/types'
import { type DiscordEmbedI } from '@/webhook/interfaces/discord-embed.interface'
import { type IWebhookPayload } from '@/webhook/interfaces/webhook-payload.interface'

export type OutboxItem = typeof schema.outbox.$inferSelect

export interface WebhookRepositoryI {
    fetchPending(conditions: SQL[], pagination?: PaginationOptions): Promise<OutboxItem[]>
    insertEvent(variant: EventVariants, payload: IWebhookPayload): Promise<OutboxItem>
    updateStatus(id: number, status: EventStates): Promise<void>
    markProcessed(id: number): Promise<void>
}

export const WEBHOOK_REPOSITORY = Symbol.for('WebhookRepositoryInterface')
