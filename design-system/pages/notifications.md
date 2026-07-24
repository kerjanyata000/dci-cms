# Page override: Notifikasi

Extends [`MASTER.md`](../MASTER.md).

## Akses

- **Primary:** bell icon di topbar (`NotificationsBell`) — dropdown preview + link "Lihat semua"
- **Full page:** `/notifications` — **bukan** item sidebar nav (DESIGN_GUIDELINES §8)

## Layout

- Crumb **Registry** + title Notifikasi
- Filter chips: Semua / Urgent
- List `notif-list-page` + paginasi
- Empty state: pesan + hint (bukan blank)

## Visual

- Bell: **inline SVG** — no emoji
- Badge urgent count di bell (merah)
- Kode notifikasi: `mono notif-code` (NOTIF-CMS-*)

## RBAC

- Role dengan `views.notifications` lihat bell + halaman penuh
- Management / Legal: link ke Renewal / Party dari payload `href`
