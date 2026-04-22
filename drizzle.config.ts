import type { Config } from 'drizzle-kit'

export default {
    schema: './src/database/*',
    out: './src/database',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DB_URL!,
    },
    schemaFilter: ['public'],
    strict: true,
    verbose: false,
} satisfies Config
