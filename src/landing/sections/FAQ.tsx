const ITEMS: { q: string; a: React.ReactNode; open?: boolean }[] = [
  {
    q: "Do you store my API keys?",
    open: true,
    a: (
      <>
        Optional. By default the vault is plaintext <code className="lp-code">localStorage</code>.
        Set a master passphrase in <strong>Settings → Security</strong> and Hangar encrypts it at
        rest with PBKDF2 + AES-GCM via the Web Crypto API. Auto-locks after 15 minutes of
        inactivity. Either way, no Hangar server ever sees your keys.
      </>
    ),
  },
  {
    q: "Is Hangar a replacement for the actual tools?",
    a: (
      <>
        Definitely not. It's a control tower above them. You still log into Vercel to deploy and
        Stripe to refund. Hangar just gets you there in one click and surfaces what changed since
        you last looked.
      </>
    ),
  },
  {
    q: "Which tools do you support today?",
    a: (
      <>
        29 built-in across 11 categories — and you can add your own at any time via{" "}
        <strong>+ Add tool</strong>. Custom tools live in your local catalog and behave exactly
        like built-ins (pin, compare, vault keys). Live API data ships for{" "}
        <strong>GitHub, Linear, and Vercel</strong> today; more providers are gated behind CORS
        and will need a small server proxy (on the roadmap).
      </>
    ),
  },
  {
    q: "Why should I trust this?",
    a: (
      <>
        Because there's nothing to trust <em>us</em> with. No backend, no telemetry, no analytics —
        the whole repo is open source (MIT). Read the code, run it locally, host the static build
        wherever you want. Optional cross-device sync writes to a{" "}
        <strong>private gist on your own GitHub account</strong> — never to a Hangar server.
      </>
    ),
  },
  {
    q: "Can I self-host?",
    a: (
      <>
        It's the default. <code className="lp-code">npm run build</code> produces a static folder
        you can drop on GitHub Pages, Vercel, Netlify, Cloudflare Pages or your own VM. There's no
        server-side runtime to worry about.
      </>
    ),
  },
];

export function FAQ() {
  return (
    <section id="faq">
      <div className="lp-wrap">
        <div className="lp-faq-grid">
          <div>
            <div className="lp-sec-eyebrow">Questions</div>
            <h2 className="lp-sec-title">The honest answers.</h2>
          </div>
          <div className="lp-faq-list">
            {ITEMS.map((item) => (
              <details key={item.q} className="lp-faq-item" open={item.open}>
                <summary className="lp-faq-q">{item.q}</summary>
                <div className="lp-faq-a">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
