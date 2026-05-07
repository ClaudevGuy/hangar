import { LegalShell } from "./LegalShell";

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" eyebrow="Legal" lastUpdated="May 7, 2026">
      <section className="legal-tldr">
        <h2 className="legal-tldr-label">TL;DR</h2>
        <p>
          Hangar runs entirely in your browser. We don&apos;t have a database, accounts,
          analytics, or telemetry. Your stack, tokens, and activity live in your browser&apos;s
          <code> localStorage</code> and never reach a Hangar server. The whole codebase is open
          source — read it.
        </p>
      </section>

      <h2>What this policy covers</h2>
      <p>
        This policy applies to <code>hangar-silk.vercel.app</code> (the marketing site you&apos;re
        on now) and to the local Hangar app you install yourself. The local app saves data on
        your machine and runs in your browser. We&apos;ve gone out of our way to keep the surface
        area where we could collect anything close to zero, on purpose.
      </p>

      <h2>Information we collect</h2>
      <p>
        <strong>None, at the application level.</strong> Hangar has no user accounts, no signups,
        no login forms, no analytics scripts, no telemetry pings, no error reporters, and no
        other mechanism that sends information about you back to us. You can verify this by
        reading the source code at{" "}
        <a href="https://github.com/ClaudevGuy/hangar" target="_blank" rel="noreferrer">
          github.com/ClaudevGuy/hangar
        </a>
        .
      </p>
      <p>
        The marketing site is hosted on Vercel. Vercel may collect standard server-access logs
        (IP address, user agent, request URL) for the marketing pages, the same way any web host
        does. We don&apos;t add analytics on top, and we don&apos;t access those logs as part of
        any product feature. Vercel&apos;s privacy policy covers their own log handling.
      </p>

      <h2>What lives in your browser only</h2>
      <p>
        When you use the Hangar app at <code>localhost:5173/app</code> after installing it, the
        following are stored in your browser&apos;s <code>localStorage</code> and never
        transmitted to us:
      </p>
      <ul>
        <li>Your pinned tools and stack configuration</li>
        <li>Per-tool plan and last-opened metadata</li>
        <li>API tokens you&apos;ve added (optionally encrypted with a master passphrase via the Web Crypto API — AES-GCM with PBKDF2 key derivation)</li>
        <li>Custom tools you&apos;ve added to your catalog</li>
        <li>Linkboard entries</li>
        <li>Theme, density, and accent preferences</li>
        <li>Workspace partitioning (each workspace is a separate localStorage namespace)</li>
      </ul>
      <p>
        Clearing your browser&apos;s storage (or using &quot;Forget my data&quot; in browser
        settings) removes everything. There is no &quot;cloud copy&quot; for us to delete on your
        behalf.
      </p>

      <h2>Third-party services you connect</h2>
      <p>
        Hangar&apos;s value comes from connecting to your existing dev tools. When you add an
        API token for any provider, your browser makes requests directly to that provider&apos;s
        API (or, for the two CORS-blocked exceptions, through a stateless proxy — see below).
        Your token, the request, and the response stay between your browser and that provider.
      </p>
      <p>
        Each provider has their own privacy policy and terms. Adding tokens to Hangar
        doesn&apos;t change anything about that relationship — you&apos;re still bound by the
        provider&apos;s terms, not by ours.
      </p>
      <p>Depending on which integrations you use, your browser may communicate directly with:</p>
      <ul>
        <li>GitHub (<code>api.github.com</code>) — when you add a GitHub PAT</li>
        <li>Vercel (<code>api.vercel.com</code>) — when you add a Vercel token</li>
        <li>Linear (<code>api.linear.app</code>) — when you add a Linear API key</li>
        <li>Anthropic (<code>api.anthropic.com</code>) — when you use the Brief / Investigate AI features with your own Anthropic API key</li>
        <li>Various StatusPage.io endpoints — for the Stack Health Radar, fetched as anonymous public requests with no token</li>
        <li>GitHub Gists — when you opt in to cross-device sync, your encrypted blob is read/written from a private gist on your own GitHub account using your PAT</li>
      </ul>

      <h2>Our two Vercel Functions</h2>
      <p>
        We run exactly two pieces of server-side code, both stateless:
      </p>
      <ol>
        <li>
          <code>/api/resend/*</code> — forwards Resend API requests. The Resend API blocks
          browser CORS, so this proxy passes your <code>Authorization</code> header through to{" "}
          <code>api.resend.com</code> and streams the response back.
        </li>
        <li>
          <code>/api/sentry/*</code> — forwards Sentry API requests. Same pattern: Sentry&apos;s
          API restricts browser origins, so this proxy passes the auth header through to{" "}
          <code>sentry.io/api/0</code>.
        </li>
      </ol>
      <p>
        Neither function writes to a database, logs the auth header, or persists any
        request/response data. The function source is in <code>api/resend/[...path].ts</code>{" "}
        and <code>api/sentry/[...path].ts</code> in the public repo — go read it. They&apos;re
        small enough to audit in a minute.
      </p>

      <h2>AI features (optional, your key)</h2>
      <p>
        The Brief and Investigate features call Anthropic&apos;s API <em>directly from your
        browser</em> using your own Anthropic API key from the vault. The data sent in those
        requests is a structured snapshot of your stack state (recent deploys, unresolved
        issues, urgent tickets) — but it goes from your browser straight to Anthropic, never
        through us. Anthropic&apos;s privacy and data-handling policies apply: see{" "}
        <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer">
          anthropic.com/legal/privacy
        </a>
        .
      </p>

      <h2>Stack Share URLs</h2>
      <p>
        The Share my stack feature encodes your stack into the URL hash fragment of a public
        URL. Browsers never send URL fragments to servers, so the data never reaches Hangar
        infrastructure even though the URL points to <code>hangar-silk.vercel.app</code>. The
        recipient&apos;s browser decodes the fragment locally to render the preview. Tokens are
        never included in share URLs.
      </p>

      <h2>Cookies and tracking</h2>
      <p>
        The marketing site doesn&apos;t set any tracking, advertising, or analytics cookies.
        Vercel may set technical cookies for hosting purposes (load balancing, etc.).
      </p>
      <p>
        The Hangar app doesn&apos;t use cookies at all. It uses <code>localStorage</code> (a
        different technology) which is scoped per-origin and never automatically transmitted
        with HTTP requests.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        Hangar is a developer tool. We don&apos;t knowingly collect information from anyone, but
        we&apos;d strongly prefer you don&apos;t let your kids manage your production tokens.
      </p>

      <h2>Your rights</h2>
      <p>
        Because your data lives in your browser, you have direct, complete control over it
        without needing us to do anything:
      </p>
      <ul>
        <li><strong>Access:</strong> open your browser&apos;s DevTools → Application → Local Storage to inspect everything stored.</li>
        <li><strong>Export:</strong> Settings → Data → <em>Export config</em> produces a JSON file with your full Hangar state.</li>
        <li><strong>Delete:</strong> clear your browser&apos;s data for the origin, or use Settings → Data → <em>Import</em> to overwrite with an empty config.</li>
        <li><strong>Modify:</strong> edit the exported JSON in any text editor and re-import it.</li>
      </ul>
      <p>
        There&apos;s nothing for us to &quot;honor&quot; or &quot;process&quot; on your behalf —
        your data is yours, on your machine.
      </p>

      <h2>Security</h2>
      <p>
        We&apos;ve made specific design decisions to reduce the blast radius of a vault leak:
      </p>
      <ul>
        <li>Optional master passphrase encrypts the vault at rest using AES-GCM with PBKDF2 key derivation (200,000 iterations) via the Web Crypto API.</li>
        <li>Auto-lock after 15 minutes of inactivity if a passphrase is set.</li>
        <li>The Resend and Sentry CORS proxies don&apos;t log the <code>Authorization</code> header.</li>
      </ul>
      <p>
        That said — your tokens are still in your browser&apos;s storage. If your machine is
        compromised, those tokens are reachable by an attacker the same way any browser-stored
        secret is. Use the master passphrase if your threat model includes that.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We&apos;ll update this page if anything material changes. Each update bumps the
        &quot;Last updated&quot; date at the top. Substantial changes will be noted in the
        repo&apos;s commit history (which is public and append-only).
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions, open an issue at{" "}
        <a href="https://github.com/ClaudevGuy/hangar/issues" target="_blank" rel="noreferrer">
          github.com/ClaudevGuy/hangar/issues
        </a>
        . For sensitive disclosures (e.g., a security vulnerability), please follow the
        responsible-disclosure flow in the repository&apos;s security policy.
      </p>
    </LegalShell>
  );
}
