import { type SQL } from 'drizzle-orm'

import { type PaginationOptions } from '@/common/dto/pagination-options.dto'
import type * as schema from '@/database/schema'
import { type EventStates, type EventVariants } from '@/database/types'
import { type IDiscordEmbed } from '@/webhook/interfaces/discord-embed.interface'

export type OutboxItem = typeof schema.outbox.$inferSelect

export interface WebhookRepositoryInterface {
    fetchPending(conditions: SQL[], pagination?: PaginationOptions): Promise<OutboxItem[]>
    insertEvent(variant: EventVariants, payload: IDiscordEmbed): Promise<OutboxItem>
    updateStatus(id: number, status: EventStates): Promise<void>
    markProcessed(id: number): Promise<void>
}

export const WEBHOOK_REPOSITORY = Symbol.for('WebhookRepositoryInterface')
