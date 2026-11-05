import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function svg(props: IconProps) {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    ...props,
  };
}

export function Mark(props: IconProps) {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="8" fill="#161616" />
      <rect x="7" y="7" width="18" height="18" rx="3" stroke="#fff" strokeWidth="1.7" />
      <rect x="11.5" y="11.5" width="9" height="9" rx="1.5" fill="#ff3d9a" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function LibraryIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 20" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.5V20h11V9.5" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ChevronLeft(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M14.5 6 8.5 12l6 6" />
    </svg>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M9.5 6 15.5 12l-6 6" />
    </svg>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M14 5h5v5" />
      <path d="M19 5 10 14" />
      <path d="M17 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5.5" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </svg>
  );
}

export function StackIcon(props: IconProps) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true" {...props}>
      <rect x="22" y="14" width="30" height="38" rx="3" fill="#3b82f6" />
      <path d="M30 22h14M33 28h8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="16" y="20" width="30" height="38" rx="3" fill="#22c55e" />
      <rect x="10" y="26" width="30" height="38" rx="3" fill="#f97316" />
      <rect x="18" y="18" width="34" height="42" rx="4" fill="#2563eb" stroke="#1d4ed8" />
      <path d="M28 30h16M30 36h12M32 42h8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="40" cy="24" r="3" fill="#93c5fd" />
    </svg>
  );
}
