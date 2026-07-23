import { cmsFetch } from '@/lib/api/http'

async function parseJson<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status})`)
  }
  return payload.data as T
}

export async function getDocumentDownloadUrl(documentId: string): Promise<{
  url: string
  fileName: string
  mimeType: string
}> {
  return parseJson(await cmsFetch(`/api/documents/${documentId}/download`, { cache: 'no-store' }))
}

export async function openDocumentDownload(documentId: string) {
  const { url, fileName } = await getDocumentDownloadUrl(documentId)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export async function uploadSignedContractDocument(
  contractId: string,
  file: File,
  markFullySigned = true,
) {
  const form = new FormData()
  form.set('file', file)
  if (markFullySigned) form.set('mark_fully_signed', '1')

  return parseJson<{ document: unknown; contract: unknown }>(
    await cmsFetch(`/api/contracts/${contractId}/signed-document`, { method: 'POST', body: form }),
  )
}
