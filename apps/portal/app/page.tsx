const copy = {
  en: { approvals: 'Approvals', files: 'Files', invoices: 'Invoices', reports: 'Reports', nothing: 'Nothing needs your review right now.', welcome: 'Welcome back', secure: 'Secure client workspace', allClear: 'All clear', signIn: 'Sign in to continue' },
};

export default function PortalHome() {
  const c = copy.en;
  const sections = [
    { title: c.approvals, desc: 'Deliverables waiting for your decision.', empty: c.nothing },
    { title: c.files, desc: 'Shared deliverable files and versions.', empty: c.nothing },
    { title: c.invoices, desc: 'Issued invoices and payment status.', empty: 'No invoices yet.' },
    { title: c.reports, desc: 'Published performance and project reports.', empty: 'No reports published yet.' },
  ];

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div className="portal-brand"><span className="portal-mark" aria-hidden="true">A</span><div><strong>ATHAR ONE</strong><small>{c.secure}</small></div></div>
        <button className="portal-button" type="button">{c.signIn}</button>
      </header>
      <section className="portal-content">
        <h1>{c.welcome}</h1>
        <p className="portal-lede">Track progress, approve deliverables, and review files — all in one place.</p>
        <div className="portal-grid">
          {sections.map((section) => (
            <article key={section.title} className="portal-card">
              <header><h2>{section.title}</h2><span className="portal-badge">{c.allClear}</span></header>
              <p>{section.desc}</p>
              <div className="portal-empty">{section.empty}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
