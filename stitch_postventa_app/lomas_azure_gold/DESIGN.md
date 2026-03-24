# Design System Document: Lomas del Mar Postventa

## 1. Overview & Creative North Star
### The Creative North Star: "The Coastal Nocturne"
This design system rejects the "flatness" of standard mobile interfaces in favor of a deep, atmospheric experience. Inspired by the premium coastal lifestyle of Lomas del Mar, the aesthetic mimics the interplay of moonlight on dark water and sand. We prioritize high-end editorial layouts, using intentional asymmetry, generous white space (breathing room), and layered glass textures to convey a sense of architectural luxury and exclusivity.

## 2. Colors & Atmospheric Depth
Our palette is rooted in a 95% black foundation, punctuated by sophisticated teals and sun-bleached golds.

### Primary Palette
- **Primary (`#a8cdd4`):** Use for soft highlights and active states.
- **Primary Container (`#36595f`):** The signature Deep Teal. Use this for major structural components and brand-heavy backgrounds.
- **Secondary (`#edc062`):** The Gold/Sand accent. Reserved for high-priority CTAs and achievement indicators.
- **Background (`#131313`):** The 95% Black canvas.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. Structural definition must be achieved through:
1.  **Background Shifts:** Placing a `surface-container-low` section against a `surface` background.
2.  **Tonal Transitions:** Using the gradient between `primary` and `primary_container` to define edges.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials.
- **Surface (Base):** The deepest layer.
- **Surface-Container-Low:** For secondary content blocks.
- **Surface-Container-High:** For interactive cards and primary modules.
- **Surface-Container-Highest:** For floating elements or top-level alerts.

### The "Glass & Gradient" Rule
To achieve a signature premium feel, use **Glassmorphism** for floating headers and bottom navigation bars. 
- **Recipe:** 40-60% opacity of the `surface-container` color + `backdrop-blur: 20px`.
- **Signature Texture:** Apply a subtle linear gradient (from `primary_container` to `surface_container_lowest`) to large cards to provide a "living" depth that flat hex codes lack.

## 3. Typography
We utilize a pairing of **Outfit** (Geometric Modernity) for displays and **Inter** (Pragmatic Clarity) for functional text.

- **Display Scale (Outfit):** Use `display-lg` (3.5rem) with `-2%` letter spacing for hero headlines. This conveys an editorial, magazine-like authority.
- **Headline Scale (Outfit):** `headline-md` (1.75rem) should be used for section headers, often placed with asymmetrical padding to break the grid.
- **Body & Labels (Inter):** `body-lg` (1rem) is the workhorse. High legibility against dark backgrounds is maintained by using `on_surface_variant` (`#c1c8c9`) for secondary text to reduce eye strain.

## 4. Elevation & Depth
Depth in this system is a result of light physics, not drop-shadow presets.

### The Layering Principle
Stacking tiers is the primary method of elevation. A `surface-container-highest` card sitting on a `surface-container-low` section creates a natural lift.

### Ambient Shadows
When a component must float (e.g., a "New Request" FAB), use an extra-diffused shadow:
- **Blur:** 32px to 48px.
- **Opacity:** 6% of the `on_surface` color.
- **Tint:** The shadow should be tinted with a hint of `primary_container` to maintain the "Coastal Nocturne" atmosphere.

### The "Ghost Border"
If a container requires a border for accessibility, use a **Ghost Border**: `outline_variant` at 15% opacity. Never use 100% opaque lines.

## 5. Components

### Logo & Brand Assets
- **Dark Mode Inversion:** The leaf logo (originally green/teal) must be rendered in a monochromatic `secondary_fixed` (Gold) or a simplified `white` gradient for high contrast against the `#131313` background.

### Buttons
- **Primary:** `secondary` (Gold) background with `on_secondary` (Dark Brown/Black) text. 3xl rounded corners.
- **Secondary (Glass):** `surface_variant` at 20% opacity with a `backdrop-blur`. `on_surface` text.
- **Interaction:** On press, the button should scale down to 96% rather than just changing color.

### Cards & Lists
- **Rule:** Forbid divider lines. Use `1.5rem` (`6`) or `2rem` (`8`) of vertical spacing from the scale to separate list items.
- **Style:** Cards must use `2xl` or `3xl` rounded corners. Top-level dashboard cards should feature a subtle `primary_container` gradient to draw the eye.

### Input Fields
- **Container:** `surface_container_high`. 
- **Active State:** The "Ghost Border" becomes 40% opaque Gold (`secondary`). Helper text appears in `on_surface_variant`.

### Selection (Chips & Radios)
- **Chips:** Soft Teal (`primary_container`) backgrounds with `2xl` rounding. Selected chips glow with a 4% `primary` outer glow.

## 6. Do's and Don'ts

### Do
- **Embrace Asymmetry:** Align headlines to the left while keeping secondary data points tucked to the right or slightly offset.
- **Prioritize Negative Space:** If a screen feels cluttered, increase the spacing from `4` to `8`.
- **Use Real Imagery:** Overlap text elements on high-quality, darkened architectural photography with `backdrop-blur` overlays.

### Don't
- **Don't use pure White text:** Use `on_surface` (`#e5e2e1`) to prevent "halation" (the glowing effect of white text on black backgrounds).
- **Don't use hard borders:** Avoid 1px solid lines at all costs.
- **Don't crowd the edges:** Maintain a minimum of `1.5rem` (6) padding from the mobile screen edges to ensure a premium, spacious feel.