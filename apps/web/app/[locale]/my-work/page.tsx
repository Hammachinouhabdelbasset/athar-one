import { messages, isLocale, direction, type Locale } from '../../../lib/i18n';

export default async function MyWork({ params }: { params: Promise<{ locale: string }> }) {
  const candidate = (await params).locale;
  const locale: Locale = isLocale(candidate) ? candidate : 'en';
  const copy = messages[locale];

  return (
    <main className="mywork" dir={direction(locale)} lang={locale}>
      <h1>{copy.myWork}</h1>
      <section className="mywork-empty" aria-live="polite">
        <div className="mywork-icon" aria-hidden="true">✓</div>
        <h2>All caught up</h2>
        <p>Tasks, approvals, and blockers assigned to you will appear here once delivery modules are enabled.</p>
      </section>
      <style>{`
        .mywork { min-height: 100dvh; padding: 48px 32px; background: var(--surface, #f9f8f7); color: var(--text, #2c2c2b); }
        .mywork h1 { margin: 0 0 32px; font-size: 32px; letter-spacing: -.02em; }
        .mywork-empty { max-width: 480px; margin: 64px auto 0; text-align: center; padding: 40px 24px; border: 1px solid var(--border, #e6e5e3); border-radius: 12px; background: var(--canvas, #fff); }
        .mywork-icon { width: 48px; height: 48px; margin: 0 auto 16px; display: grid; place-items: center; border-radius: 12px; background: #e8f1ec; color: #46a171; font-size: 22px; font-weight: 700; }
        .mywork-empty h2 { margin: 0 0 6px; font-size: 17px; }
        .mywork-empty p { margin: 0; color: var(--muted, #6f6c67); font-size: 14px; }
      `}</style>
    </main>
  );
}
