# Page override: Login (Enterprise Gateway)

Extends [`MASTER.md`](../MASTER.md).  
Skill pattern: **Enterprise Gateway** + **Trust & Authority** (UI UX Pro Max), overridden to ink/brass.

## Layout

- Full viewport `--ink` + dot/grid subtle pattern
- Card max ~960px, **brass top accent** 3px, entrance animation
- Two columns: **login-side** (trust + features) + **login-form**
- Mobile (&lt;720px): hide side, show **login-mobile-brand** header

## Trust signals (left panel)

- Feature checklist (BRD refs)
- Trust chips: Party-centric · Odoo+RAGFlow · Audit trail

## Form (right panel)

- Eyebrow: "Enterprise gateway"
- Role grid 2×2 with **left accent per role** (not dropdown)
- CTA: "Masuk ke workspace" + arrow icon
- Input focus ring brass

## Auth modes

- **Mock:** email + role grid
- **Supabase:** email + password; role from profiles

## Loading

- `LoginPageSkeleton` — no blank screen on `/`
