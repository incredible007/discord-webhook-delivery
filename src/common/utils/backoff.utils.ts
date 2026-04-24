export const exponentialBackoffWithJitter = (attemptsMade: number): number => {
    const base = Math.pow(2, attemptsMade) * 1000
    const jitter = Math.random() * 1000
    return base + jitter
}
