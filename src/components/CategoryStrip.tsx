import { CATEGORIES } from "../data/tools";
import { useDragScroll } from "../hooks/useDragScroll";
import type { CategoryId } from "../types";

interface Props {
  active: CategoryId;
  setActive: (id: CategoryId) => void;
  counts: Partial<Record<CategoryId, number>>;
}

export function CategoryStrip({ active, setActive, counts }: Props) {
  const { ref, dragging } = useDragScroll<HTMLDivElement>();
  return (
    <div className="cat-strip">
      <div ref={ref} className={`cat-strip-inner ${dragging ? "is-dragging" : ""}`}>
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`cat-chip ${active === c.id ? "active" : ""}`}
            onClick={() => setActive(c.id)}
          >
            {c.icon} {c.name} <span className="muted">{counts[c.id] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
