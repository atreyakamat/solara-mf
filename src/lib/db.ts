import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';

const { Pool } = pg;

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
    if (!_db) {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
        _db = drizzle(pool, { schema });
    }
    return _db;
}

// For backwards compat - will throw at build if used at module level
// Use getDb() in API routes instead
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(_, prop) {
        return (getDb() as any)[prop];
    },
});
