// Compact relative-time string for the launcher: "just now", "12m ago",
// "3h ago", "yesterday", "5d ago", "2w ago", "3mo ago".
export function timeAgo(ts: number, now: number = Date.now()): string {
  const diff = now - ts;
  if (diff < 60_000) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
