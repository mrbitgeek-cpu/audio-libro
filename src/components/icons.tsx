import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base: P = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const IcLogo = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 6.3C10.1 4.8 7.4 4.2 4 4.2v13.6c3.4 0 6.1.6 8 2.1 1.9-1.5 4.6-2.1 8-2.1V4.2c-3.4 0-6.1.6-8 2.1Z" />
    <path d="M12 6.3v13.6" />
    <path d="M15.6 8.6c.5 1 .5 2 0 3M17.8 7.2c1 1.8 1 3.6 0 5.4" strokeWidth={1.5} />
  </svg>
);

export const IcPlay = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8 5.4v13.2c0 .8.9 1.3 1.6.9l10.2-6.6c.6-.4.6-1.4 0-1.8L9.6 4.5c-.7-.4-1.6.1-1.6.9Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IcPause = (p: P) => (
  <svg {...base} {...p}>
    <rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.9" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IcStop = (p: P) => (
  <svg {...base} {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const IcPrev = (p: P) => (
  <svg {...base} {...p}>
    <path d="M11.5 7.5 6 12l5.5 4.5M18 7.5 12.5 12l5.5 4.5" />
  </svg>
);

export const IcNext = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 7.5 5.5 4.5L6 16.5M12.5 7.5 18 12l-5.5 4.5" />
  </svg>
);

export const IcChevL = (p: P) => (
  <svg {...base} {...p}>
    <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
  </svg>
);

export const IcChevR = (p: P) => (
  <svg {...base} {...p}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </svg>
);

export const IcUpload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 15V4m0 0 4 4m-4-4L8 8" />
    <path d="M4 15v3.4c0 .9.7 1.6 1.6 1.6h12.8c.9 0 1.6-.7 1.6-1.6V15" />
  </svg>
);

export const IcPlus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IcX = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IcBook = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 19.2V5.6C4 4.7 4.7 4 5.6 4H19a1 1 0 0 1 1 1v12.5a1 1 0 0 1-1 1H6.4c-1.3 0-2.4 1-2.4 2.3 0-1.2 1-1.6 2.4-1.6H20" />
  </svg>
);

export const IcFilePdf = (p: P) => (
  <svg {...base} {...p}>
    <path d="M13.5 3H7a1.6 1.6 0 0 0-1.6 1.6v14.8A1.6 1.6 0 0 0 7 21h10a1.6 1.6 0 0 0 1.6-1.6V8.1L13.5 3Z" />
    <path d="M13.5 3v5.1h5.1" />
    <path d="M8.5 13.5h7M8.5 16.5h5" />
  </svg>
);

export const IcEpub = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 6.6C10.2 5.2 7.6 4.6 4.4 4.6v13c3.2 0 5.8.6 7.6 2 1.8-1.4 4.4-2 7.6-2v-13c-3.2 0-5.8.6-7.6 2Z" />
    <path d="M12 6.6v13" />
  </svg>
);

export const IcSparkle = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4.5c.6 3.4 2.1 4.9 5.5 5.5-3.4.6-4.9 2.1-5.5 5.5-.6-3.4-2.1-4.9-5.5-5.5 3.4-.6 4.9-2.1 5.5-5.5Z" />
    <path d="M18.5 15.5c.3 1.6 1 2.3 2.5 2.6-1.5.3-2.2 1-2.5 2.6-.3-1.6-1-2.3-2.5-2.6 1.5-.3 2.2-1 2.5-2.6Z" />
  </svg>
);

export const IcFunnel = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 5h16l-6.2 7.2v5.3L10.2 20v-7.8L4 5Z" />
  </svg>
);

export const IcHash = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9.5 4 8 20M16 4l-1.5 16M5 9h15M4 15h15" />
  </svg>
);

export const IcLayers = (p: P) => (
  <svg {...base} {...p}>
    <path d="m12 3.5 8 4.2-8 4.2-8-4.2 8-4.2Z" />
    <path d="m4 12.3 8 4.2 8-4.2M4 16.5l8 4.2 8-4.2" opacity={0.55} />
  </svg>
);

export const IcAsterisk = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4.5v15M5.5 8.2l13 7.6M18.5 8.2l-13 7.6" />
  </svg>
);

export const IcClock = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.5V12l3 2.2" />
  </svg>
);

export const IcTrash = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 6.5h15M9.5 6V4.6c0-.6.4-1 1-1h3c.6 0 1 .4 1 1V6M6.5 6.5l.8 12.2c0 .7.6 1.3 1.3 1.3h6.8c.7 0 1.3-.6 1.3-1.3l.8-12.2" />
    <path d="M10 10.5v6M14 10.5v6" opacity={0.6} />
  </svg>
);

export const IcVoice = (p: P) => (
  <svg {...base} {...p}>
    <path d="M11 5.4 6.8 9H4.2v6h2.6L11 18.6V5.4Z" />
    <path d="M14.5 9.2a4 4 0 0 1 0 5.6M17 6.8a7.4 7.4 0 0 1 0 10.4" />
  </svg>
);

export const IcMenu = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);

export const IcEye = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2.8 12S6.2 5.8 12 5.8 21.2 12 21.2 12 17.8 18.2 12 18.2 2.8 12 2.8 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

export const IcAlert = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4.2 2.8 19.4h18.4L12 4.2Z" />
    <path d="M12 10v4.2M12 16.8v.4" />
  </svg>
);

export const IcCheck = (p: P) => (
  <svg {...base} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IcGauge = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 16.5a8.5 8.5 0 1 1 15 0" />
    <path d="m12 14 3.5-4.5" />
    <circle cx="12" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const IcWave = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 12h1.8M6.6 8.5v7M10.2 5.5v13M13.8 8v8M17.4 6.5v11M21 10v4" />
  </svg>
);

export const IcArrowR = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />
  </svg>
);

export const IcMic = (p: P) => (
  <svg {...base} {...p}>
    <rect x="9.2" y="3.2" width="5.6" height="10.6" rx="2.8" />
    <path d="M5.5 11.8a6.5 6.5 0 0 0 13 0M12 18.3v2.7m-3 0h6" />
  </svg>
);

export const IcDownload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
    <path d="M4 15.5v3c0 .8.7 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5v-3" />
  </svg>
);

export const IcPen = (p: P) => (
  <svg {...base} {...p}>
    <path d="m14.5 5.5 4 4L8 20l-4.6 1.1L4.5 16 15 5.5Z" />
    <path d="m13 7 4 4" />
  </svg>
);

export const IcShare = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="17.5" cy="5.5" r="2.6" />
    <circle cx="17.5" cy="18.5" r="2.6" />
    <path d="m8.4 10.8 6.8-4M8.4 13.2l6.8 4" />
  </svg>
);

export const IcShield = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 5 6v5.6c0 4.4 2.9 7.4 7 8.9 4.1-1.5 7-4.5 7-8.9V6l-7-2.5Z" />
    <path d="m9 11.8 2.2 2.2L15.4 9.6" />
  </svg>
);
