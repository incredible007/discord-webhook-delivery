import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as postgres from 'postgres'

import * as schema from './schema'

export const DB_DRIZZLE = Symbol.for('DB_DRIZZLE')

@Global()
@Module({
    providers: [
        {
            provide: DB_DRIZZLE,
            inject: [ConfigService],
            useFactory: (configService: ConfigService): PostgresJsDatabase<typeof schema> => {
                const url = configService.get<string>('DB_URL')!
                const client = postgres(url, {
                    max: 10,
                    idle_timeout: 20,
                    max_lifetime: 1800,
                    connect_timeout: 10,
                })
                return drizzle(client, { schema })
            },
        },
    ],
    exports: [DB_DRIZZLE],
})
export class DatabaseModule {}
