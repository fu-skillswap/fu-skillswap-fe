---
name: Efficient Oversight
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  status-pending: '#EAB308'
  status-approved: '#22C55E'
  status-rejected: '#EF4444'
  status-revision: '#F97316'
  surface-background: '#F8FAFC'
  surface-border: '#E2E8F0'
  text-main: '#0F172A'
  text-muted: '#475569'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 260px
  gutter: 1.5rem
  container-padding: 2rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
---

## Brand & Style

This design system is built for the **SkillSwap Admin Panel**, a high-utility environment where speed, clarity, and decision-making are paramount. The brand personality is **authoritative, procedural, and clinical**. It avoids decorative elements in favor of a "Workhorse" aesthetic—minimalist but highly structured.

The design style is **Corporate / Modern**, leaning into a **SaaS-refined Minimalism**. It utilizes a systematic approach to density, allowing admins to scan large datasets (mentor queues, verification logs) without cognitive overload. The emotional response should be one of "controlled efficiency"—the user feels empowered by a tool that stays out of the way while providing clear semantic signals.

## Colors

The palette is anchored by a **Professional Blue**, extracted from the core brand identity, serving as the primary action color. To support an administrative context, we employ a high-contrast **Slate/Gray scale** for structural elements like borders and secondary text.

The semantic system is critical for this design system:
- **Primary (#2563EB):** Used for primary actions, sidebar active states, and focus indicators.
- **Status Yellow (#EAB308):** Specific to `PENDING` states; high visibility but non-critical.
- **Status Green (#22C55E):** Reserved for `APPROVED` or success confirmations.
- **Status Red (#EF4444):** Reserved for `REJECTED` or critical errors.
- **Status Orange (#F97316):** Used for `NEEDS_REVISION`, signaling a middle-ground state requiring action.

Neutral tones prioritize legibility, using Slate-900 for headings and Slate-50 for subtle background contrasts.

## Typography

The system utilizes **Inter** exclusively for its exceptional legibility in data-dense interfaces. The hierarchy is tight, with small increments between levels to maintain information density.

- **Headlines:** Use tighter letter-spacing and heavier weights to anchor pages.
- **Body Text:** Optimized for long-form bios and notes; `body-md` is the workhorse for table data.
- **Labels:** Used for table headers and status chips, featuring an uppercase treatment to distinguish them from interactive content.
- **Numeric Data:** In tables, ensure the use of tabular num alignment to allow for vertical scanning of IDs and dates.

## Layout & Spacing

This design system uses a **Fixed-Fluid Hybrid** layout. A fixed-width sidebar (260px) persists on the left, while the main content area utilizes a fluid grid to maximize the visibility of wide data tables.

- **Grid:** A 12-column system is used within the main content area for dashboard widgets, while tables typically span the full 12 columns.
- **Breakpoints:**
  - **Desktop (1280px+):** Full sidebar, 32px page margins.
  - **Tablet (768px - 1279px):** Collapsed icon-only sidebar, 24px page margins.
  - **Mobile (<767px):** Bottom navigation or hamburger menu; tables convert to card-based list views.
- **Density:** We employ a "Compact" spacing model for tables (12px vertical cell padding) and a "Relaxed" model for review forms (24px vertical stack) to ensure focus during critical decision-making.

## Elevation & Depth

To maintain a "clean" and "functional" feel, depth is conveyed through **Tonal Layers** rather than heavy shadows.

- **Level 0 (Background):** Slate-50 (#F8FAFC). Used for the main application canvas.
- **Level 1 (Cards/Tables):** Pure White (#FFFFFF) with a 1px Slate-200 border. No shadow.
- **Level 2 (Modals/Dropdowns):** Pure White (#FFFFFF) with a soft, diffused ambient shadow (0px 4px 12px rgba(0,0,0,0.05)) to separate temporary overlays from the workspace.
- **Interactive States:** Hovering over a table row or a sidebar item triggers a background color shift to Slate-100 rather than an elevation change, maintaining the flat, efficient aesthetic.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a professional, modern look that is more approachable than sharp corners but avoids the playfulness of fully rounded "pill" shapes.

- **Small Components:** Checkboxes and small buttons use the base `0.25rem`.
- **Large Components:** Cards and Input groups use `rounded-lg (0.5rem)` to create a clear container boundary.
- **Status Badges:** Use a slightly higher `rounded-xl (0.75rem)` to distinguish them as non-interactive status indicators compared to rectangular action buttons.

## Components

### Sidebar Navigation
- **Active State:** Primary Blue background for the icon, font weight 600.
- **Interaction:** Smooth transition on background-color hover (Slate-100).

### Data Tables
- **Header:** Slate-50 background, `label-md` typography, Slate-200 bottom border.
- **Rows:** Alternating "Zebra" striping is avoided; use 1px borders instead to maintain a clean look.
- **Hover State:** Entire row highlights in Slate-50 to assist eye-tracking.

### Status Badges
- **Style:** Subtle tinted background (10% opacity of status color) with high-contrast text (100% opacity of status color).
- **Icons:** Pair with a 12px dot icon or status-specific glyph (e.g., Check for Approved, X for Rejected).

### Filter Bars
- **Design:** Horizontal bar above tables. Elements are grouped using a subtle Slate-200 vertical divider.
- **Inputs:** Clean, white background with a 1px border. Focus state uses a 2px Primary Blue ring.

### Sidebar Lock Indicator
- **Visual:** A small "Lock" icon next to a mentor's name in the queue when another admin is reviewing. The row should be semi-transparent (50% opacity) to indicate it is "occupied."

### Buttons
- **Primary:** Solid Primary Blue, white text.
- **Secondary:** White background, Slate-200 border, Slate-900 text.
- **Destructive:** Solid Status Red for final "Reject" actions.