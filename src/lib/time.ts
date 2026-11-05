export function relativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, now - then);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) return "Just now";
  if (diff < hour) {
    const n = Math.round(diff / minute);
    return n === 1 ? "1 minute ago" : `${n} minutes ago`;
  }
  if (diff < day) {
    const n = Math.round(diff / hour);
    return n === 1 ? "1 hour ago" : `${n} hours ago`;
  }
  if (diff < month) {
    const n = Math.round(diff / day);
    return n === 1 ? "1 day ago" : `${n} days ago`;
  }
  if (diff < year) {
    const n = Math.round(diff / month);
    return n === 1 ? "1 month ago" : `${n} months ago`;
  }
  const n = Math.round(diff / year);
  return n === 1 ? "1 year ago" : `${n} years ago`;
}

export function aspectFromSize(width?: number, height?: number): string {
  if (!width || !height) return "3:4";
  const ratio = width / height;
  if (ratio > 1.7) return "16:9";
  if (ratio > 1.2) return "4:3";
  if (ratio > 0.9) return "1:1";
  if (ratio > 0.62) return "3:4";
  return "9:16";
}
