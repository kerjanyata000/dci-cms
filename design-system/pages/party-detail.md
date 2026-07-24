# Page override: Party Detail

Extends [`MASTER.md`](../MASTER.md). UI may exceed mockup where UX Pro Max improves clarity (theme ink/brass unchanged).

## Layout

- Breadcrumb: `Parties / {party_code}`
- **Dossier hero:** gradient ink banner — seal, title, Odoo chip (compact), meta dl grid, actions — **sticky** (`dossier-sticky-wrap`) saat scroll tab content
- **Tabs:** horizontal scroll on narrow screens; brass underline active
- Tab content in cards — not sidebar items
- Contracts tab: **Review** primary + **Lainnya ▾** overflow menu (Edit, Amendment, Termination, Change CP)

## Overview tab (sections)

1. **Contract snapshot** — status, value, payment, documents, Odoo, SO health
2. **Sensitive fields** — locked cards with lock icon + hint (no hatch pattern)
3. **Late Payment & Termination Terms** — sub-card 3-col grid

## RBAC

- Legal: Add Contract (brass) + Link Odoo
- View-only: banner with lock icon; hide create/edit actions

## Components

- `status-pill` BRD §9
- Audit tab: paginate >10 rows
- Loading: dossier skeleton
