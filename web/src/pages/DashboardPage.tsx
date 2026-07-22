import { ODOO_MODE } from '../lib/odoo/client'
import { RAGFLOW_MODE, RAGFLOW_DATASET_ID } from '../lib/ragflow/client'
import { isSupabaseConfigured } from '../lib/supabase'
import type { SessionUser } from '../lib/roles'
import { ROLES } from '../lib/roles'

export function DashboardPage({ user }: { user: SessionUser }) {
  const role = ROLES[user.role]

  return (
    <div>
      <div className="page-head">
        <h1>
          {role.label} — {user.name}
        </h1>
        <p>Dashboard monitoring (tanpa CTA create). Scaffold siap sambung Supabase / Odoo / RAGFlow.</p>
      </div>
      <div className="card">
        <h3>Status koneksi (dev)</h3>
        <ul className="list">
          <li>Supabase: {isSupabaseConfigured ? 'env terisi' : 'belum (isi VITE_SUPABASE_*)'}</li>
          <li>Odoo mode: {ODOO_MODE}</li>
          <li>RAGFlow mode: {RAGFLOW_MODE}</li>
          <li>RAGFlow dataset: {RAGFLOW_DATASET_ID}</li>
          <li>canEdit: {String(role.canEdit)} · canSync: {String(role.canSync)}</li>
        </ul>
      </div>
      <div className="card">
        <h3>Persiapan AI (RAGFlow)</h3>
        <p className="muted">
          Upload kontrak di CMS → Supabase Storage → RAGFlow (chunk/embed/extract) → dual metadata di
          Supabase → validasi ke Party/Odoo Partner → smart search.
        </p>
        <p className="mono">Lihat docs/PREP-EKSTRAKSI-RAGFLOW.md dan docs/CHECKLIST-ODOO-TRIAL-DAN-AI.md</p>
      </div>
    </div>
  )
}
