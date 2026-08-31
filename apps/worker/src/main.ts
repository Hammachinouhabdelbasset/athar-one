import { Queue, Worker, type Job } from 'bullmq';
import Redis from 'ioredis';
import { and, asc, eq, isNull, lte } from 'drizzle-orm';
import { createDatabase, outbox } from '@athar/db';

interface DomainEventJob {
  outboxId: string;
  tenantId: string;
  eventName: string;
  schemaVersion: number;
  correlationId: string;
  payload: Record<string, unknown>;
}

const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;
if (!databaseUrl || !redisUrl) throw new Error('DATABASE_URL and REDIS_URL are required.');

const database = createDatabase(databaseUrl);
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: true });
const queue = new Queue<DomainEventJob>('athar-domain-events', { connection });

async function dispatchOutboxBatch(): Promise<number> {
  const candidates = await database.db
    .select()
    .from(outbox)
    .where(and(isNull(outbox.processedAt), lte(outbox.availableAt, new Date())))
    .orderBy(asc(outbox.availableAt))
    .limit(25);

  let dispatched = 0;
  for (const event of candidates) {
    await queue.add(
      event.eventName,
      {
        outboxId: event.id,
        tenantId: event.tenantId,
        eventName: event.eventName,
        schemaVersion: event.schemaVersion,
        correlationId: event.correlationId,
        payload: event.payload,
      },
      {
        jobId: event.id,
        attempts: 8,
        backoff: { type: 'exponential', delay: 1_000 },
        removeOnComplete: 1_000,
        removeOnFail: 5_000,
      },
    );
    await database.db
      .update(outbox)
      .set({ processedAt: new Date(), attempts: event.attempts + 1 })
      .where(and(eq(outbox.id, event.id), isNull(outbox.processedAt)));
    dispatched += 1;
  }
  return dispatched;
}

const worker = new Worker<DomainEventJob>(
  'athar-domain-events',
  async (job: Job<DomainEventJob>) => {
    const { tenantId, correlationId, eventName, payload } = job.data;
    // Handlers are registered by module. Every handler receives tenant context;
    // no job may infer authorization from an object ID or storage key.
    console.info(JSON.stringify({ level: 'info', message: 'domain_event_received', tenantId, correlationId, eventName, payloadKeys: Object.keys(payload) }));
  },
  { connection, concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5) },
);

worker.on('failed', (job, error) => {
  console.error(JSON.stringify({ level: 'error', message: 'job_failed', jobId: job?.id, tenantId: job?.data.tenantId, correlationId: job?.data.correlationId, error: error.message }));
});

const timer = setInterval(() => {
  void dispatchOutboxBatch().catch((error: unknown) => {
    console.error(JSON.stringify({ level: 'error', message: 'outbox_dispatch_failed', error: error instanceof Error ? error.message : 'unknown' }));
  });
}, Number(process.env.OUTBOX_POLL_MS ?? 1_000));
timer.unref();

async function shutdown(): Promise<void> {
  clearInterval(timer);
  await worker.close();
  await queue.close();
  await connection.quit();
  await database.close();
}

process.once('SIGTERM', () => void shutdown());
process.once('SIGINT', () => void shutdown());
void dispatchOutboxBatch();
