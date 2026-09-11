import React from 'react';

/**
 * High-precision Architectural & BIM Vector Iconography
 * Replaces generic AI-slop icons (stars/sparkles/emojis) with authentic CAD/BIM drafting marks.
 */

// 1. BIM Studio Brand Mark: Axonometric 3D structural massing cube with spatial coordinates
export function BimLogoIcon({ className = "w-5 h-5", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top Isometric Plane */}
      <path d="M12 2.5L20.5 7.4L12 12.3L3.5 7.4L12 2.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
      {/* Structural Column Verticals */}
      <path d="M3.5 7.4V16.6L12 21.5V12.3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.5 7.4V16.6L12 21.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.08" />
      {/* BIM Internal Floor Slab / Level Division */}
      <path d="M3.5 12L12 16.9L20.5 12" stroke="currentColor" strokeWidth={strokeWidth * 0.8} strokeDasharray="1.5 1.5" strokeLinecap="round" />
      {/* Central Structural Coordinate Vertex */}
      <circle cx="12" cy="12.3" r="1.3" fill="currentColor" />
    </svg>
  );
}

// 2. Viewport 3D / CAD Wireframe Camera (Section 1)
export function Viewport3DIcon({ className = "w-4 h-4", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 7.5L12 2.5L3 7.5V16.5L12 21.5L21 16.5V7.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 2.5V12M12 21.5V12M3 7.5L12 12M21 7.5L12 12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M7.5 5L16.5 10M7.5 19L16.5 14" stroke="currentColor" strokeWidth={strokeWidth * 0.7} strokeDasharray="1 1.5" />
    </svg>
  );
}

// 3. Technical Drafting Stylus / Mechanical Pen (Replaces emoji ✏️ for "Tự nhập")
export function DraftingStylusIcon({ className = "w-3 h-3", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.5 2.5L21.5 6.5L6.5 21.5H2.5V17.5L17.5 2.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {/* Precision Drafting Nib & Ruler Index */}
      <path d="M14.5 5.5L18.5 9.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M5.5 18.5L8.5 15.5" stroke="currentColor" strokeWidth={strokeWidth * 0.8} />
      <circle cx="4" cy="20" r="0.6" fill="currentColor" />
    </svg>
  );
}

