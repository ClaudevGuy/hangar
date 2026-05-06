import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      className={`lp-tower${visible ? " is-visible" : ""}`}
      onClick={handleClick}
      aria-label="Return to tower (scroll to top)"
      title="Return to tower"
    >
      <span className="lp-tower-pulse" aria-hidden />
      <svg
        viewBox="0 0 32 32"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M4 24 16 6l12 18M4 24h24M9 24v-6h14v6" />
        <path d="M16 14v-6M13 11l3-3 3 3" />
      </svg>
      <span className="lp-tower-label">TOWER</span>
    </button>
  );
}
