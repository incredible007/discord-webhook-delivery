import { type eventStates, type eventVariants } from './schema'

export type EventVariants = (typeof eventVariants.enumValues)[number]
export type EventStates = (typeof eventStates.enumValues)[number]
