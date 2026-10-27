import useAppStore from "@/store/useAppStore"
import AgentItem from "./agent-item"
import { redirect, useParams } from "next/navigation";
import Link from "next/link";

export default function Content() {
  const { agents = [] } = useAppStore();
  const { id } = useParams();

  return (
    <div className="flex flex-1 flex-col  py-4 px-3 max-h-full overflow-y-auto">
      <div className="flex w-full flex-row justify-between items-center">
        <span
          className="text-xl font-bold"
        >
          Agents
        </span>

        <Link href={`/agent/add`}>
          <div
            className="secondary-button--text flex justify-center cursor-pointer"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 34
              }}
            >
              add
            </span>
          </div>
        </Link>
      </div>
      <div
        className="flex flex-1 overflow-y-auto mt-3 flex-col max-h-full gap-2"
      >
        {
          agents.map(el => {
            return (
              <AgentItem
                {...el}
                selectedId={id as string}
              />
            )
          })
        }
      </div>
    </div>
  )
}