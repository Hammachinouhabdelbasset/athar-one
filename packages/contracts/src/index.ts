import { z } from 'zod';

export const localeSchema = z.enum(['en', 'fr-FR', 'ar-DZ']);

export const tenantSettingsSchema = z.object({
  tenantId: z.string().uuid(),
  tenantName: z.string().min(1).max(120),
  locale: localeSchema,
  timezone: z.string().min(1).max(80),
  weekStartsOn: z.number().int().min(0).max(6),
  version: z.number().int().positive(),
  updatedAt: z.string().datetime(),
});

export const updateTenantSettingsSchema = tenantSettingsSchema
  .pick({ locale: true, timezone: true, weekStartsOn: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one setting is required');

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;
export type UpdateTenantSettings = z.infer<typeof updateTenantSettingsSchema>;

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
  correlationId: string;
}

export interface ApiSuccess<T> {
  data: T;
  requestId: string;
  correlationId: string;
}

export class AtharApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId: string,
  ) {
    super(message);
    this.name = 'AtharApiError';
  }
}

export interface AtharClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null>;
  fetch?: typeof globalThis.fetch;
}

export class AtharClient {
  private readonly fetcher: typeof globalThis.fetch;

  constructor(private readonly options: AtharClientOptions) {
    this.fetcher = options.fetch ?? globalThis.fetch;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.options.getAccessToken?.();
    const requestId = crypto.randomUUID();
    const headers = new Headers(init.headers);
    headers.set('accept', 'application/json');
    headers.set('x-request-id', requestId);
    if (init.body) headers.set('content-type', 'application/json');
    if (token) headers.set('authorization', `Bearer ${token}`);

    const response = await this.fetcher(`${this.options.baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });
    const payload = (await response.json()) as ApiSuccess<T> | ApiErrorBody;

    if (!response.ok || 'error' in payload) {
      const error = 'error' in payload ? payload : null;
      throw new AtharApiError(
        error?.error.message ?? 'The request failed.',
        response.status,
        error?.error.code ?? 'UNKNOWN_ERROR',
        error?.requestId ?? requestId,
      );
    }

    return payload.data;
  }

  async getTenantSettings(tenantId: string): Promise<TenantSettings> {
    const value = await this.request<unknown>(`/v1/tenants/${tenantId}/settings`);
    return tenantSettingsSchema.parse(value);
  }

  async updateTenantSettings(
    tenantId: string,
    input: UpdateTenantSettings,
    version: number,
    idempotencyKey = crypto.randomUUID(),
  ): Promise<TenantSettings> {
    const body = updateTenantSettingsSchema.parse(input);
    const value = await this.request<unknown>(`/v1/tenants/${tenantId}/settings`, {
      method: 'PUT',
      headers: {
        'if-match': String(version),
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(body),
    });
    return tenantSettingsSchema.parse(value);
  }
}
