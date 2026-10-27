import { formatDate } from "@/lib/utils/date"
import { redirect } from "next/navigation"

interface Props extends Agent {
  selectedId: string
}


const AgentItem = (agent: Props) => {
  const onPressItem = () => {
    redirect(`/agent/${agent._id}`)
  }

  return (
    <div
      className={`agent-item${agent?.selectedId == agent._id ? '--selected' : ''} w-full py-1 border-sm flex flex-col`}
      onClick={onPressItem}
    >
      <span className="text-lg font-semibold">{agent?.name}</span>
      <span className="my-1 font-small">{agent?.role}</span>
      {agent?.updated_at && <span className="font-medium">Last updated: {formatDate(agent?.updated_at)}</span>}
    </div>
  )
}

export default AgentItem