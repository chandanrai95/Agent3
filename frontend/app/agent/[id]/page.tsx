'use client'

import React from "react"
import Header from "@/components/agent-header"
import { useParams } from "next/navigation"
import { getAgentById } from "@/lib/api/agents"
import { getAgentHistoryByAgentId } from "@/lib/api/agent-history"
import AgentHistoryList from "@/components/agent-history"
import AgentHistoryItem from "@/components/agent-history/agent-history-item"
import Link from "next/link"


const AgentPage = () => {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = React.useState<Agent | null>();
  const [isAgentLoading, setIsAgentLoading] = React.useState(false);
  const [source, setSource] = React.useState<string>('');
  const [history, setHistory] = React.useState([]);
  const [message, setMessage] = React.useState('');
  const [query, setQuery] = React.useState('');

  const [roleEditMode, setRoleEditMode] = React.useState(false);
  const [updatedRole, setUpdatedRole] = React.useState(agent?.role);

  const [queryMessage, setQueryMessage] = React.useState('');
  const [inProgress, setInProgress] = React.useState(false);

  //console.log('agent id', id)

  const fetchAgentData = async (_id: string) => {
    try {
      if (!_id) return;
      const _d = await getAgentById(_id);
      setAgent(_d)
    } catch (err) {
      console.error('fetchAgentData', err)
    }
  }

  const fetchAgentHistory = async (_id: string) => {
    try {
      if (!_id) return;
      const _d = await getAgentHistoryByAgentId(_id);
      setHistory(_d)
    } catch (err) {
      console.error('fetchAgentHistory', err)
    }
  }

  const fetchAgent = async () => {
    try {
      setIsAgentLoading(true)
      let _id = Array.isArray(id) ? id[0] : id;
      if (!_id) return;
      await fetchAgentData(_id)
      await fetchAgentHistory(_id)
    } catch (err) {
      console.error('fetchAgent', err)
    } finally {
      setIsAgentLoading(false)
    }
  }

  React.useEffect(() => {
    fetchAgent();
  }, [id]);

  React.useEffect(() => {
    const handleAgentUpdate = () => {
      const _id = Array.isArray(id) ? id[0] : id;
      fetchAgentData(_id);
    };
    
    addEventListener('agent_updated', handleAgentUpdate)

    return () => removeEventListener('agent_updated', handleAgentUpdate)
  },[id])

  const onChangeSource = (_v: string) => {
    setSource(_v)
  }

  const sendMessage = async () => {
    try {
      setInProgress(true);
      setQueryMessage(query);
      setQuery('')
      const response = await fetch(`/api/agents/${id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: query, source }),
      })

      if (!response.body) return

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let result = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        //console.log('chunk ---', chunk)
        result += chunk

        setMessage(result) // update UI live
      }

      await fetchAgentHistory(id)
      setQueryMessage('')
      setMessage('')
    } catch (err) {
      console.error('sendMessage', err)
    } finally {
      setInProgress(false)
    }
  }

  const onChangeQuery = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value)
  }

  //console.log('agent --', { agent, history, message })
  if (isAgentLoading || !agent) return;

  return (
    <>
      <Header
        {...(agent || {})}
        source={source}
        setSource={onChangeSource}
      />
      <div
        className="flex flex-1 overflow-y-auto max-h-[100%] flex-col pb-3 w-full overflow-auto px-2"
      >
        <div className="flex flex-1 flex-col w-full max-h-full overflow-y-auto px-2 gap-10 py-5 mb-2">
          <AgentHistoryList
            history={history}
          />


          {/* <div className="flex flex-col bg-white p-4 rounded-sm mt-2 text-black">
            <pre className="whitespace-pre-wrap mt-1"> {message} </pre>
          </div> */}
          {
            inProgress && (
              <AgentHistoryItem
                answer={message}
                question={queryMessage}
              />
            )
          }

          <div
            className="flex w-full min-h-[150px]"
          >

          </div>
        </div>

        <div
          className="flex  w-full  bg-gray-200 py-2 px-4 rounded-md mb-1 items-center gap-2"
        >
          <span className="text-lg font-medium self-start">Agent Role: </span>
          <div className="flex flex-1">
            {
              roleEditMode && (
                <input
                  value={updatedRole}
                  placeholder="Enter agent role."
                  onChange={(e) => {
                    setUpdatedRole(e.target.value)
                  }}
                />
              ) || <span className="text-md font-small">{agent?.role}</span>
            }

          </div>
          <Link href={`/agent/${id}/role_update?text=${agent?.role || ''}`}>
            <span className="material-symbols-outlined ml-1 float-center">
              edit
            </span>
          </Link>
        </div>
        <div
          className="send-input flex w-full items-center"
        >
          <textarea
            className="flex-1"
            placeholder="Ask anything"
            value={query}
            onChange={onChangeQuery}
          />

          <button
            className="ml-4 flex items-center"
            onClick={sendMessage}
          >
            Send
            {
              inProgress && (
                <div className="flex justify-center items-center ml-2">
                  <div className="w-6 h-6 border-4 border-white-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) || (
                <span className="material-symbols-outlined ml-1 float-center">
                  send
                </span>
              )
            }

          </button>
        </div>

      </div>
    </>
  )
}

export default AgentPage