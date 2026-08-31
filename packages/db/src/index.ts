import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type AtharDatabase = PostgresJsDatabase<typeof schema>;

export function createDatabase(databaseUrl: string): {
  db: AtharDatabase;
  close: () => Promise<void>;
  withTenant: <T>(tenantId: string, actorId: string, work: (tx: AtharDatabase) => Promise<T>) => Promise<T>;
} {
  const client = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  const db = drizzle(client, { schema });

  return {
    db,
    close: async () => client.end(),
    withTenant: async <T>(
      tenantId: string,
      actorId: string,
      work: (tx: AtharDatabase) => Promise<T>,
    ): Promise<T> =>
      db.transaction(async (tx) => {
        await tx.execute(`select set_config('app.tenant_id', '${tenantId.replaceAll("'", "''")}', true)`);
        await tx.execute(`select set_config('app.actor_id', '${actorId.replaceAll("'", "''")}', true)`);
        return work(tx as AtharDatabase);
      }),
  };
}

export * from './schema.js';
