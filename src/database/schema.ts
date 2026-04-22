import { sql } from 'drizzle-orm'
import {
    bigint,
    check,
    index,
    jsonb,
    pgEnum,
    pgTable,
    smallint,
    timestamp,
} from 'drizzle-orm/pg-core'

import { type WebhookPayloadI } from '@/webhook/interfaces/webhook-payload.interface'

export const eventStates = pgEnum('event_states', ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED'])
export const eventVariants = pgEnum('event_variants', ['USER_REGISTERED'])

export const outbox = pgTable(
    'outbox',
    {
        // You can use { mode: "bigint" } if numbers are exceeding js number limitations
        oid: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
            name: 'outbox_oid_seq',
            startWith: 1,
            increment: 1,
            minValue: 1,
            maxValue: 9223372036854775807,
            cache: 1,
        }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
            .defaultNow()
            .notNull(),
        processedAt: timestamp('processed_at', { withTimezone: true, mode: 'date' }),
        payload: jsonb().$type<WebhookPayloadI>().notNull(),
        attempts: smallint().default(0).notNull(),
        eventState: eventStates('event_state').default('PENDING').notNull(),
        eventVariant: eventVariants('event_variant').notNull(),
    },
    (table) => [
        index('idx_outbox_created_at').using(
            'btree',
            table.createdAt.asc().nullsLast().op('timestamptz_ops'),
        ),
        index('idx_outbox_event_state_pending')
            .using('btree', table.eventState.asc().nullsLast().op('enum_ops'))
            .where(sql`(event_state = 'PENDING'::event_states)`),
        check('attempts', sql`attempts >= 0`),
    ],
)
