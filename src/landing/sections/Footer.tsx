export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <a className="lp-brand" href="#top">
              <svg viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 24 16 6l12 18M4 24h24M9 24v-6h14v6" />
              </svg>
              <span>Hangar</span>
            </a>
            <p>
              The control tower for the developer who's tired of opening twelve tabs to remember if
              the deploy went through.
            </p>
          </div>
          <div className="lp-footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#catalog">Catalog</a></li>
              <li><a href="#install">Install</a></li>
              <li>
                <a href="https://github.com/ClaudevGuy/hangar" target="_blank" rel="noreferrer">
                  Changelog
                </a>
              </li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
              <li>
                <a href="https://github.com/ClaudevGuy/hangar/blob/main/LICENSE" target="_blank" rel="noreferrer">
                  License (MIT)
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bot">
          <div className="lp-made">
            <span className="lp-pulse" />
            All systems nominal
          </div>
          <div>© {new Date().getFullYear()} Hangar Labs · Made in Lisbon</div>
        </div>
      </div>
    </footer>
  );
}
