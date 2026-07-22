/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_ODOO_MODE?: 'dummy' | 'live'
  readonly VITE_RAGFLOW_MODE?: 'dummy' | 'live'
  readonly VITE_RAGFLOW_DATASET_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
