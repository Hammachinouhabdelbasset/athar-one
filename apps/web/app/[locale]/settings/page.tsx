'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams } from 'next/navigation';
import { AtharClient, localeSchema, type TenantSettings } from '@athar/contracts';

type FormState = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'denied' | 'conflict';

const timezones = ['Africa/Algiers', 'Europe/Paris', 'UTC', 'Africa/Casablanca', 'Europe/Madrid'];

export default function SettingsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'en';
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [form, setForm] = useState({ locale: 'en', timezone: 'UTC', weekStartsOn: 0 });
  const [state, setState] = useState<FormState>('loading');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const client = new AtharClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
      getAccessToken: async () => process.env.NEXT_PUBLIC_DEMO_ACTOR_ID ?? null,
    });
    const tenantId = process.env.NEXT_PUBLIC_DEMO_TENANT_ID;
    if (!tenantId) { setState('error'); return; }
    client.getTenantSettings(tenantId)
      .then((value) => {
        setSettings(value);
        setForm({ locale: value.locale, timezone: value.timezone, weekStartsOn: value.weekStartsOn });
        setState('idle');
      })
      .catch((error: unknown) => {
        const code = error instanceof Error && 'code' in error ? String((error as { code: unknown }).code) : '';
        setState(code === 'forbidden' || code === 'tenant_isolation' ? 'denied' : 'error');
      });
  }, []);

  function save() {
    if (!settings) return;
    setState('saving');
    const client = new AtharClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
      getAccessToken: async () => process.env.NEXT_PUBLIC_DEMO_ACTOR_ID ?? null,
    });
    startTransition(async () => {
      try {
        const updated = await client.updateTenantSettings(settings.tenantId, {
          locale: localeSchema.parse(form.locale),
          timezone: form.timezone,
          weekStartsOn: form.weekStartsOn,
        }, settings.version);
        setSettings(updated);
        setState('saved');
      } catch (error) {
        const code = error instanceof Error && 'code' in error ? String((error as { code: unknown }).code) : '';
        setState(code === 'VERSION_CONFLICT' ? 'conflict' : 'error');
      }
    });
  }

  if (state === 'loading') return <main className="settings-page" dir={locale === 'ar-DZ' ? 'rtl' : 'ltr'}><div className="settings-skeleton" aria-busy="true" aria-label="Loading settings" /></main>;
  if (state === 'denied') return <main className="settings-page"><section className="settings-card" role="alert"><h1>Access denied</h1><p>You do not have permission to manage workspace settings. Ask a founder or admin to grant access.</p></section></main>;
  if (state === 'error' && !settings) return <main className="settings-page"><section className="settings-card" role="alert"><h1>Settings unavailable</h1><p>The workspace settings could not be loaded. Check the API connection and retry.</p></section></main>;

  return (
    <main className="settings-page" dir={locale === 'ar-DZ' ? 'rtl' : 'ltr'}>
      <section className="settings-card" aria-labelledby="settings-title">
        <header><p className="settings-eyebrow">{settings?.tenantName}</p><h1 id="settings-title">Workspace settings</h1></header>
        <form onSubmit={(event) => { event.preventDefault(); save(); }}>
          <div className="settings-field">
            <label htmlFor="locale">Language</label>
            <select id="locale" value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })}>
              <option value="en">English</option>
              <option value="fr-FR">Français</option>
              <option value="ar-DZ">العربية (الجزائر)</option>
            </select>
          </div>
          <div className="settings-field">
            <label htmlFor="timezone">Timezone</label>
            <select id="timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
              {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div className="settings-field">
            <label htmlFor="week-starts">Week starts on</label>
            <select id="week-starts" value={form.weekStartsOn} onChange={(e) => setForm({ ...form, weekStartsOn: Number(e.target.value) })}>
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>
          <div className="settings-actions">
            <button className="settings-save" type="submit" disabled={isPending || state === 'saving'}>
              {state === 'saving' ? 'Saving…' : 'Save changes'}
            </button>
            <span role="status" aria-live="polite" className="settings-status">
              {state === 'saved' ? `Saved · version ${settings?.version}` : ''}
              {state === 'conflict' ? 'These settings changed elsewhere. Reload to get the latest version.' : ''}
              {state === 'error' ? 'Save failed. Your entries are preserved — try again.' : ''}
            </span>
          </div>
        </form>
      </section>
      <style>{`
        .settings-page { min-height: 100dvh; display: grid; place-items: start center; padding: 48px 20px; background: var(--surface, #f9f8f7); }
        .settings-card { width: min(560px, 100%); padding: 28px; border: 1px solid var(--border, #e6e5e3); border-radius: 12px; background: var(--canvas, #fff); }
        .settings-eyebrow { margin: 0 0 4px; color: var(--muted, #6f6c67); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
        .settings-card h1 { margin: 0 0 24px; font-size: 24px; }
        .settings-field { display: grid; gap: 6px; margin-bottom: 18px; }
        .settings-field label { font-size: 13px; font-weight: 600; }
        .settings-field select { min-height: 44px; padding: 8px 12px; border: 1px solid var(--border, #e6e5e3); border-radius: 8px; background: var(--canvas, #fff); font: inherit; }
        .settings-field select:focus-visible { outline: 3px solid #e5f2fc; border-color: #2783de; }
        .settings-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .settings-save { min-height: 44px; padding: 0 18px; border: 0; border-radius: 8px; background: #2783de; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
        .settings-save:disabled { opacity: .6; cursor: not-allowed; }
        .settings-status { color: var(--muted, #6f6c67); font-size: 13px; }
        .settings-skeleton { width: min(560px, 100%); height: 340px; border-radius: 12px; background: linear-gradient(90deg, #f0efed 25%, #f9f8f7 50%, #f0efed 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { to { background-position: -200% 0; } }
        @media (prefers-reduced-motion: reduce) { .settings-skeleton { animation: none; } }
      `}</style>
    </main>
  );
}
