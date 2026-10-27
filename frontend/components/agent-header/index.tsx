'use client'

import React, { useEffect } from "react"
import { openAIModels } from "@/lib/utils/model"
import Dropdown from "../dropdown"
import { getSourcesByAgentId } from "@/lib/api/sources"
import { updateAgentModel } from "@/lib/api/agents"
import { toast } from "react-toastify"
import Link from "next/link"

interface Props extends Agent {
  source: string,
  setSource: (_v: string) => void
}

const Header = ({
  _id,
  model,
  source,
  setSource,
}: Props) => {
  const [selectedModel, setSelectedModel] = React.useState(model)
  const [isUpdatingModel, setIsUpdatingModel] = React.useState(false);

  const [sources, setSources] = React.useState<DropDownProps[]>([{ label: 'All Sources', value: '' }]);
  const [sourceLoading, setSourceLoading] = React.useState(false);

  const fetchSources = async () => {
    try {
      setSourceLoading(true);
      const _d = await getSourcesByAgentId(_id);
      setSources([
        { label: 'All Sources', value: '' },
        ...(
          (_d || []).map((el: Source) => {
            return ({
              _id: el._id,
              label: el.source_name,
              value: el._id
            })
          })
        )
      ])
    } catch (err) {
      console.error('fetchSources', err)
    } finally {
      setSourceLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()

    addEventListener('sources_updated', fetchSources)

    return () => {
      removeEventListener('sources_updated', fetchSources)
    }
  }, [])


  const onSelect = async (value: string) => {
    try {
      setIsUpdatingModel(true)
      await updateAgentModel({ id: _id, model: value })
      setSelectedModel(value)
      toast('Model updated successfully.', {
        type: 'success'
      })
    } catch (err) {
      console.error('on select model', err);
      toast('Something went wrong!', {
        type: 'error'
      })
    } finally {
      setIsUpdatingModel(false)
    }
  }


  return (
    <div
      className="flex w-full min-h-[70px] shadow-xs bg-header items-center px-3"
    >

      <label
        htmlFor="input-sidebar-toggle"
        className="md:hidden cursor-pointer p-2 text-3xl font-bold"
        style={{
          fontSize: 25
        }}
      >
        ☰
      </label>

      <div className="flex flex-1 flex-wrap justify-center py-2 md:py-0 md:justify-between ">
        <Dropdown
          value={selectedModel}
          options={openAIModels}
          onSelect={onSelect}
          placeholder="Choose a model"
          isLoading={isUpdatingModel}
          loadingText='Updating...'
        />
        <div className="flex flex-row items-center">
          <Dropdown
            value={source}
            options={sources}
            onSelect={setSource}
            placeholder="Sources"
          />
          <Link href={`/agent/${_id}/document_upload`}>
            <div
              className="secondary-button flex justify-center cursor-pointer"
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
      </div>


    </div>
  )
}

export default Header