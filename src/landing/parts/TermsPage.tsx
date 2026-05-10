import { LegalShell } from "./LegalShell";

export function TermsPage() {
  return (
    <LegalShell title="Terms of Service" eyebrow="Legal" lastUpdated="May 7, 2026">
      <section className="legal-tldr">
        <h2 className="legal-tldr-label">TL;DR</h2>
        <p>
          Hangar is open-source software (MIT license). You can use it, modify it, host it
          yourself, fork it, and ship it commercially. It&apos;s provided as-is with no
          warranty. You&apos;re responsible for your own tokens, your own data, and how you use
          the third-party services Hangar connects to.
        </p>
      </section>

      <h2>1. License</h2>
      <p>
        The Hangar source code is released under the MIT License. The full license text lives in{" "}
        <code>LICENSE</code> at the root of{" "}
        <a href="https://github.com/ClaudevGuy/hangar" target="_blank" rel="noreferrer">
          github.com/ClaudevGuy/hangar
        </a>
        . In summary:
      </p>
      <ul>
        <li>You can use, copy, modify, merge, publish, distribute, and sell copies of the software.</li>
        <li>You must retain the original copyright notice in any substantial copy you distribute.</li>
        <li>The software is provided &quot;as is,&quot; without warranty of any kind.</li>
      </ul>
      <p>
        By using Hangar — whether the hosted marketing demo, the local app, or a fork —
        you&apos;re accepting the MIT license terms. These Terms of Service supplement (but do
        not contradict) that license.
      </p>

      <h2>2. Self-hosting and the hosted marketing site</h2>
      <p>
        Hangar is designed to be run locally. <code>npm run dev</code> starts a dev server,{" "}
        <code>npm run build</code> produces a static folder you can deploy to any host. You
        don&apos;t need our marketing site or hosted version to use Hangar.
      </p>
      <p>
        We host the marketing landing page at <code>hangar-silk.vercel.app</code> as a
        convenience for discovery and shareable URLs. The dashboard itself is gated to
        localhost on the deployed origin (a public deployment of <code>/app</code> would be a
        stranded localStorage silo with no path to your real install). We may stop hosting that
        site at any time without notice; the source code stays available regardless.
      </p>

      <h2>3. Acceptable use</h2>
      <p>
        Hangar is a developer dashboard. Use it for whatever your dev work is. The behaviors
        we&apos;d prefer you avoid:
      </p>
      <ul>
        <li>
          Don&apos;t deploy a fork that misrepresents itself as the original Hangar without
          removing the branding. The MIT license requires copyright attribution; honesty is also
          generally a good idea.
        </li>
        <li>
          Don&apos;t use Hangar to bypass authentication on services you don&apos;t have
          permission to access. The API tokens you add authenticate <em>you</em> to those
          services — that&apos;s between you and them.
        </li>
        <li>
          Don&apos;t inject malicious behavior into a fork and distribute it as if it&apos;s the
          legitimate project.
        </li>
        <li>
          Don&apos;t use the two CORS proxies (<code>/api/resend</code>, <code>/api/sentry</code>)
          for high-volume traffic that isn&apos;t serving your own use of Hangar. They&apos;re
          there for the dashboard, not as general-purpose proxies. We may rate-limit or remove
          them.
        </li>
      </ul>

      <h2>4. Third-party services</h2>
      <p>
        When you add an API token for GitHub, Vercel, Anthropic, Stripe, Linear, Sentry, Resend,
        or any other provider, you&apos;re using those services under their own terms. We are
        not a party to that relationship.
      </p>
      <p>You&apos;re solely responsible for:</p>
      <ul>
        <li>The actions taken with your API tokens (deploys, payments, ticket changes, etc.)</li>
        <li>Compliance with each provider&apos;s rate limits, acceptable use policies, and pricing terms</li>
        <li>Costs incurred via those services (e.g., Anthropic API calls when using the Brew / Ask / Investigate features)</li>
      </ul>
      <p>
        Hangar reads, displays, and forwards data from these providers when you ask it to.
        Hangar doesn&apos;t store or proxy most of those calls (the two exceptions, Resend and
        Sentry, run as stateless CORS proxies that don&apos;t persist any data — see the Privacy
        Policy for detail).
      </p>

      <h2>5. AI features and your Anthropic key</h2>
      <p>
        The Morning Brew, Ask, and Investigate features call Anthropic&apos;s API directly from
        your browser using your own Anthropic API key. We don&apos;t fund those calls — they bill
        against your Anthropic account. We don&apos;t set rate limits or cost caps within Hangar;
        if you want a hard ceiling, set it on your Anthropic account.
      </p>
      <p>
        AI-generated content (the Brew synthesis, the Ask responses, the Investigate diagnoses,
        the suggested actions) is provided as guidance, not as advice. You&apos;re responsible
        for verifying anything the AI suggests before acting on it — especially anything
        destructive or billable. We make no representations about the accuracy of AI output.
      </p>

      <h2>6. No warranty</h2>
      <p>
        Hangar is provided <strong>&quot;AS IS&quot;</strong>, without warranty of any kind,
        express or implied, including but not limited to the warranties of merchantability,
        fitness for a particular purpose, and noninfringement. This is the standard MIT
        disclaimer and we mean it: we don&apos;t guarantee Hangar will work, won&apos;t lose
        data, won&apos;t break with a future browser update, or won&apos;t have bugs.
      </p>
      <p>
        We also don&apos;t guarantee that any third-party service Hangar connects to will
        continue to function or maintain backward compatibility. If GitHub deletes their gist
        API tomorrow, the cross-device sync feature stops working — that&apos;s outside our
        control.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        In no event shall Hangar&apos;s authors or copyright holders be liable for any claim,
        damages, or other liability — whether in an action of contract, tort, or otherwise —
        arising from, out of, or in connection with the software or the use or other dealings
        in the software.
      </p>
      <p>
        If running Hangar somehow leads to data loss, downtime, missed alerts, billing
        surprises, or any other consequence — that is part of the &quot;as is&quot; deal. If
        you&apos;ve configured Hangar to display live data from your providers and you make a
        decision based on that data being correct, you&apos;re trusting both Hangar AND the
        upstream provider. Either can be wrong.
      </p>

      <h2>8. Termination</h2>
      <p>
        You can stop using Hangar at any time by closing the browser tab and clearing your
        browser&apos;s storage for the relevant origin. There&apos;s nothing to cancel and no
        data of yours that we hold.
      </p>
      <p>
        We may stop hosting <code>hangar-silk.vercel.app</code> or remove specific features
        (e.g., the Resend / Sentry CORS proxies) at any time without notice. The open-source
        code remains under the MIT license and you can keep running Hangar yourself.
      </p>

      <h2>9. Changes to these terms</h2>
      <p>
        We may update these terms. Substantial changes will bump the &quot;Last updated&quot;
        date at the top and be visible in the repo&apos;s commit history. Continuing to use
        Hangar after a change means accepting the updated terms; if you don&apos;t accept them,
        stop using Hangar (which conveniently requires nothing of you).
      </p>

      <h2>10. Open-source first</h2>
      <p>
        Hangar is open-source software with no commercial relationship between us and you.
        There&apos;s no contract, no SLA, and no support obligation. To the extent any dispute
        arises, please raise it through the GitHub repository&apos;s issue tracker first; if
        that fails, applicable open-source licensing law and your local jurisdiction&apos;s laws
        govern.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms? Open an issue at{" "}
        <a href="https://github.com/ClaudevGuy/hangar/issues" target="_blank" rel="noreferrer">
          github.com/ClaudevGuy/hangar/issues
        </a>
        .
      </p>
    </LegalShell>
  );
}
