import { Stage } from "../showcase/animations";
import { HangarShowcase } from "../showcase/scenes";

export function Showcase() {
  return (
    <section id="showcase" className="lp-showcase">
      <div className="lp-wrap">
        <div className="lp-sec-head">
          <div className="lp-sec-eyebrow">Watch it work</div>
          <h2 className="lp-sec-title">
            Forty seconds. <span className="lp-soft">Your whole stack.</span>
          </h2>
        </div>
        <div className="lp-showcase-frame">
          <Stage width={1920} height={1080} duration={40} loop autoplay>
            <HangarShowcase />
          </Stage>
        </div>
      </div>
    </section>
  );
}
