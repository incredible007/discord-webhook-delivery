import { Inject } from '@nestjs/common'
import { and, eq, SQL } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { DEFAULT_BATCH_SIZE, DEFAULT_PAGE } from '@/common/constants'
import type { PaginationOptions } from '@/common/dto/pagination-options.dto'
import { DB_DRIZZLE } from '@/database/database.module'
import { EventStates, EventVariants } from '@/database/types'
import { DiscordEmbedI } from '@/webhook/interfaces/discord-embed.interface'
import { IWebhookPayload } from '@/webhook/interfaces/webhook-payload.interface'

import * as schema from '../database/schema'

import { OutboxItem, type WebhookRepositoryI } from './interfaces/webhook-repository.interface'

export class WebhookRepository implements WebhookRepositoryI {
    constructor(
        @Inject(DB_DRIZZLE)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) {}

    async fetchPending(conditions: SQL[], pagination?: PaginationOptions): Promise<OutboxItem[]> {
        const whereCondition = conditions.length > 0 ? and(...conditions) : undefined

        return this.db
            .select()
            .from(schema.outbox)
            .where(whereCondition)
            .limit(pagination?.limit ?? DEFAULT_BATCH_SIZE)
            .offset(pagination?.page ?? DEFAULT_PAGE)
    }

    async insertEvent(variant: EventVariants, payload: IWebhookPayload): Promise<OutboxItem> {
        const [inserted] = await this.db
            .insert(schema.outbox)
            .values({
                eventVariant: variant,
                payload,
                eventState: 'PENDING',
            })
            .returning()

        return inserted
    }

    async updateStatus(id: number, status: EventStates): Promise<void> {
        await this.db
            .update(schema.outbox)
            .set({ eventState: status })
            .where(eq(schema.outbox.oid, id))
    }

    async markProcessed(id: number): Promise<void> {
        await this.db
            .update(schema.outbox)
            .set({
                eventState: 'SUCCEEDED',
                processedAt: new Date(),
            })
            .where(eq(schema.outbox.oid, id))
    }
}
