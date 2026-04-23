import { Inject } from '@nestjs/common'
import { and, eq, inArray, lt } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { DEFAULT_BATCH_SIZE, DEFAULT_PAGE } from '@/common/constants'
import type { PaginationOptions } from '@/common/dto/pagination-options.dto'
import { DB_DRIZZLE } from '@/database/database.module'
import { EventStates, EventVariants } from '@/database/types'
import { WebhookPayloadI } from '@/webhook/interfaces/webhook-payload.interface'

import * as schema from '../database/schema'

import { OutboxItem, type WebhookRepositoryI } from './interfaces/webhook-repository.interface'

export class WebhookRepository implements WebhookRepositoryI {
    constructor(
        @Inject(DB_DRIZZLE)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) {}

    async updateError(oid: number, errorMessage: string): Promise<void> {
        await this.db
            .update(schema.outbox)
            .set({
                eventState: 'FAILED',
                errorMessage,
            })
            .where(eq(schema.outbox.oid, oid))
    }

    async claimPendingBatch(pagination?: PaginationOptions): Promise<OutboxItem[]> {
        return await this.db.transaction(async (tx) => {
            const res = await tx
                .select()
                .from(schema.outbox)
                .where(eq(schema.outbox.eventState, 'PENDING'))
                .limit(pagination?.limit ?? DEFAULT_BATCH_SIZE)
                .offset(pagination?.page ?? DEFAULT_PAGE)
                .for('update', { skipLocked: true })

            if (res.length === 0) return []

            const oids = res.map((i) => i.oid)

            await tx
                .update(schema.outbox)
                .set({
                    eventState: 'PROCESSING',
                    processingAt: new Date(),
                })
                .where(inArray(schema.outbox.oid, oids))

            return res
        })
    }

    async insertEvent(
        variant: EventVariants,
        payload: WebhookPayloadI,
    ): Promise<OutboxItem | undefined> {
        const [inserted] = await this.db
            .insert(schema.outbox)
            .values({
                idempotencyKey: payload.idempotencyKey,
                eventVariant: variant,
                payload,
                eventState: 'PENDING',
            })
            .onConflictDoNothing()
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

    async resetStuckJobs(timeoutMinutes: number = 5): Promise<void> {
        const timeout = new Date(Date.now() - timeoutMinutes * 60 * 1000)

        await this.db
            .update(schema.outbox)
            .set({
                eventState: 'PENDING',
                processingAt: null,
            })
            .where(
                and(
                    eq(schema.outbox.eventState, 'PROCESSING'),
                    lt(schema.outbox.processingAt, timeout),
                ),
            )
    }
}
