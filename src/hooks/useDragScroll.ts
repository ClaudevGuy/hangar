import { useEffect, useRef, useState } from "react";

const DRAG_THRESHOLD_PX = 6;

// Click-and-drag horizontal scrolling for any overflow-x: auto container.
// Mouse-only; touch & trackpad already scroll natively. Suppresses the click
// that would otherwise fire on a child button after a drag-release.
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let pointerId = -1;
    let startX = 0;
    let scrollStart = 0;
    let moved = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      scrollStart = el.scrollLeft;
      moved = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > DRAG_THRESHOLD_PX) {
        moved = true;
        setDragging(true);
        try { el.setPointerCapture(pointerId); } catch { /* noop */ }
      }
      if (moved) {
        el.scrollLeft = scrollStart - dx;
        e.preventDefault();
      }
    };

    const finish = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = -1;
      if (moved) {
        moved = false;
        setDragging(false);
        // Eat the click that would otherwise fire on a child button.
        const suppress = (ev: MouseEvent) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        window.addEventListener("click", suppress, { capture: true, once: true });
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", finish);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", finish);
      el.removeEventListener("pointercancel", finish);
    };
  }, []);

  return { ref, dragging } as const;
}
