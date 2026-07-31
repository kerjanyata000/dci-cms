# Page override: Login (Enterprise Gateway)

Extends [`MASTER.md`](../MASTER.md).  
Skill pattern: **Enterprise Gateway** + **Trust & Authority** (UI UX Pro Max), overridden to DCI brand blues.

## Layout

- Full viewport `--brand-accent` + blue ambient glow
- Card max ~960px, **primary blue top accent** 3px, entrance animation
- Two columns: **login-side** (logo DCI + product) + **login-form**
- Mobile (&lt;720px): hide side, show **login-mobile-brand** with mark

## Brand

- Logo: `/brand/dci-logo.png` (resmi) — plate putih di panel gelap / mobile
- CTA: `--brand-primary` (`#00A4DF`)

## Form (right panel)

- Role grid 2×2 with **left accent per role** (not dropdown)
- CTA: "Masuk" + arrow icon
- Input focus ring primary blue

## Auth modes

- **Mock:** email + role grid
- **Supabase:** email + password; role from profiles

## Loading

- `LoginPageSkeleton` — no blank screen on `/`
