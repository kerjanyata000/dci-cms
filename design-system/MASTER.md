# DCI CMS — Design System (Master)

Generated with [UI UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), **overridden** by [`DESIGN_GUIDELINES.md`](../DESIGN_GUIDELINES.md) and [`CMS_Mockup.html`](../CMS_Mockup.html).

## Pattern (from skill: Trust & Authority + Executive Dashboard)

- **Product:** Legal / enterprise contract registry (B2B, party-centric)
- **Conversion:** Monitoring & pending actions — **no create CTA on dashboard**
- **Sections:** Role dashboard → Parties list → Party Detail (tabs) → modals

## Style

- **Name:** Sealed Registry (project override — not generic SaaS)
- **Keywords:** Legal dossier, ink/brass, status pills, audit trail, trustworthy
- **Avoid:** Purple/pink AI gradients, playful UI, landing-page hero, Tailwind/shadcn migration without decision

## Colors (project tokens — do NOT replace with skill defaults)

| Role | Token | Hex |
|------|-------|-----|
| Primary | `--ink` | `#12203A` |
| Accent | `--brass` | `#A8783C` |
| Background | `--paper` | `#EEF1F4` |
| Surface | `--paper-2` | `#FFFFFF` |
| Success | `--green` | `#2E7D5B` |
| Warning | `--amber` | `#C08A2E` |
| Danger | `--red` | `#B84A3A` |

## Typography (project — keep)

- **Heading:** Source Serif 4 (`--serif`)
- **UI:** IBM Plex Sans (`--sans`)
- **IDs / codes:** IBM Plex Mono (`--mono`)

## Stack

- **Framework:** Next.js App Router (`web/`)
- **Styling:** `web/src/components/shell.css` — **no Tailwind**
- **Icons:** Inline SVG or minimal — no emoji as icons

## UX checklist (UI UX Pro Max pre-delivery)

- [x] `cursor-pointer` on clickable rows, tabs, pagination
- [x] Hover/focus transitions 150–200ms
- [x] `:focus-visible` ring on buttons, tabs, nav
- [x] `prefers-reduced-motion` respected
- [x] Table pagination on long lists (Parties, Renewal, Activity, SO, Audit)
- [ ] Responsive 375 / 768 / 1024 (shell drawer exists)

## Install skill (per developer)

```bash
npm install -g ui-ux-pro-max-cli
cd dci-cms
uipro init --ai cursor
python .cursor/skills/ui-ux-pro-max/scripts/search.py "legal enterprise dashboard" --design-system -p "DCI CMS"
```

Always re-apply **MASTER overrides** above after skill suggestions.
