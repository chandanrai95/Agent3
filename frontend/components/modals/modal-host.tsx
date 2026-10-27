'use client'
import useAppStore from "@/store/useAppStore"
import AddAgentModal from "./add-agent"
import EditAgentModal from "./edit-agent"

const ModalHost = () => {
  const { modal } = useAppStore()
  if (!modal) return null
  if (modal.type === 'add-agent') return <AddAgentModal template={modal.template} />
  if (modal.type === 'edit-agent') return <EditAgentModal agent={modal.agent} />
  return null
}

export default ModalHost
