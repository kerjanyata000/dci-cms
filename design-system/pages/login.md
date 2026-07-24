# Page override: Login

Extends [`MASTER.md`](../MASTER.md).

## Layout

- Full viewport `--ink` background
- Two-column card: **login-side** (brand + features) + **login-form**
- Mobile (&lt;560px): hide side panel, single column

## Mock auth

- Role grid cards (2 columns) — not dropdown
- Email validation before submit

## Supabase auth

- Password field; role from `profiles` (no role grid)
