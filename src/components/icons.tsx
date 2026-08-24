import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size?: number) => ({
  width: size ?? 20,
  height: size ?? 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

/** Libro abierto del que emergen ondas de voz. */
export function LogoMark({ size, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M12 6.5C10 4.9 7.3 4.4 4 4.4v13.2c3.3 0 6 .5 8 2.1 2-1.6 4.7-2.1 8-2.1V4.4c-3.3 0-6 .5-8 2.1Z" />
      <path d="M12 6.5v13.2" />
      <path d="M16.8 1.6c1.9 1.5 1.9 3.7 0 5.2" opacity=".85" />
      <path d="M19.2.2c2.9 2.5 2.9 6.5 0 9" opacity=".55" />
    </svg>
  );
}

export const IconPlay = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M7.5 5.2v13.6c0 .8.9 1.3 1.6.9l10.4-6.8c.6-.4.6-1.4 0-1.8L9.1 4.3c-.7-.4-1.6.1-1.6.9Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPause = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="6.5" y="4.5" width="3.6" height="15" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.9" y="4.5" width="3.6" height="15" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPrev = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M17 5.5v13M14.5 12 7 17V7l7.5 5Z" fill="currentColor" stroke="none" />
    <path d="M17 5.5v13" />
  </svg>
);

export const IconNext = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M7 5.5v13M9.5 12 17 17V7l-7.5 5Z" fill="currentColor" stroke="none" />
    <path d="M7 5.5v13" />
  </svg>
);

export const IconRestart = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4.5 9a8 8 0 1 1-1 5.5" />
    <path d="M4 4.5V9h4.5" />
  </svg>
);

export const IconDoc = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 2.8h8l4 4.2v14.2H6z" />
    <path d="M14 2.8V7h4" />
    <path d="M9 12h6M9 15.5h6M9 8.5h2.5" />
  </svg>
);

export const IconDrop = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3.5v9" />
    <path d="M8.5 9 12 12.5 15.5 9" />
    <path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
  </svg>
);

/** Nota al pie: párrafo con sangría y marca numérica. */
export const IconFootnote = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 4.5h16M4 8h16M4 11.5h10" />
    <path d="M13.5 16.5v3.6h2.6" />
    <path d="M16.1 16.5h2.2M17.2 16.5v3.6" opacity=".9" />
  </svg>
);

/** Número de página tachado. */
export const IconPageNum = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 5h14v14H5z" />
    <path d="M9.2 9.2 12 12l2.8 2.8M14.8 9.2 12 12 9.2 14.8" opacity=".9" />
    <path d="M3.5 20.5l17-17" strokeWidth="2" />
  </svg>
);

/** Encabezado/pie repetido: líneas cortas arriba y abajo. */
export const IconRunning = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M7 4.5h10" />
    <path d="M4 8.5h16M4 12h16M4 15.5h16" opacity=".9" />
    <path d="M7 19.5h10" />
    <path d="M3 4.5h1.5M19.5 4.5H21M3 19.5h1.5M19.5 19.5H21" opacity=".6" />
  </svg>
);

export const IconToc = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 5h9M4 12h11M4 19h7" />
    <path d="M17 5h3M18.5 12H21M15.5 19h3" opacity=".6" />
    <path d="M16.5 5 19 7.5 16.5 10" opacity=".8" />
  </svg>
);

export const IconX = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconCheck = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const IconAlert = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3.5 22 20H2L12 3.5Z" />
    <path d="M12 10v4.2M12 17.2v.1" />
  </svg>
);

export const IconSpeaker = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
    <path d="M15.5 9c1.6 1.6 1.6 4.4 0 6" />
    <path d="M18 6.5c3 3 3 8 0 11" opacity=".6" />
  </svg>
);

export const IconFilter = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 5h16l-6.2 7.2v5.3L10.2 20v-7.8L4 5Z" />
  </svg>
);

export const IconChevL = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m14.5 5.5-6 6.5 6 6.5" />
  </svg>
);

export const IconChevR = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m9.5 5.5 6 6.5-6 6.5" />
  </svg>
);

export const IconKeys = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="7" width="18" height="11" rx="1.5" />
    <path d="M6.5 10.2h.1M10 10.2h.1M13.5 10.2h.1M17 10.2h.1M8 14.5h8" />
  </svg>
);

export const IconWave = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 12h1.5" />
    <path d="M7 8.5v7M11 5.5v13M15 8v8M19 10v4" />
  </svg>
);

export const IconBook = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 4.8h6.2c1 0 1.8.8 1.8 1.8v12.6c-.9-.7-2.2-1.1-3.6-1.1H4V4.8Z" />
    <path d="M20 4.8h-6.2c-1 0-1.8.8-1.8 1.8v12.6c.9-.7 2.2-1.1 3.6-1.1H20V4.8Z" />
  </svg>
);

export const IconClock = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);
