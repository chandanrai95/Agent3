import AgentHistoryItem from "./agent-history-item"

interface Props {
  history: AgentHistoryItem[]
}

const AgentHistoryList = ({ history }: Props) => {
  // return (
  //   // <div className="flex flex-1 flex-col gap-10 h-[100%] pt-5 pb-15">
  //     {
        return (history || []).map((historyItem) => {
          return (
            <AgentHistoryItem
              {...historyItem}
            />
          )
        })
      // }
    // </div>
  // )
}

export default AgentHistoryList