interface Tier {
  name: string;
  amount: string;
  unit: string;
  tag: string;
  features: string[];
  cta: string;
  featured?: boolean;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    name: "Solo",
    amount: "$0",
    unit: "/forever",
    tag: "Everything you need to keep one developer's stack from sprawling.",
    features: [
      "Unlimited pinned tools",
      "30+ provider integrations",
      "Cross-tool activity feed",
      "Side-by-side compare",
    ],
    cta: "Start for free",
  },
  {
    name: "Team",
    amount: "$8",
    unit: "/seat / mo",
    tag: "Shared hangars for the people you actually ship with.",
    features: [
      "Everything in Solo",
      "Shared workspaces & roles",
      "Spend rollup & billing alerts",
      "Slack & Discord notifications",
      "Audit log",
    ],
    cta: "Start a team trial",
    featured: true,
    badge: "Most builders",
  },
  {
    name: "Enterprise",
    amount: "Talk",
    unit: "to us",
    tag: "SSO, SCIM, on-prem connectors. For teams with a security review.",
    features: [
      "Everything in Team",
      "SSO / SAML / SCIM",
      "Self-hosted connectors",
      "Dedicated support",
    ],
    cta: "Contact sales",
  },
];

const Check = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export function Pricing() {
  return (
    <section id="pricing">
      <div className="lp-wrap">
        <div className="lp-sec-head">
          <div className="lp-sec-eyebrow">Pricing</div>
          <h2 className="lp-sec-title">
            Free for solos. <span className="lp-soft">Cheap for teams.</span>
          </h2>
          <p className="lp-sec-sub">
            Hangar makes money when teams use it together. Solo devs pay nothing — forever, not
            just trial.
          </p>
        </div>
        <div className="lp-pricing-grid">
          {TIERS.map((t) => (
            <div key={t.name} className={`lp-price-card ${t.featured ? "lp-featured" : ""}`}>
              {t.badge && <div className="lp-price-badge">{t.badge}</div>}
              <div className="lp-price-tier">{t.name}</div>
              <div className="lp-price-amount">
                {t.amount}
                <span className="lp-price-unit">{t.unit}</span>
              </div>
              <div className="lp-price-tag">{t.tag}</div>
              <ul className="lp-price-list">
                {t.features.map((f) => (
                  <li key={f}>
                    <Check /> {f}
                  </li>
                ))}
              </ul>
              <a className="lp-price-cta" href="/app">
                {t.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
