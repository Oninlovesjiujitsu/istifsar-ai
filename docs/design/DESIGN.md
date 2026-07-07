# Design System Specification: The Illuminated Archivist

## 1. Overview & Creative North Star

### The Creative North Star: "The Digital Curator"
This design system is built to evoke the feeling of a private, midnight viewing of a prestigious historical collection. We are moving away from the "SaaS dashboard" aesthetic and toward a **High-End Editorial** experience. The visual language balances the weight of history with the precision of modern technology.

To break the "template" look, designers must embrace **Intentional Asymmetry**. Do not rely on standard centered grids; instead, use overlapping elements (e.g., a serif headline bleeding over the edge of a card) and dramatic shifts in typographic scale to create a sense of curated discovery. The goal is "Chiaroscuro" in UI—using high-contrast light (Antique Gold) against a deep, layered void.

---

## 2. Colors & Surface Logic

The palette is rooted in deep obsidian tones, punctuated by the prestige of Antique Gold.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders to define sections or separate content. Boundaries must be defined through:
1.  **Tonal Shifts:** Placing a `surface_container_low` section against a `surface` background.
2.  **Negative Space:** Using the Spacing Scale (specifically `8` to `16`) to create mental separation.
3.  **Shadows:** Using the signature diffused gold glow to imply an edge without a line.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials.
*   **Base:** `surface` (#131313) for the primary background.
*   **Lowest Layer:** `surface_container_lowest` (#0e0e0e) for recessed areas like search bars or footer pits.
*   **Interactive Layers:** `surface_container` (#201f1f) for cards.
*   **Elevated Layers:** `surface_container_highest` (#353534) for floating menus or modals.

### The "Glass & Gradient" Rule
For "Artifact" previews or Hero sections, use a subtle radial gradient transitioning from `primary` (#f2ca50) at 10% opacity to `surface` at 0%. For floating panels, apply a `backdrop-blur` with a semi-transparent `surface_variant` to create a "frosted obsidian" effect.

---

## 3. Typography

The typographic system creates an "Authority/Utility" dichotomy.

*   **The Authority (Playfair Display / Noto Serif):** Used for `display` and `headline` levels. This font represents the historical archive. Use `display-lg` (3.5rem) with tight letter-spacing for a dramatic, editorial impact.
*   **The Utility (Inter):** Used for `title`, `body`, and `label` levels. This provides the modern, archival toolset feel. Use `body-md` (#A1A1AA) for general reading to reduce eye strain in dark mode.

**Styling Tip:** For `label-md`, always use uppercase with 0.05rem letter-spacing to give the interface a "catalogued" feel.

---

## 4. Elevation & Depth

We eschew traditional "drop shadows" in favor of **Tonal Layering** and **Luminescent Depth**.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface_container_low` card placed on a `surface` background creates a natural lift.
*   **Signature Glow:** For active states (focused inputs, hovered cards), use the signature effect: `shadow-[0_0_15px_rgba(212,175,55,0.3)]`. This mimics the reflection of light off gold leaf.
*   **The "Ghost Border" Fallback:** If a container requires a border for accessibility, use the `outline_variant` token at **15% opacity**. Never use 100% opacity lines.
*   **Ambient Shadows:** For high-elevation modals, use a large blur (40px+) with the `on_surface` color at 4% opacity to mimic natural light dispersion.

---

## 5. Components

### Buttons
*   **Primary:** Background `primary_container` (#D4AF37), text `on_primary`. Shape: `rounded-sm` (0.125rem) to maintain a sharp, architectural feel.
*   **Tertiary (Editorial):** Text-only, using `primary` (#f2ca50) with an `on-hover` underline that is 2px thick.

### Cards (The "Archive Plate")
*   **Construction:** Use `surface_container` (#201f1f) with a `rounded-sm` corner.
*   **Separation:** Forbid dividers. Use `spacing-6` (2rem) of vertical white space between content blocks within the card.

### Input Fields
*   **Base:** `surface_container_lowest`.
*   **Active State:** Apply the Signature Gold Glow and change the `outline` to `primary` at 40% opacity.
*   **Typography:** Labels must be `label-md` in `on_surface_variant`.

### Selection Chips
*   **Style:** No background. Use a `ghost-border` (outline-variant at 20%) and `rounded-full`. When selected, fill with `secondary_container` and change text to `primary`.

### Navigation (The "Curator's Rail")
*   Instead of a horizontal top bar, prioritize a slim vertical rail on the left using `surface_container_low`. Use `headline-sm` for the section titles, rotated 90 degrees for a signature editorial look.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use extreme typographic contrast. A `display-lg` headline next to a `label-sm` creates premium tension.
*   **Do** use asymmetrical margins. Offsetting a text block by `spacing-12` from the right creates a "manuscript" feel.
*   **Do** allow the `background` (#131313) to breathe. High-end archives are not cluttered.

### Don't:
*   **Don't** use pure white (#FFFFFF). Only use `on_surface` (#e5e2e1) or `primary`.
*   **Don't** use standard `rounded-lg` (0.5rem) for main containers. Keep it to `sm` or `none` to maintain a "heavy stone/paper" feel.
*   **Don't** ever use a 1px solid divider line. If you feel the need for a line, use a 40px gap instead.
*   **Don't** use bright, saturated colors outside of the Gold spectrum. Success/Error states should be muted (use the `error_container` token).

---

## 7. Spacing & Grid

The system utilizes a non-linear spacing scale to encourage "breathing room."

*   **Micro-spacing (1-3):** For internal component padding.
*   **Layout-spacing (8-24):** For section gaps.
*   **The "Golden Gap":** Use `spacing-16` (5.5rem) as the default margin between major editorial sections to enforce the premium, spacious feel.