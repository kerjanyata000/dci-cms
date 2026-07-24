# Page override: Party Detail

Extends [`MASTER.md`](../MASTER.md).

## Layout

- Crumb: `Parties / {party_code}`
- **Dossier head:** seal (party no) + Odoo strip + meta grid + actions (Legal: Add Contract brass, Link Odoo ghost)
- **Tabs:** Overview, Contracts, Novation, Termination, Supporting, SO, Audit — not in sidebar

## Overview tab

- Info grid: status, value, payment term, locked counterparty/value/signed doc
- Sub-card: Late Payment & Termination Terms (from `confirmed_metadata`)
- View-only banner when role cannot edit

## Components

- Status: `status-pill` (BRD §9), not generic bootstrap badges
- Tables: paginate audit trail when >10 rows
- Buttons: `btn brass` for Add Contract; hide Legal actions for view-only roles
