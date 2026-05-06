import { TOOLS } from "../../data/tools";

const CATEGORIES = [
  "Hosting", "Databases", "Auth", "Code", "Jobs & Queues",
  "Monitoring", "Email", "Payments", "AI & ML", "Design & CMS",
];

export function Catalog() {
  // Two rails moving in opposite directions. Each rail's items duplicated 2x
  // so the CSS marquee animation lands on a perfect copy = seamless infinite loop.
  const rail1 = TOOLS.slice(0, 16);
  const rail2 = TOOLS.slice(13);

  const renderPill = (t: (typeof TOOLS)[number], i: number) => (
    <div key={`${t.id}-${i}`} className="lp-cat-pill">
      <div
        className="lp-tool-logo"
        style={{ background: t.bg, color: t.color }}
        dangerouslySetInnerHTML={{ __html: t.logo }}
      />
      <span>{t.name}</span>
      <span className="lp-cat-pill-tag">{t.category}</span>
    </div>
  );

  return (
    <section id="catalog" className="lp-catalog">
      <div className="lp-wrap" style={{ textAlign: "center" }}>
        <div className="lp-sec-eyebrow">The catalog</div>
        <h2 className="lp-sec-title" style={{ margin: "0 auto" }}>
          Thirty tools today. <span className="lp-soft">Hundreds soon.</span>
        </h2>
        <p className="lp-sec-sub" style={{ marginLeft: "auto", marginRight: "auto" }}>
          Hosting, databases, auth, queues, monitoring, email, payments, AI, design — everything a
          modern team ships with, in one consistent shape.
        </p>

        <div className="lp-cat-cats">
          {CATEGORIES.map((c) => (
            <span key={c} className="lp-pill">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="lp-catalog-rail-wrap">
        <div className="lp-catalog-rail">
          {rail1.map((t, i) => renderPill(t, i))}
          {rail1.map((t, i) => renderPill(t, i + rail1.length))}
        </div>
        <div className="lp-catalog-rail lp-rail-reverse">
          {rail2.map((t, i) => renderPill(t, i))}
          {rail2.map((t, i) => renderPill(t, i + rail2.length))}
        </div>
      </div>
    </section>
  );
}
