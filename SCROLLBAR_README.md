# Persona 5 Custom Scrollbar

## Implementation Summary

Added custom scrollbar styling to `src/styles/tokens.css` with the following features:

### Webkit (Chrome, Edge, Safari)
- **Track**: Dark (`var(--color-bg-hero)` / `#0a0a0a`), thin (8px), no border radius
- **Thumb**: Red (`var(--color-accent)` / `#e60012`), 2px white border (`var(--color-paper)`), diagonal clip-path cut
- **Hover**: Thumb widens to 12px, brighter red (`color-mix` with white 40%), added box-shadow glow
- **Corner**: Transparent

### Firefox
- `scrollbar-width: thin`
- `scrollbar-color: var(--color-accent) var(--color-bg-hero)`

### Layout Prevention
- `scrollbar-gutter: stable bothendss` — prevents layout jumps when scrollbar appears/disappears

### Key CSS Properties
| Property | Value | Purpose |
|---|---|---|
| `::-webkit-scrollbar` | `width: 8px; height: 8px;` | Track thumb size |
| `::-webkit-scrollbar-track` | `background: var(--color-bg-hero); border-radius: 0;` | Dark background |
| `::-webkit-scrollbar-thumb` | Red accent, 2px white border, `clip-path: polygon(0 0, 100% 0, 100% 100%, 20% 100%)` | Red thumb with diagonal cut |
| `::-webkit-scrollbar-thumb:hover` | `width: 12px`, brighter red, `box-shadow: 0 0 6px rgba(230, 0, 18, 0.4)` | Hover state — thicker & brighter |
| `scrollbar-width` | `thin` | Firefox support |
| `scrollbar-color` | `var(--color-accent) var(--color-bg-hero)` | Firefox colors |
| `scrollbar-gutter` | `stable bothendss` | No layout jumps |

### Design Tokens Used
- `--color-accent: #e60012` (Persona 5 signature red)
- `--color-bg-hero: #0a0a0a` (dark background)
- `--color-paper: #f5f5f0` (white border)

### File Modified
- `src/styles/tokens.css` — scrollbar styles added at line 1016 (after utilities, before base layer)

### No New Libraries
- Pure CSS implementation using native `::-webkit-scrollbar`, `scrollbar-width`, and `scrollbar-color`
- Respects existing design system tokens and color palette