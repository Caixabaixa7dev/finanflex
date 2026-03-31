# Design System Strategy: High-End Editorial Finance

## 1. Overview & Creative North Star
**The Creative North Star: "The Architectural Ledger"**
This design system rejects the cluttered, anxiety-inducing interface of traditional banking. Instead, it adopts the persona of a "High-End Editorial Ledger"—where the luxury of space conveys the security of the institution. We move beyond generic templates by utilizing **intentional asymmetry** and **tonal depth**.

To achieve a signature look, we avoid the "boxed-in" feel. Elements should feel like they are floating on layers of fine parchment. We break the rigid grid by allowing high-impact typography to overlap container boundaries and using generous vertical breathing room (utilizing the `24` spacing token) to signal premium positioning.

---

## 2. Colors & Surface Logic
The palette is rooted in a sophisticated Navy (`#1E3A8A`) and a vibrant Pix Green (`#10B981`). However, the "soul" of the system lies in how we treat the Off-White (`#F8F9FA`) surfaces.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. 
*   **How to separate content:** Transition from `surface` (#F8F9FA) to `surface-container-low` (#F3F4F5). 
*   **The Result:** A seamless, sophisticated flow where the eye perceives structure through tonal shifts rather than artificial "fences."

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials.
*   **Base Layer:** `surface` (#F8F9FA) - The canvas.
*   **Section Layer:** `surface-container-low` (#F3F4F5) - Used for content groupings like "Our Services."
*   **Interactive Layer:** `surface-container-lowest` (#FFFFFF) - Used for elevated cards to create a "pop" against the off-white background.

### The "Glass & Gradient" Rule
To prevent the UI from feeling "flat," use subtle radial gradients on Primary containers:
*   **CTA Backgrounds:** A transition from `primary` (#00236F) to `primary_container` (#1E3A8A) at a 45-degree angle.
*   **Glassmorphism:** For floating navigation bars, use `surface` at 80% opacity with a `20px` backdrop-blur. This allows the high-contrast typography to remain legible while the background "bleeds" through, creating an integrated, modern feel.

---

## 3. Typography: The Editorial Voice
We use **Manrope** as our foundational typeface. It is modern, geometric, and highly legible, bridging the gap between "Tech" and "Institution."

*   **Display-LG (3.5rem):** Reserved for Hero headlines. Use "Tight" letter spacing (-0.02em) to create a bold, authoritative impact.
*   **Headline-MD (1.75rem):** Used for section titles. Pair these with asymmetrical alignments (e.g., left-aligned headline with right-aligned body text) to break the standard template look.
*   **Body-LG (1rem):** Our workhorse. Ensure a generous line-height (1.6) to maintain the "clean" aesthetic inspired by editorial magazines.
*   **Label-MD (0.75rem):** All-caps with increased letter spacing (+0.05em) for category tags or small eyebrow text above headlines.

---

## 4. Elevation & Depth
In this design system, depth is earned through **Tonal Layering**, not shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` (#FFFFFF) card on a `surface-container-low` (#F3F4F5) section. The difference is subtle but creates a "natural lift" that feels architectural.
*   **Ambient Shadows:** If an element must float (like a modal or primary CTA button), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(25, 28, 29, 0.04)`. Note the 4% opacity; it should be felt, not seen.
*   **The "Ghost Border" Fallback:** If accessibility requires a container definition, use the `outline_variant` (#C5C5D3) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons
*   **Primary Action:** Background `secondary` (#006C49), `on-secondary` (#FFFFFF) text. Use `rounded-full` (9999px) for a modern, friendly touch.
*   **Secondary:** `surface-container-highest` background with `primary` text. No border.
*   **Interactive State:** On hover, shift the background color by one tier (e.g., from `secondary` to `on_secondary_fixed_variant`).

### Cards & Financial Clusters
*   **The "No-Divider" Rule:** Forbid the use of line dividers within cards. Use the `spacing-6` (2rem) scale to separate "Interest Rates" from "Account Details."
*   **Visual Soul:** Incorporate a subtle `surface-tint` (#4059AA) at 5% opacity as a background wash for secondary cards to give them a distinct financial "glow."

### Input Fields
*   **Surface:** Use `surface-container-high` (#E7E8E9). 
*   **Focus State:** Transition the background to `surface-container-lowest` (#FFFFFF) and apply a `2px` ghost border using `primary` at 20% opacity.

### Signature Component: The "Growth Glass"
A specialized card for financial data visualization. It uses a semi-transparent `surface_container_lowest` with a `backdrop-blur(12px)` and a `primary` color glow behind it to represent "Profit" or "Success" metrics.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins. If the left margin is `spacing-12`, try a `spacing-24` right margin for hero elements.
*   **Do** allow "Display" typography to bleed slightly outside its container to create a custom, high-end feel.
*   **Do** use `secondary_container` (#6CF8BB) for success states and accent icons—it provides a fresh contrast to the Navy Primary.

### Don't:
*   **Don't** use 1px black or grey borders. They cheapen the brand and create visual noise.
*   **Don't** use standard drop shadows (e.g., #000000 at 25%). They destroy the "Architectural Ledger" aesthetic.
*   **Don't** crowd the interface. If you think there is enough white space, add 20% more. Premium design is defined by what you omit.