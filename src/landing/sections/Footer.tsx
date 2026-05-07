export function Footer() {
  // 36 compass ticks every 10°; majors every 30° are longer and brighter.
  const compassTicks = Array.from({ length: 36 }, (_, i) => {
    const angle = i * 10;
    const major = i % 3 === 0;
    const inner = major ? 88 : 93;
    const outer = 100;
    return (
      <line
        key={i}
        x1="0" y1={-inner} x2="0" y2={-outer}
        transform={`rotate(${angle})`}
        stroke="currentColor"
        strokeOpacity={major ? 0.45 : 0.22}
        strokeWidth={major ? 1 : 0.6}
      />
    );
  });

  return (
    <footer className="lp-footer">
      <div className="lp-footer-fx" aria-hidden="true">
        {/* Background chart — covers the full footer width. The viewBox is
            tuned to a typical footer aspect (~4.3:1) and anchored to the
            bottom (xMidYMax slice) so the runway and compass always show. */}
        <svg
          className="lp-footer-chart"
          viewBox="0 0 1200 280"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="lp-chart-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.7" fill="currentColor" fillOpacity="0.18" />
            </pattern>
            <pattern id="lp-chart-ticks-x" x="0" y="0" width="40" height="8" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeOpacity="0.22" strokeWidth="0.6" />
            </pattern>
            <pattern id="lp-chart-ticks-y" x="0" y="0" width="8" height="40" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="6" y2="0" stroke="currentColor" strokeOpacity="0.22" strokeWidth="0.6" />
            </pattern>
          </defs>

          {/* Dot grid covers the whole viewBox */}
          <rect width="1200" height="280" fill="url(#lp-chart-dots)" />
          {/* Chart border tick rules along top + left */}
          <rect x="0" y="0" width="1200" height="6" fill="url(#lp-chart-ticks-x)" />
          <rect x="0" y="0" width="6" height="280" fill="url(#lp-chart-ticks-y)" />

          {/* Concentric distance arcs from the compass — fan out across the page */}
          <g fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 6">
            <circle cx="200" cy="180" r="240" strokeOpacity="0.11" />
            <circle cx="200" cy="180" r="380" strokeOpacity="0.09" />
            <circle cx="200" cy="180" r="540" strokeOpacity="0.07" />
            <circle cx="200" cy="180" r="720" strokeOpacity="0.05" />
          </g>

          {/* Bearing rays from compass to right edge */}
          <g stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.11" strokeDasharray="2 5">
            <line x1="200" y1="180" x2="1200" y2="20" />
            <line x1="200" y1="180" x2="1200" y2="80" />
            <line x1="200" y1="180" x2="1200" y2="140" />
            <line x1="200" y1="180" x2="1200" y2="220" />
          </g>

          {/* Compass rose — left anchor of the composition */}
          <g transform="translate(200,180)" className="lp-chart-compass">
            <circle r="40" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.6" />
            <circle r="70" fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="0.6" />
            <circle r="100" fill="none" stroke="currentColor" strokeOpacity="0.32" strokeWidth="1" />
            <line x1="-100" y1="0" x2="100" y2="0" stroke="currentColor" strokeOpacity="0.22" strokeWidth="0.7" />
            <line x1="0" y1="-100" x2="0" y2="100" stroke="currentColor" strokeOpacity="0.22" strokeWidth="0.7" />
            {compassTicks}
            <text x="0" y="-108" textAnchor="middle" fontFamily="ui-monospace, monospace"
                  fontSize="8.5" fill="currentColor" fillOpacity="0.6" letterSpacing="2">N</text>
            <text x="111" y="3" textAnchor="middle" fontFamily="ui-monospace, monospace"
                  fontSize="8.5" fill="currentColor" fillOpacity="0.6" letterSpacing="2">E</text>
            <text x="0" y="116" textAnchor="middle" fontFamily="ui-monospace, monospace"
                  fontSize="8.5" fill="currentColor" fillOpacity="0.6" letterSpacing="2">S</text>
            <text x="-111" y="3" textAnchor="middle" fontFamily="ui-monospace, monospace"
                  fontSize="8.5" fill="currentColor" fillOpacity="0.6" letterSpacing="2">W</text>
            <g className="lp-chart-needle">
              <line x1="0" y1="0" x2="0" y2="-72" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.4" />
              <line x1="0" y1="0" x2="0" y2="28" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1" />
              <circle r="2.6" fill="currentColor" fillOpacity="0.75" />
            </g>
          </g>

          {/* Curved flight path from compass center toward upper-right then back down */}
          <path
            d="M 200 180 Q 600 50 1080 220"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.28"
            strokeWidth="0.8"
            strokeDasharray="3 5"
          />

          {/* Aircraft on path, mid-flight */}
          <g transform="translate(680,108) rotate(28)" className="lp-chart-aircraft">
            <polygon points="0,-7 5,5 0,3 -5,5" fill="currentColor" fillOpacity="0.8" />
          </g>

          {/* Holding pattern racetrack — right anchor, balances compass */}
          <g transform="translate(1020,180)" className="lp-chart-hold">
            <line x1="-50" y1="-22" x2="50" y2="-22" stroke="currentColor" strokeOpacity="0.30" strokeWidth="0.8" />
            <path d="M 50 -22 A 22 22 0 0 1 50 22" fill="none" stroke="currentColor" strokeOpacity="0.30" strokeWidth="0.8" />
            <line x1="50" y1="22" x2="-50" y2="22" stroke="currentColor" strokeOpacity="0.30" strokeWidth="0.8" />
            <path d="M -50 22 A 22 22 0 0 1 -50 -22" fill="none" stroke="currentColor" strokeOpacity="0.30" strokeWidth="0.8" />
            <polygon points="-10,-22 -7,-19 -7,-25" fill="currentColor" fillOpacity="0.6" />
            <text x="0" y="40" textAnchor="middle" fontFamily="ui-monospace, monospace"
                  fontSize="8" fill="currentColor" fillOpacity="0.55" letterSpacing="2.5">HOLD · 4500</text>
          </g>

          {/* Runway diagram — y near bottom of viewBox so xMidYMax keeps it on screen */}
          <g transform="translate(0,256)" className="lp-chart-runway">
            <line x1="120" y1="0" x2="1080" y2="0" stroke="currentColor" strokeOpacity="0.34" strokeWidth="1" />
            <line x1="120" y1="18" x2="1080" y2="18" stroke="currentColor" strokeOpacity="0.34" strokeWidth="1" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={`l${i}`} x1={128 + i * 4} y1="2" x2={128 + i * 4} y2="16"
                    stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.7" />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={`r${i}`} x1={1072 - i * 4} y1="2" x2={1072 - i * 4} y2="16"
                    stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.7" />
            ))}
            <line x1="172" y1="9" x2="1028" y2="9" stroke="currentColor"
                  strokeOpacity="0.45" strokeWidth="0.8" strokeDasharray="14 12" />
            <text x="172" y="13" fontFamily="ui-monospace, monospace" fontSize="9"
                  fill="currentColor" fillOpacity="0.7" letterSpacing="1">21</text>
            <text x="1028" y="13" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="9"
                  fill="currentColor" fillOpacity="0.7" letterSpacing="1">03</text>
          </g>
        </svg>

        {/* Four corner readouts — ICAO frequency block style, themed in mono.
            Bottom readouts sit above the runway zone via CSS bottom: 36px. */}
        <div className="lp-footer-readout lp-footer-readout-tl">
          LPPT · TWR 119.10 · GND 121.75
        </div>
        <div className="lp-footer-readout lp-footer-readout-tr">
          38°46&apos;N · 09°08&apos;W · ELEV 374
        </div>
        <div className="lp-footer-readout lp-footer-readout-bl">
          RWY 03/21 · 12 484 FT · ILS
        </div>
        <div className="lp-footer-readout lp-footer-readout-br">
          VOR LIS 114.80 · ATIS 124.27
        </div>
      </div>

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
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Resources</h4>
            <ul>
              <li>
                <a href="https://github.com/ClaudevGuy/hangar" target="_blank" rel="noreferrer">
                  Docs
                </a>
              </li>
              <li><a href="#">API</a></li>
              <li><a href="#">Status</a></li>
              <li><a href="#">Security</a></li>
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
