# DCI CMS — Design System (Master)

**Base process:** [UI UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)  
**Project overrides (wajib):** [`DESIGN_GUIDELINES.md`](../DESIGN_GUIDELINES.md) §0 + [`CMS_Mockup.html`](../CMS_Mockup.html)

> Skill memberi rekomendasi pola/UX/checklist. **Token, font, dan stack DCI selalu menang** atas default skill.

## Hierarki baca

1. `DESIGN_GUIDELINES.md` — prinsip & token
2. **`MASTER.md`** (file ini) — ringkasan global
3. `design-system/pages/<page>.md` — override per halaman
4. `CMS_Mockup.html` — interaksi
5. `web/src/components/shell.css` — implementasi

## Pattern (Trust & Authority + Executive Dashboard)

- **Product:** Legal / enterprise contract registry (B2B, party-centric)
- **Conversion:** Monitoring & pending actions — **no create CTA on dashboard**
- **Sections:** Role dashboard → Parties list → Party Detail (tabs) → modals

## Style — DCI Brand Registry

- **Keywords:** DCI Indonesia, primary blue, party-centric, status pills, audit trail
- **Avoid:** Purple/pink AI gradients, playful UI, brass/gold legacy, Tailwind/shadcn tanpa keputusan

## Colors (do NOT replace with skill defaults)

| Role | Token | Hex |
|------|-------|-----|
| Primary | `--brand-primary` | `#00A4DF` |
| Secondary | `--brand-secondary` | `#267DBF` |
| Accent | `--brand-accent` / `--ink` | `#312C2D` |
| Background | `--paper` | `#EEF3F6` |
| Surface | `--paper-2` | `#FFFFFF` |
| Success | `--green` | `#2E7D5B` |
| Warning | `--amber` | `#C08A2E` |
| Danger | `--red` | `#B84A3A` |

**Logo assets:** `web/public/brand/` — lihat [`brand/README.md`](../brand/README.md)

## Typography (keep)

- **Heading:** Source Serif 4 (`--serif`)
- **UI:** IBM Plex Sans (`--sans`)
- **IDs / codes:** IBM Plex Mono (`--mono`)

## Stack

- **Framework:** Next.js App Router (`web/`)
- **Styling:** `web/src/components/shell.css` — **no Tailwind**
- **Icons:** Inline SVG — no emoji as UI icons

## Page overrides

| Page | File |
|------|------|
| Login | [`pages/login.md`](pages/login.md) |
| Dashboard | [`pages/dashboard.md`](pages/dashboard.md) |
| Renewal Calendar | [`pages/renewal.md`](pages/renewal.md) |
| Party Detail | [`pages/party-detail.md`](pages/party-detail.md) |
| Smart Search | [`pages/search.md`](pages/search.md) |
| Parties list | [`pages/parties.md`](pages/parties.md) |
| SO Health | [`pages/so.md`](pages/so.md) |
| Notifikasi | [`pages/notifications.md`](pages/notifications.md) |
| Activity Log | [`pages/activity.md`](pages/activity.md) |
| Extraction Lab | [`pages/extraction-lab.md`](pages/extraction-lab.md) |

## UX checklist (pre-delivery)

- [x] `cursor-pointer` on clickable rows, tabs, pagination
- [x] Hover/focus transitions 150–200ms
- [x] `:focus-visible` on buttons, tabs, nav
- [x] `prefers-reduced-motion` respected
- [x] Table pagination on long lists
- [x] Responsive 375 / 768 / 1024 (shell drawer + 375px pass Sprint 3)

## Skill CLI (eksplorasi)

```bash
npm install -g ui-ux-pro-max-cli
uipro init --ai cursor
python .cursor/skills/ui-ux-pro-max/scripts/search.py "legal enterprise dashboard" --design-system -p "DCI CMS"
```

Selalu **re-apply overrides** di atas setelah output skill.
