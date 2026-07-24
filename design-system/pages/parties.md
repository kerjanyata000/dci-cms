# Page override: Parties list

Extends [`MASTER.md`](../MASTER.md).

## Layout

- Crumb **Parties** + title serif + CTA **+ Add New Party** (Legal only)
- **Table toolbar:** status / Odoo link / PIC filters + search + Refresh + count chip
- **Data table** + paginasi (8/hal)

## Deep linking

Query URL sync:

| Param | Values |
|-------|--------|
| `q` | nama party |
| `status` | contract status filter |
| `link` | odoo link status |
| `pic` | PIC name |
| `sort` | `party_code`, `agreement_date`, `status` |
| `dir` | `asc`, `desc` |

## Interaksi

- **Sortable** column headers (Party ID, Agreement Date, Status)
- **Clickable row** → Party Detail
- PIC dropdown dari **seluruh register** (bukan hanya hasil filter)
- Skeleton loading saat fetch awal
- **ErrorBanner** dengan retry

## Status visuals

- Contract status & Odoo link: **`.status-pill`** BRD §9

## RBAC

- Legal: create party + link Odoo actions
- View-only: row view tanpa edit column
