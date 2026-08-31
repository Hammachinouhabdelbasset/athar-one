import { AtharClient, type TenantSettings } from '@athar/contracts';
import { direction, isLocale, messages, type Locale } from '../../lib/i18n';

async function loadSettings(): Promise<TenantSettings | null> {
  const apiUrl = process.env.API_URL;
  const tenantId = process.env.DEMO_TENANT_ID;
  const actorId = process.env.DEMO_ACTOR_ID;
  if (!apiUrl || !tenantId || !actorId) return null;

  const client = new AtharClient({
    baseUrl: apiUrl,
    getAccessToken: async () => actorId,
    fetch: globalThis.fetch,
  });
  return client.getTenantSettings(tenantId);
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const candidate = (await params).locale;
  const locale: Locale = isLocale(candidate) ? candidate : 'en';
  const copy = messages[locale];
  const settings = await loadSettings().catch(() => null);
  const dir = direction(locale);

  return (
    <main className="shell" dir={dir} lang={locale}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar" aria-label={copy.navigation}>
        <div className="brand" aria-label="ATHAR ONE">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>ATHAR ONE</span>
        </div>
        <nav className="primary-nav">
          <a className="nav-item active" href={`/${locale}`} aria-current="page"><span aria-hidden="true">⌂</span>{copy.home}</a>
          <a className="nav-item" href={`/${locale}/control-tower`}><span aria-hidden="true">◎</span>{copy.controlTower}</a>
          <a className="nav-item" href={`/${locale}/my-work`}><span aria-hidden="true">✓</span>{copy.myWork}</a>
        </nav>
        <div className="system-state" role="status">
          <span className="status-dot" aria-hidden="true" />
          <div><strong>{copy.healthy}</strong><small>{copy.noAlerts}</small></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="switcher" type="button" aria-label={copy.tenant}>
            <span className="avatar" aria-hidden="true">A</span>
            <span><small>{copy.tenant}</small><strong>{settings?.tenantName ?? 'ATHAR ONE'}</strong></span>
            <span aria-hidden="true">⌄</span>
          </button>
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">{copy.search}</span>
            <input placeholder={copy.search} inputMode="search" />
            <kbd>⌘ K</kbd>
          </label>
          <div className="top-actions">
            <button className="icon-button" type="button" aria-label={copy.notifications}>○</button>
            <button className="primary-button" type="button"><span aria-hidden="true">＋</span>{copy.quickCreate}</button>
          </div>
        </header>

        <div id="main-content" className="content" tabIndex={-1}>
          <div className="heading-row">
            <div><p className="eyebrow">{settings?.timezone ?? 'Mode 0 foundation'}</p><h1>{copy.greeting}</h1><p className="lede">{copy.overview}</p></div>
            <button className="secondary-button" type="button">{copy.allUnits}<span aria-hidden="true">⌄</span></button>
          </div>

          {!settings ? (
            <section className="notice" aria-labelledby="setup-title">
              <div className="notice-icon" aria-hidden="true">↗</div>
              <div><h2 id="setup-title">Connect the foundation API</h2><p>Set API_URL, DEMO_TENANT_ID, and DEMO_ACTOR_ID to load authorized tenant data through the typed SDK.</p></div>
              <a className="secondary-button" href="/docs">Open setup</a>
            </section>
          ) : (
            <section className="notice positive" aria-labelledby="connected-title">
              <div className="notice-icon" aria-hidden="true">✓</div>
              <div><h2 id="connected-title">Tenant context connected</h2><p>{settings.locale} · {settings.timezone} · v{settings.version}</p></div>
              <a className="secondary-button" href={`/${locale}/settings`}>{copy.settings}</a>
            </section>
          )}

          <div className="section-heading"><div><h2>{copy.myWork}</h2><p>Permission-filtered queues will appear here as modules are enabled.</p></div><button className="text-button" type="button">{copy.viewQueue} →</button></div>
          <div className="work-grid">
            <article className="work-card"><span className="card-icon blue" aria-hidden="true">✓</span><div><small>{copy.approvals}</small><strong>Clear</strong><p>No approval is waiting for this role.</p></div></article>
            <article className="work-card"><span className="card-icon orange" aria-hidden="true">!</span><div><small>{copy.blockers}</small><strong>Clear</strong><p>No blocker is assigned to this role.</p></div></article>
            <article className="work-card"><span className="card-icon green" aria-hidden="true">↗</span><div><small>{copy.dueToday}</small><strong>Clear</strong><p>No work item is due today.</p></div></article>
          </div>
        </div>
      </section>
    </main>
  );
}
