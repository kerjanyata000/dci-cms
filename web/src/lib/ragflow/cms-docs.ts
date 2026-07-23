import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/server'

/** RAGFlow doc IDs indexed from CMS contract uploads (not BRD / lab junk in dataset). */
export async function getCmsRagflowDocumentIds(): Promise<string[]> {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('documents')
    .select('ragflow_doc_id')
    .not('ragflow_doc_id', 'is', null)
    .in('document_category', ['contract', 'amendment'])

  if (error) throw new Error(error.message)

  return [
    ...new Set(
      (data ?? [])
        .map((row) => row.ragflow_doc_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
}

export async function mapCmsDocumentNames(
  ragflowDocIds: string[],
): Promise<Map<string, string>> {
  if (!ragflowDocIds.length) return new Map()

  const db = getSupabaseAdmin()
  const { data } = await db
    .from('documents')
    .select('ragflow_doc_id, file_name')
    .in('ragflow_doc_id', ragflowDocIds)

  return new Map(
    (data ?? []).map((d) => [d.ragflow_doc_id as string, d.file_name as string]),
  )
}
