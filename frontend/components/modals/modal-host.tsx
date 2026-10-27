'use client'
import useAppStore from "@/store/useAppStore"
import AddAgentModal from "./add-agent"
import DocumentsModal from "./documents"
import EditRoleModal from "./edit-role"

const ModalHost = () => {
  const { modal } = useAppStore()
  if (!modal) return null
  if (modal.type === 'add-agent') return <AddAgentModal template={modal.template} />
  if (modal.type === 'documents') return <DocumentsModal agentId={modal.agentId} initialFiles={modal.files} />
  if (modal.type === 'edit-role') return <EditRoleModal agent={modal.agent} />
  return null
}

export default ModalHost
