# Page override: Notifikasi

Extends [`MASTER.md`](../MASTER.md).

## Akses

- **Primary:** bell icon di topbar (`NotificationsBell`) — dropdown preview + link "Lihat semua"
- **Full page:** `/notifications` — **bukan** item sidebar nav (DESIGN_GUIDELINES §8)
- **Profile menu:** link Notifikasi untuk role dengan `views.notifications`

## Layout

- Crumb **Registry** + title Notifikasi
- Filter chips: Semua / Urgent · sort **Terbaru** / **Urgent dulu**
- Tombol **Tandai semua dibaca** (localStorage prototype)
- List `notif-list-page` + paginasi · item dibaca = opacity reduced (`.notif-read`)
- Timestamp `notif-time` per item

## Visual

- Bell: **inline SVG** — no emoji
- Badge urgent count di bell (merah)
- Kode notifikasi: `mono notif-code` (NOTIF-CMS-*)

## RBAC

- Role dengan `views.notifications` lihat bell + halaman penuh
- Management / Legal: link ke Renewal / Party dari payload `href`
