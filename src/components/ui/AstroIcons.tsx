import React from 'react';

export type AstroIconProps = React.SVGProps<SVGSVGElement> & {
  name: string;
};

// Base SVG wrapper for consistent styling
const SvgBase = ({ children, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

export const AstroIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  // --- ZODIAC SIGNS ---
  aries: (props) => (
    <SvgBase {...props}>
      <path d="M4 10a8 8 0 0 1 16 0" />
      <path d="M12 2v20" />
    </SvgBase>
  ),
  taurus: (props) => (
    <SvgBase {...props}>
      <circle cx="12" cy="14" r="6" />
      <path d="M5 8c0-3 3-5 7-5s7 2 7 5" />
    </SvgBase>
  ),
  gemini: (props) => (
    <SvgBase {...props}>
      <path d="M5 5h14" />
      <path d="M5 19h14" />
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </SvgBase>
  ),
  cancer: (props) => (
    <SvgBase {...props}>
      <circle cx="16" cy="8" r="4" />
      <path d="M13 5c-3-2-7 0-7 5" />
      <circle cx="8" cy="16" r="4" />
      <path d="M11 19c3 2 7 0 7-5" />
    </SvgBase>
  ),
  leo: (props) => (
    <SvgBase {...props}>
      <circle cx="8" cy="8" r="3" />
      <path d="M10.5 9.5a5.5 5.5 0 0 1 8.5 4.5A4 4 0 1 1 11 14" />
    </SvgBase>
  ),
  virgo: (props) => (
    <SvgBase {...props}>
      <path d="M4 6v10a3 3 0 0 0 6 0V6" />
      <path d="M10 16a3 3 0 0 0 6 0V6" />
      <path d="M16 16c0 3 3 5 5 5" />
    </SvgBase>
  ),
  libra: (props) => (
    <SvgBase {...props}>
      <path d="M4 18h16" />
      <path d="M4 14h3a5 5 0 0 1 10 0h3" />
    </SvgBase>
  ),
  scorpio: (props) => (
    <SvgBase {...props}>
      <path d="M4 6v10a3 3 0 0 0 6 0V6" />
      <path d="M10 16a3 3 0 0 0 6 0V6" />
      <path d="M16 16v4" />
      <path d="M14 18l2 2 2-2" />
    </SvgBase>
  ),
  sagittarius: (props) => (
    <SvgBase {...props}>
      <path d="M19 5l-14 14" />
      <path d="M19 5v7" />
      <path d="M19 5h-7" />
      <path d="M10 10l4 4" />
    </SvgBase>
  ),
  capricorn: (props) => (
    <SvgBase {...props}>
      <path d="M5 8v6a4 4 0 0 0 8 0v-4" />
      <path d="M13 10a5 5 0 0 1 5 5c0 3-2 5-4 5" />
    </SvgBase>
  ),
  aquarius: (props) => (
    <SvgBase {...props}>
      <path d="M3 10l3-3 4 4 4-4 4 4 3-3" />
      <path d="M3 17l3-3 4 4 4-4 4 4 3-3" />
    </SvgBase>
  ),
  pisces: (props) => (
    <SvgBase {...props}>
      <path d="M7 4c-3 4-3 12 0 16" />
      <path d="M17 4c3 4 3 12 0 16" />
      <path d="M5 12h14" />
    </SvgBase>
  ),

  // --- PLANETS ---
  sun: (props) => (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </SvgBase>
  ),
  moon: (props) => (
    <SvgBase {...props}>
      <path d="M14 3a9 9 0 1 0 0 18 6.5 6.5 0 1 1 0-18z" />
    </SvgBase>
  ),
  mercury: (props) => (
    <SvgBase {...props}>
      <circle cx="12" cy="10" r="4" />
      <path d="M12 14v8" />
      <path d="M9 18h6" />
      <path d="M8 6a4 4 0 0 1 8 0" />
    </SvgBase>
  ),
  venus: (props) => (
    <SvgBase {...props}>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v8" />
      <path d="M9 18h6" />
    </SvgBase>
  ),
  mars: (props) => (
    <SvgBase {...props}>
      <circle cx="10" cy="14" r="5" />
      <path d="M13.5 10.5L19 5" />
      <path d="M14 5h5v5" />
    </SvgBase>
  ),
  jupiter: (props) => (
    <SvgBase {...props}>
      <path d="M12 4v16" />
      <path d="M8 14h8" />
      <path d="M15 4a4 4 0 0 0-4 4v4" />
    </SvgBase>
  ),
  saturn: (props) => (
    <SvgBase {...props}>
      <path d="M10 3v13" />
      <path d="M7 7h6" />
      <path d="M10 13a4 4 0 0 1 4 4c0 3-2 4-4 4a3 3 0 0 1-2-1l6-4" />
    </SvgBase>
  ),
  uranus: (props) => (
    <SvgBase {...props}>
      <circle cx="12" cy="18" r="3" />
      <path d="M12 15V8" />
      <path d="M9 12h6" />
      <path d="M9 8v7" />
      <path d="M15 8v7" />
      <path d="M12 8V3m-2 2l2-2 2 2" />
    </SvgBase>
  ),
  neptune: (props) => (
    <SvgBase {...props}>
      <path d="M12 21V5" />
      <path d="M9 17h6" />
      <path d="M5 5v7a7 7 0 0 0 14 0V5" />
    </SvgBase>
  ),
  pluto: (props) => (
    <SvgBase {...props}>
      <circle cx="12" cy="8" r="3" />
      <path d="M12 11v10" />
      <path d="M8 17h8" />
      <path d="M7 8a5 5 0 0 0 10 0" />
    </SvgBase>
  ),
  ascendant: (props) => (
    <SvgBase {...props}>
      <path d="M6 18l6-12 6 12" />
      <path d="M8 14h8" />
    </SvgBase>
  ),
  midheaven: (props) => (
    <SvgBase {...props}>
      <path d="M5 19L12 5l7 14" />
      <path d="M12 5v14" />
    </SvgBase>
  ),
  node: (props) => (
    <SvgBase {...props}>
      <path d="M6 16c0-3 3-6 6-6s6 3 6 6" />
      <circle cx="5" cy="16" r="2" />
      <circle cx="19" cy="16" r="2" />
    </SvgBase>
  ),
  
  // --- ASPECTS ---
  conjunction: (props) => (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8l4-4M8 16l-4 4" />
    </SvgBase>
  ),
  opposition: (props) => (
    <SvgBase {...props}>
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="12" r="3" />
      <path d="M9 12h6" />
    </SvgBase>
  ),
  trine: (props) => (
    <SvgBase {...props}>
      <path d="M12 5l7 12H5z" />
    </SvgBase>
  ),
  square: (props) => (
    <SvgBase {...props}>
      <path d="M6 6h12v12H6z" />
    </SvgBase>
  ),
  sextile: (props) => (
    <SvgBase {...props}>
      <path d="M12 4v16M5 8l14 8M5 16l14-8" />
    </SvgBase>
  ),
  quincunx: (props) => (
    <SvgBase {...props}>
      <path d="M12 18V6M7 20h10" />
    </SvgBase>
  ),
  semisquare: (props) => (
    <SvgBase {...props}>
      <path d="M12 4v8h8" />
    </SvgBase>
  )
};

export function AstroIcon({ name, ...props }: AstroIconProps) {
  const Icon = AstroIcons[name.toLowerCase()];
  if (!Icon) {
    // Fallback if icon not found
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
        <circle cx="12" cy="12" r="10" strokeDasharray="2 2" />
        <text x="12" y="16" fontSize="12" textAnchor="middle" fill="currentColor" stroke="none">?</text>
      </svg>
    );
  }
  return <Icon {...props} />;
}
