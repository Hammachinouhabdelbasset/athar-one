import { messages, isLocale, direction, type Locale } from '../../../lib/i18n';

export default async function ControlTower({ params }: { params: Promise<{ locale: string }> }) {
  const candidate = (await params).locale;
  const locale: Locale = isLocale(candidate) ? candidate : 'en';
  const copy = messages[locale];

  const tiles = [
    { label: copy.approvals, state: 'clear' },
    { label: copy.blockers, state: 'clear' },
    { label: copy.dueToday, state: 'clear' },
  ];

  return (
    <main className="tower" dir={direction(locale)} lang={locale}>
      <header className="tower-header">
        <h1>{copy.controlTower}</h1>
        <p>Founder-level visibility across units. Metrics appear here as business modules are enabled in Mode 1.</p>
      </header>
      <div className="tower-grid">
        {tiles.map((tile) => (
          <article key={tile.label} className="tower-tile">
            <span className="tower-dot" aria-hidden="true" />
            <strong>{tile.label}</strong>
            <p>Nothing requires attention.</p>
          </article>
        ))}
      </div>
      <style>{`
        .tower { min-height: 100dvh; padding: 48px 32px; background: var(--surface, #f9f8f7); color: var(--text, #2c2c2b); }
        .tower-header { max-width: 720px; margin-bottom: 32px; }
        .tower-header h1 { margin: 0 0 8px; font-size: 32px; letter-spacing: -.02em; }
        .tower-header p { margin: 0; color: var(--muted, #6f6c67); }
        .tower-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; max-width: 960px; }
        .tower-tile { padding: 20px; border: 1px solid var(--border, #e6e5e3); border-radius: 12px; background: var(--canvas, #fff); }
        .tower-tile strong { display: block; margin: 10px 0 4px; font-size: 15px; }
        .tower-tile p { margin: 0; color: var(--muted, #6f6c67); font-size: 13px; }
        .tower-dot { width: 10px; height: 10px; display: block; border-radius: 50%; background: #46a171; box-shadow: 0 0 0 4px #e8f1ec; }
      `}</style>
    </main>
  );
}
