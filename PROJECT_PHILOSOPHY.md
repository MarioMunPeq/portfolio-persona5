# Project Philosophy — Mario's Portfolio ("CV Viviente")

> This document is written for AI agents working on this codebase (OpenCode, Claude, or any future session). It is not meant to be read by the project owner. Consult it whenever a design, content, or implementation decision isn't explicitly covered elsewhere — it encodes the reasoning behind the original megaprompt, not just its rules.

## Core identity

This is a personal portfolio / living CV, visually inspired by Persona 5's UI language — reinterpreted, never cloned. No literal Persona 5 assets, proprietary fonts, exact layouts, or character art. The reference is art direction, not a template. If a decision would make the site look like a Persona 5 skin rather than an original site with a Persona 5 sensibility, choose the more original path.

**Guiding principle: impact on entry, clarity in content.** Every decision should be checked against this. The hero can be maximalist. Everything past it should get progressively calmer and more legible. If you're ever unsure whether something belongs in the "loud" register or the "clean" register, default to clean — a recruiter must be able to read the CV content without friction.

## Decision heuristics

When a choice isn't explicitly specified, use these in order:

1. **Does it help the content get read, or does it get in the way?** Motion, cursor effects, and transitions all exist to support legibility and pacing, not to prove technical capability. If an effect makes text harder to read or a link harder to click, cut it.
2. **Is it restrained?** This project deliberately avoids "animate everything because it's Awwwards-tier." Block-style entrances, not letter-by-letter. Clean surfaces, no grain/texture. A handful of well-placed signature moments (the hero, the menu-transition, the custom cursor) beat many small effects everywhere.
3. **Does it scale?** Content (projects, experience, education) is data-driven. Never hardcode assuming exactly 3 projects or a fixed timeline length. A new project or job entry should require a data change, not a layout change.
4. **Is it invented?** Never fabricate copy, achievements, tech stack details, or project descriptions. If real content is missing, stop and ask rather than filling the gap with generic text. This applies to every section, especially About, Experience, and Education.
5. **Does it stay accessible despite the intensity?** WCAG AA contrast, full keyboard navigation, `prefers-reduced-motion` fallbacks, and alt text are non-negotiable regardless of how experimental the visual language gets. A visually striking site that fails accessibility basics is a failed site, not a stylistic trade-off.

## Tone of voice (copy)

Spanish, professional but with real personality — confident, a little creative, never corporate-generic ("passionate about innovative and scalable solutions" is explicitly banned language). Personal interests (gaming, D&D, Cosmere) can surface lightly where they explain personality, never as the main content.

## What "done" looks like for any given piece of work

- It compiles/builds without errors, TypeScript is clean, lint passes.
- It matches the token system (colors, typography, zero border-radius) rather than introducing one-off styling.
- It works with keyboard only and with reduced motion enabled.
- It doesn't regress the "impact → clarity" pacing — check where in that gradient the section/component sits and design accordingly.
- If it's new project content, it lives in `data/`, not hardcoded in a component.

## Known constraints (context, not rules to re-derive)

- Independent repo, no shared code with the Cosmere Archive or Dungeon Archive (D&D Companion) projects unless there's a clear technical reason.
- Desktop-first, but mobile must remain a deliberate, functional composition — not a broken fallback.
- Deployed on GitHub Pages via GitHub Actions at `mariomunpeq.is-a.dev`, with Vite's base set to `/`. Keep the `CNAME`, canonical URLs, sitemap, and prerendered route metadata in sync if the domain or route structure changes.
- Route-specific SEO and social metadata are generated during the production build and updated during client navigation. Keep the metadata source, sitemap, and route handling aligned when adding or removing pages.

## When genuinely stuck

Prefer asking a clarifying question over guessing on: missing real content (bio text, job descriptions, project descriptions), ambiguous visual decisions with no clear anchor in the megaprompt or this document, or anything that would require inventing information about Mario.