// 4. CAD Geometric Constraint Lock (Replaces emoji 🛡️ and generic shields)
export function CadConstraintLockIcon({ className = "w-4 h-4", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Precision Caliper Jaw Outer Profile */}
      <path d="M5 4C5 2.89543 5.89543 2 7 2H17C18.1046 2 19 2.89543 19 4V9C19 14.5 14 19 12 21.5C10 19 5 14.5 5 9V4Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {/* Architectural Coordinate Crosshairs & Padlock Core */}
      <rect x="9" y="9.5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M10.5 9.5V7.5C10.5 6.67157 11.1716 6 12 6C12.8284 6 13.5 6.67157 13.5 7.5V9.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12 11.5V12.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

// 5. Wall Material Icon: Masonry Running Bond & Structural Core
export function WallMasonryIcon({ className = "w-3.5 h-3.5", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth={strokeWidth} />
      {/* Horizontal Mortar Courses */}
      <line x1="3" y1="9.5" x2="21" y2="9.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="3" y1="14.5" x2="21" y2="14.5" stroke="currentColor" strokeWidth={strokeWidth} />
      {/* Staggered Vertical Brick Joints */}
      <line x1="9" y1="4" x2="9" y2="9.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="15" y1="4" x2="15" y2="9.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="6" y1="9.5" x2="6" y2="14.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="12" y1="9.5" x2="12" y2="14.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="18" y1="9.5" x2="18" y2="14.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="9" y1="14.5" x2="9" y2="20" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="15" y1="14.5" x2="15" y2="20" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

// 6. Floor Material Icon: Parquet Herringbone / Tile Modular Grid
export function FloorParquetIcon({ className = "w-3.5 h-3.5", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth={strokeWidth} />
      {/* Modular Diamond / Diagonal Parquet Slats */}
      <path d="M12 4L3 13M21 5L12 14M21 13L13 20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M3 5L12 14M12 4L21 13M3 13L11 20" stroke="currentColor" strokeWidth={strokeWidth * 0.8} strokeDasharray="1.5 1.5" strokeLinecap="round" />
    </svg>
  );
}

// 7. Ceiling Material Icon: Suspended Soffit & Acoustic Wood Louver Slats
export function CeilingBaffleIcon({ className = "w-3.5 h-3.5", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3.5" width="18" height="4.5" rx="1" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity="0.12" />
      {/* Linear Suspended Baffle Slats */}
      <line x1="6" y1="8" x2="6" y2="18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="10" y1="8" x2="10" y2="20.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="14" y1="8" x2="14" y2="18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="18" y1="8" x2="18" y2="20.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Recessed Lighting Reveal Dot */}
      <circle cx="12" cy="5.75" r="1" fill="currentColor" />
    </svg>
  );
}

// 8. Door & Fenestration Icon: Architectural Plan Swing Arc & Glazed Frame
export function DoorFenestrationIcon({ className = "w-3.5 h-3.5", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      {/* Door Leaf & Glazing Panel Divider */}
      <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="6.5" y="5.5" width="3" height="13" rx="0.5" stroke="currentColor" strokeWidth={strokeWidth * 0.8} />
      <rect x="14.5" y="5.5" width="3" height="13" rx="0.5" stroke="currentColor" strokeWidth={strokeWidth * 0.8} />
      {/* Architectural Lever Handle */}
      <circle cx="10.5" cy="12.5" r="0.8" fill="currentColor" />
      <circle cx="13.5" cy="12.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

// 9. Trim & Detailing Icon: Architectural Cornice Profile & Shadow Reveal
export function TrimMoldingIcon({ className = "w-3.5 h-3.5", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stepped Cornice Profile Reveal */}
      <path d="M3 4H21M3 8.5H19M3 13H16M3 17.5H13M3 21H9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Metallic Fillet Detail Accent */}
      <line x1="21" y1="4" x2="21" y2="7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="19" y1="8.5" x2="19" y2="11.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="16" y1="13" x2="16" y2="16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

// 10. Exterior Facade Elevation Icon (Replaces generic Building2)
export function FacadeElevationIcon({ className = "w-4 h-4", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21V9L12 4L21 9V21H3Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {/* Stepped Eaves Overhang & Clerestory Windows */}
      <path d="M1 9.5L12 3.5L23 9.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="7" y="11" width="3.5" height="4" rx="0.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="13.5" y="11" width="3.5" height="4" rx="0.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M10 21V17H14V21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 11. Interior Spatial Section Icon (Replaces generic Armchair/Sofa)
export function InteriorSpatialIcon({ className = "w-4 h-4", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Room Enclosure Perspective Box */}
      <path d="M3 3H21V21H3V3Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3L8 7H16L21 3" stroke="currentColor" strokeWidth={strokeWidth * 0.9} />
      <path d="M8 7V17H16V7" stroke="currentColor" strokeWidth={strokeWidth * 0.9} />
      <path d="M3 21L8 17M21 21L16 17" stroke="currentColor" strokeWidth={strokeWidth * 0.9} />
      {/* Recessed Ambient Ceiling Beam */}
      <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth={strokeWidth * 0.7} strokeDasharray="1 1.5" />
    </svg>
  );
}

// 12. Sun & Physical Daylight Angle (Replaces generic sun)
export function DaylightVectorIcon({ className = "w-4 h-4", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth={strokeWidth} />
      {/* Directional Solar Path Angles */}
      <line x1="12" y1="2" x2="12" y2="4.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="12" y1="19.5" x2="12" y2="22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="2" y1="12" x2="4.5" y2="12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="19.5" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="4.9" y1="4.9" x2="6.7" y2="6.7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="17.3" y1="17.3" x2="19.1" y2="19.1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="4.9" y1="19.1" x2="6.7" y2="17.3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="17.3" y1="6.7" x2="19.1" y2="4.9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

// 13. Topographic Site Context Icon (Replaces generic globe/tree)
export function TopoSiteIcon({ className = "w-4 h-4", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 18L7.5 9L12.5 15L17.5 7L22 18H2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 18L10 12L13 16" stroke="currentColor" strokeWidth={strokeWidth * 0.8} />
      <line x1="2" y1="21" x2="22" y2="21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

// 14. Raytracing & Optical Rendering Aperture (Replaces generic Sparkles on Render CTA)
export function RaytracingCoreIcon({ className = "w-5 h-5", strokeWidth = 1.6 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Octagonal Optical Shutter Aperture */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M12 3L18.5 7.5L18.5 16.5L12 21L5.5 16.5L5.5 7.5L12 3Z" stroke="currentColor" strokeWidth={strokeWidth * 0.7} strokeDasharray="1.5 1.5" />
      {/* Converging Raytracing Photon Beam Vector */}
      <path d="M12 7L16 12L12 17L8 12L12 7Z" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity="0.2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
