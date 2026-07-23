import { jsonError, jsonOk } from '@/lib/server/api-route'
import {
  confirmContractMetadata,
  getContractById,
  transitionContractStatus,
  updateContractAdminDetails,
} from '@/lib/contracts/server'
import type { ContractMetadata } from '@/types/cms'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    return jsonOk({ contract: await getContractById(id) })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Contract not found', 404)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as {
      action?: 'confirm_metadata' | 'status' | 'edit_admin'
      confirmed?: ContractMetadata
      statusAction?: string
      contract_title?: string
      owner?: string
      department?: string
      remarks?: string
    }

    if (body.action === 'confirm_metadata') {
      const contract = await confirmContractMetadata(id, body.confirmed ?? {})
      return jsonOk({ contract })
    }

    if (body.action === 'status' && body.statusAction) {
      const contract = await transitionContractStatus(id, body.statusAction)
      return jsonOk({ contract })
    }

    if (body.action === 'edit_admin') {
      const contract = await updateContractAdminDetails(id, {
        contract_title: body.contract_title ?? '',
        owner: body.owner,
        department: body.department,
        remarks: body.remarks,
      })
      return jsonOk({ contract })
    }

    return jsonError('Invalid action', 400)
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Update failed', 500)
  }
}
