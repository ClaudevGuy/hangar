import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type EaseFn = (t: number) => number;

export const Easing = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - --t * t * t * t,
  easeInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },
  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: (t: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
} satisfies Record<string, EaseFn>;

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

interface TimelineState {
  time: number;
  duration: number;
  playing: boolean;
}

const TimelineContext = createContext<TimelineState>({
  time: 0,
  duration: 10,
  playing: false,
});

interface SpriteState {
  localTime: number;
  progress: number;
  duration: number;
  visible: boolean;
}

const SpriteContext = createContext<SpriteState>({
  localTime: 0,
  progress: 0,
  duration: 0,
  visible: false,
});

export const useSprite = () => useContext(SpriteContext);

interface SpriteProps {
  start?: number;
  end?: number;
  keepMounted?: boolean;
  children: ReactNode | ((s: SpriteState) => ReactNode);
}

export function Sprite({
  start = 0,
  end = Infinity,
  children,
  keepMounted = false,
}: SpriteProps) {
  const { time } = useContext(TimelineContext);
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;

  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress =
    duration > 0 && Number.isFinite(duration)
      ? clamp(localTime / duration, 0, 1)
      : 0;

  const value: SpriteState = { localTime, progress, duration, visible };

  return (
    <SpriteContext.Provider value={value}>
      {typeof children === "function" ? children(value) : children}
    </SpriteContext.Provider>
  );
}

interface StageProps {
  width?: number;
  height?: number;
  duration?: number;
  background?: string;
  loop?: boolean;
  autoplay?: boolean;
  children: ReactNode;
}

export function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = "#0a0a0a",
  loop = true,
  autoplay = true,
  children,
}: StageProps) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [scale, setScale] = useState(1);

  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const s = Math.min(el.clientWidth / width, el.clientHeight / height);
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [width, height]);

  useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) {
          if (loop) next = next % duration;
          else {
            next = duration;
            setPlaying(false);
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop]);

  const ctxValue = useMemo<TimelineState>(
    () => ({ time, duration, playing }),
    [time, duration, playing],
  );

  return (
    <div
      ref={stageRef}
      onClick={() => setPlaying((p) => !p)}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width,
          height,
          background,
          position: "relative",
          transform: `scale(${scale})`,
          transformOrigin: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <TimelineContext.Provider value={ctxValue}>
          {children}
        </TimelineContext.Provider>
      </div>
    </div>
  );
}
