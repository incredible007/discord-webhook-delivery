import { type eventStates, type eventVariants } from './schema'

export type EventVariants = (typeof eventVariants.enumValues)[number]
export type EventStates = (typeof eventStates.enumValues)[number]

export const EventVariantValues = {
    USER_REGISTERED: 'USER_REGISTERED',
} as const satisfies Record<EventVariants, EventVariants>

export const EventStatesValues = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    SUCCEEDED: 'SUCCEEDED',
    FAILED: 'FAILED',
} as const satisfies Record<EventStates, EventStates>
