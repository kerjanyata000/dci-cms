# Page override: Dashboard

Extends [`MASTER.md`](../MASTER.md).

## Layout

- Page head: crumb + title + **odoo-mode-chip** (live/dummy)
- View-only **readonly-banner** when role lacks `canEdit`
- Role **notice** with workspace chip + FR-DASH-003 copy
- KPI grid (5 Legal, 4 others) — no create CTA
- Role panels via `DashboardRolePanels`
- Footer note with optional Renewal / Notifikasi links

## RBAC

- Forbidden redirect: banner `notice-warn` with path from query `forbidden`
