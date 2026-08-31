import { z } from 'zod';

const optionalUrl = z.preprocess((value) => (value === '' ? undefined : value), z.url().optional());

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['local', 'development', 'staging', 'pilot', 'production', 'demo']),
  WEB_URL: z.url(),
  PORTAL_URL: z.url(),
  API_URL: z.url(),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  REDIS_URL: z.string().startsWith('redis://'),
  SESSION_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string().min(1),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(3),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(8),
  OTEL_SERVICE_NAME: z.string().min(1).default('athar-api'),
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalUrl,
  SENTRY_DSN: optionalUrl,
  POSTHOG_KEY: z.preprocess((value) => (value === '' ? undefined : value), z.string().optional()),
  DEMO_TENANT_ID: z.uuid().optional(),
  DEMO_ACTOR_ID: z.uuid().optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  const result = environmentSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid ATHAR ONE environment:\n${issues.join('\n')}`);
  }
  if (result.data.APP_ENV === 'production') {
    if (result.data.DEMO_ACTOR_ID || result.data.DEMO_TENANT_ID) {
      throw new Error('Demo identities are forbidden in production.');
    }
    if (result.data.S3_SECRET_KEY === 'replace-me') {
      throw new Error('Production storage credentials are not configured.');
    }
  }
  return Object.freeze(result.data);
}
