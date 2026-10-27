import { formatDate } from "@/lib/utils/date"

const AgentHistoryItem = ({
  answer,
  question
}: { answer: string, question: string }) => {
  return (
    <div
      className="flex flex-col w-full rounded-sm items-end w-full px-3"
    >
      <span className="px-4 py-2 rounded-lg bg-gray-100 text-lg font-medium">{question}</span>
      <div className="flex flex-col flex-1 bg-white p-4 rounded-sm mt-2 text-black">
        <pre className="whitespace-pre-wrap mt-1"> {answer} </pre>
      </div>
      {/* <span className=""><span className="text-lg font-semibold">Created: </span>{formatDate(created_at)}</span> */}
    </div>
  )
}

export default AgentHistoryItem