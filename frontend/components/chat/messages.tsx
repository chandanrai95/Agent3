'use client'
import React from "react"
import { toast } from "react-toastify"
import { formatTime, initials } from "@/lib/utils/format"
import { getModel } from "@/lib/utils/model"
import Icon from "../ui/icon"
import Markdown from "./markdown"
import SourceChips from "./source-chips"

export const UserMessage = ({ message, userName }: { message: ChatMessage, userName?: string }) => (
  <div className="flex items-start justify-end gap-3 pl-8 sm:pl-12">
    <div className="flex flex-col items-end max-w-2xl min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-label-sm text-outline">You</span>
        <span className="font-mono text-code text-outline">{formatTime(message.created_at)}</span>
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tr-none bg-surface-container-highest text-on-surface shadow-sm text-body-lg whitespace-pre-wrap break-words">
        {message.content}
      </div>
    </div>
    <div className="w-8 h-8 mt-6 shrink-0 rounded-full bg-surface-container-highest flex items-center justify-center text-label-md font-semibold text-on-surface">
      {initials(userName)}
    </div>
  </div>
)

type AssistantProps = {
  message: ChatMessage
  agent: Agent
}

export const AssistantMessage = ({ message, agent }: AssistantProps) => {
  const model = getModel(agent.model)
  const waiting = message.streaming && !message.content

  const copy = async () => {
    await navigator.clipboard.writeText(message.content)
    toast('Copied to clipboard', { type: 'success', autoClose: 1500 })
  }

  return (
    <div className="flex items-start gap-3 sm:pr-6">
      <div className="w-9 h-9 shrink-0 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-md">
        <Icon name="smart_toy" filled className="text-[20px]" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-label-md text-on-surface font-semibold">{agent.name}</span>
          <span className={`px-1.5 py-0.5 rounded bg-surface-container-high text-label-sm ${model.color}`}>{agent.model}</span>
          {message.streaming
            ? <span className="text-label-sm text-primary">{waiting ? 'Searching documents...' : 'Writing...'}</span>
            : <span className="font-mono text-code text-outline">{formatTime(message.created_at)}</span>}
        </div>

        <div className={`relative p-4 sm:p-5 rounded-2xl rounded-tl-none bg-surface-container-low text-on-surface shadow-md flex flex-col gap-4 overflow-hidden ${message.streaming ? 'ring-1 ring-primary/20' : ''}`}>
          {message.streaming && <div className="absolute top-0 left-0 right-0 h-0.5 shimmer-bar" />}

          {waiting ? (
            <div className="flex flex-col gap-2" aria-label="Searching documents">
              <div className="h-3 w-3/4 rounded-full shimmer-bar" />
              <div className="h-3 w-1/2 rounded-full shimmer-bar" />
            </div>
          ) : (
            <div className="relative">
              <Markdown content={message.content} sources={message.sources} />
              {message.streaming && <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-primary animate-blink" />}
            </div>
          )}

          {message.error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-error-container/30 text-error text-body-sm">
              <Icon name="error" className="text-[18px]" />
              {message.error}
            </div>
          )}

          {!message.streaming && message.sources.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              <span className="flex items-center gap-1.5 text-label-sm text-rag-indexed uppercase tracking-wide font-medium">
                <Icon name="menu_book" className="text-[16px]" />
                Sources
              </span>
              <SourceChips sources={message.sources} />
            </div>
          )}

          {!message.streaming && message.content && (
            <div className="flex items-center justify-between pt-1">
              <button type="button" title="Copy answer" onClick={copy} className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors flex">
                <Icon name="content_copy" className="text-[18px]" />
              </button>
              {message.sources.length > 0 && (
                <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                  <Icon name="database" className="text-[16px] text-rag-indexed" />
                  {message.sources.length} source{message.sources.length > 1 ? 's' : ''} used
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
