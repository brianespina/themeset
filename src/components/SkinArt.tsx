"use client";

import { useState } from "react";

export type WeaponGroup = "ak" | "m4" | "awp" | "pistol" | "knife" | "gloves";

interface SkinArtProps {
  weapon: string;
  src?: string;
  alt?: string;
  c1?: string;
  c2?: string;
  c3?: string;
}

function groupOf(weapon: string): WeaponGroup {
  const w = (weapon || "ak").toLowerCase();
  if (w.indexOf("ak") === 0 || w === "galil" || w === "famas") return "ak";
  if (w === "m4" || w === "m4a1" || w === "m4a4" || w === "smg" || w === "mp9" || w === "aug") return "m4";
  if (w === "awp" || w === "ssg" || w === "scar") return "awp";
  if (w === "knife") return "knife";
  if (w === "gloves") return "gloves";
  return "pistol";
}

/**
 * Renders a skin's artwork: the real image when it loads, or a flat
 * three-colour SVG silhouette per weapon group on error. Ported from the
 * design prototype's SkinArt.dc.html, including its per-URL failure memory.
 */
export function SkinArt({ weapon, src, alt, c1 = "#8A8A93", c2 = "#2A2A31", c3 = "#C9A227" }: SkinArtProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const group = groupOf(weapon);
  const hasSrc = !!src && failed !== src;

  if (hasSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || ""}
        onError={() => setFailed(src!)}
        className="skin-art-shadow max-h-full max-w-full object-contain"
        style={{ color: "transparent", fontSize: 0 }}
      />
    );
  }

  switch (group) {
    case "ak":
      return (
        <svg viewBox="0 0 240 80" className="skin-art-shadow block w-full h-auto">
          <path d="M0,33 L30,25 L36,25 L36,47 L27,53 L0,45 Z" fill={c2} />
          <rect x="34" y="23" width="64" height="23" fill={c1} />
          <path d="M46,46 L61,46 L57,71 L44,71 Z" fill={c2} />
          <path d="M67,46 L93,46 L98,72 C86,79 74,78 67,72 Z" fill={c2} />
          <rect x="96" y="28" width="50" height="15" fill={c1} />
          <rect x="96" y="21" width="46" height="6" fill={c3} />
          <rect x="145" y="31" width="72" height="7" fill={c3} />
          <rect x="198" y="17" width="8" height="15" fill={c3} />
        </svg>
      );
    case "m4":
      return (
        <svg viewBox="0 0 240 80" className="skin-art-shadow block w-full h-auto">
          <rect x="0" y="27" width="36" height="17" rx="3" fill={c2} />
          <rect x="34" y="21" width="58" height="25" fill={c1} />
          <rect x="34" y="14" width="58" height="7" rx="2" fill={c3} />
          <path d="M45,46 L60,46 L56,69 L43,69 Z" fill={c2} />
          <path d="M65,46 L88,46 L88,75 L65,75 Z" fill={c2} />
          <rect x="91" y="25" width="53" height="17" rx="2" fill={c1} />
          <rect x="143" y="26" width="78" height="15" rx="7" fill={c3} />
        </svg>
      );
    case "awp":
      return (
        <svg viewBox="0 0 240 80" className="skin-art-shadow block w-full h-auto">
          <path
            fillRule="evenodd"
            d="M0,42 L18,26 L62,26 L62,58 L26,58 L0,50 Z M34,42 a9,9 0 1,0 0.1,0 Z"
            fill={c2}
          />
          <rect x="60" y="28" width="86" height="20" fill={c1} />
          <rect x="98" y="48" width="26" height="16" rx="2" fill={c2} />
          <rect x="74" y="10" width="72" height="12" rx="6" fill={c3} />
          <rect x="84" y="20" width="8" height="9" fill={c3} />
          <rect x="130" y="20" width="8" height="9" fill={c3} />
          <rect x="145" y="33" width="93" height="8" rx="3" fill={c3} />
          <rect x="203" y="31" width="14" height="12" rx="3" fill={c1} />
        </svg>
      );
    case "knife":
      return (
        <svg viewBox="0 0 240 110" className="skin-art-shadow block w-[88%] h-auto mx-auto">
          <path
            d="M62,90 C64,44 106,16 172,18 C196,19 208,32 200,46 C178,32 118,38 86,90 Z"
            fill={c1}
          />
          <path d="M70,86 C76,50 112,28 168,28 C150,36 100,52 82,86 Z" fill={c3} opacity="0.9" />
          <path d="M60,88 L88,88 L74,104 L42,104 Z" fill={c2} />
          <circle cx="24" cy="86" r="15" fill="none" stroke={c2} strokeWidth="10" />
        </svg>
      );
    case "gloves":
      return (
        <svg viewBox="0 0 200 110" className="skin-art-shadow block w-[64%] h-auto mx-auto">
          <rect x="44" y="12" width="21" height="46" rx="10" fill={c1} />
          <rect x="67" y="4" width="21" height="54" rx="10" fill={c1} />
          <rect x="90" y="8" width="21" height="50" rx="10" fill={c1} />
          <rect x="113" y="20" width="21" height="38" rx="10" fill={c1} />
          <rect x="40" y="40" width="98" height="50" rx="16" fill={c1} />
          <rect x="132" y="52" width="42" height="21" rx="10" fill={c1} />
          <rect x="36" y="78" width="106" height="8" fill={c3} />
          <rect x="36" y="84" width="106" height="22" rx="6" fill={c2} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 110" className="skin-art-shadow block w-[78%] h-auto mx-auto">
          <rect x="42" y="16" width="130" height="22" rx="3" fill={c1} />
          <rect x="168" y="22" width="16" height="10" fill={c3} />
          <path d="M42,38 L150,38 L150,52 L96,52 L84,54 L60,100 L34,100 L46,54 Z" fill={c2} />
          <path d="M76,52 L104,52 L98,66 C88,70 78,64 76,56 Z" fill={c3} />
        </svg>
      );
  }
}

/** The standard art-well wrapper used across the product. */
export function ArtWell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-surface-sunken border border-border-soft ${className}`}
    >
      {children}
    </div>
  );
}
