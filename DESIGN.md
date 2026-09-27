---
name: PUA ICPC
colors:
  primary: "#7B2CBF"
  background: "#FFF4E0"
  surface: "#FFD500"
  text: "#0F0F0F"
  accent-cyan: "#00E5FF"
  accent-pink: "#FF0055"
  muted: "#E0E0E0"
  border: "#0F0F0F"
typography:
  display:
    fontFamily: "Fredoka One, sans-serif"
    fontWeight: "900"
    letterSpacing: "-0.04em"
    textTransform: uppercase
  body:
    fontFamily: "Space Mono, monospace"
    fontWeight: "400"
  label:
    fontFamily: "Space Grotesk, sans-serif"
    fontWeight: "700"
    textTransform: uppercase
rounded:
  DEFAULT: 0px
spacing:
  border-width: 3px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
elevation:
  sm: 4px 4px 0px 0px #0F0F0F
  md: 8px 8px 0px 0px #0F0F0F
  lg: 12px 12px 0px 0px #0F0F0F
  xl: 16px 16px 0px 0px #0F0F0F
  offset-hover: 16px 16px 0px 0px #0F0F0F
components:
  card:
    backgroundColor: "{colors.surface}"
    border: "{spacing.border-width} solid {colors.border}"
    boxShadow: "{elevation.md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    border: "{spacing.border-width} solid {colors.border}"
    boxShadow: "{elevation.sm}"
  button-active:
    transform: "translate(8px, 8px)"
    boxShadow: "0px 0px 0px 0px #0F0F0F"
---

## Brand & Style
The design system embraces a high-contrast **Neo-Brutalist** aesthetic meant to reflect the raw, "no soft code allowed" culture of the ICPC PUA technical corps. It prioritizes bold structural lines, high-impact typography, and saturated brand colors that demand attention.

The visual language is chaotic yet controlled, mirroring the intensity of algorithmic competitive programming. Shadows are harsh and solid, eschewing soft blur effects for strict geometric drops. UI borders are thick and unyielding, signaling a system without ambiguity.

## Colors
The color palette relies on a stark canvas interrupted by aggressive primary and accent colors that provide energy and hierarchy.

- **Background:** `Peach Cream (#FFF4E0)` provides a slightly warmer foundation than stark white, allowing the intense colors to stand out.
- **Primary:** `Deep Purple (#7B2CBF)` anchors primary interactions and actions.
- **Interaction/Accent:** `Cyber Cyan (#00E5FF)` and `Neon Pink (#FF0055)` highlight active states or urgent statuses.
- **Surfaces:** `Warning Yellow (#FFD500)` surfaces denote critical content or high-level components with heavy urgency.
- **Structure:** `Onyx (#0F0F0F)` is used relentlessly for all boundaries, text, and shadows to maintain the brutalist grounding.

## Typography
The system employs clashing but intentional typography to enforce hierarchy and identity.

- **Headlines:** Uses **Fredoka One**, heavily weighted and uppercase, to yell at the user. Tracking is extremely tight (`tracking-tighter` or `-0.04em`) to forge block-like visual masses.
- **Body & Data:** **Space Mono** echoes the terminal and command-line roots of programming, supplying a stark monospaced contrast ensuring precise legibility.
- **Sub-headers & Labels:** **Space Grotesk** serves as the bridge between the headline and body, used heavily in italicized uppercase for metadata labels.

## Layout & Spacing
The layout ignores traditional delicate whitespace padding in favor of block-based rigid architectures.

- **Grids:** Interfaces heavily utilize structural grids with pronounced borders, enforcing hard separation of concerns.
- **Background Texture:** A subtle dot-matrix background (`radial-gradient` pattern) grounds the page, reminding users of raw systemic structures underneath.
- **Vector Nodes:** Uniquely, the system incorporates absolute-positioned decorative `[ ]` bounding boxes ("vector nodes", white squares with black borders) sitting atop structural corners, pushing a blueprint/architectural feel.

## Elevation & Depth
Depth is mechanical and analog rather than simulated light.

- **Shadows:** Cast shadows have exactly `0px` blur radius (`4px`, `8px`, `12px`, or `16px` solid `#0F0F0F` offset drops).
- **Interactions (Push-down):** Hover or active states translate components physically down and right while compressing the shadow to `0px`, perfectly simulating a heavy mechanical switch being pushed into the screen.

## Shapes
Curves do not belong here.

- **Containers:** All components maintain a rigid `0px` border radius (`rounded-none`).
- **Boundaries:** All clickable or structural layers demand a mandatory `3px` solid `#0F0F0F` border line to assert their position on the canvas.
