/** Strip trailing slashes and Odoo web UI path (`/odoo`). */
export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').replace(/\/odoo$/, '')
}

export function getOdooServerConfig() {
  const url = process.env.ODOO_URL
  const db = process.env.ODOO_DB
  const username = process.env.ODOO_USERNAME
  const apiKey = process.env.ODOO_API_KEY

  if (!url || !db || !username || !apiKey) {
    throw new Error(
      'Odoo server env incomplete. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY in .env.local',
    )
  }

  return {
    url: normalizeBaseUrl(url),
    db,
    username,
    apiKey,
  }
}

export function getRagflowServerConfig() {
  const url = process.env.RAGFLOW_URL
  const apiKey = process.env.RAGFLOW_API_KEY
  const datasetId =
    process.env.RAGFLOW_DATASET_ID ?? process.env.NEXT_PUBLIC_RAGFLOW_DATASET_ID

  if (!url || !apiKey) {
    throw new Error(
      'RAGFlow server env incomplete. Set RAGFLOW_URL and RAGFLOW_API_KEY in .env.local',
    )
  }

  if (!datasetId) {
    throw new Error(
      'RAGFlow dataset id missing. Set RAGFLOW_DATASET_ID (UUID from RAGFlow cloud UI).',
    )
  }

  return {
    url: normalizeBaseUrl(url),
    apiKey,
    datasetId,
  }
}
