export default function DashboardSectionPage({ title, eyebrow, description }) {
  return (
    <div className="dashboard-view dashboard-section-view">
      <section className="dashboard-hero dashboard-hero-compact">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      <section className="panel dashboard-placeholder-panel">
        <div className="panel-header">
          <h2>Page scaffold ready</h2>
        </div>
        <p className="dashboard-placeholder-copy">
          This route is wired into the shared dashboard shell and ready for the screenshot you’ll
          provide next. I will replace this placeholder with the exact page layout and MongoDB data
          model once you send the design.
        </p>
      </section>
    </div>
  );
}