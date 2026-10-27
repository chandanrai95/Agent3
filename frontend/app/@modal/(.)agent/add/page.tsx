'use client'
import React from "react"
import Dropdown from "@/components/dropdown"
import Input from "@/components/input"
import ModalLayout from "@/components/modal/layout"
import useForm from "@/hooks/useForm"
import { openAIModels } from "@/lib/utils/model"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { addAgent } from "@/lib/api/agents"

type AddForm = {
  name: string
  model: string
  role: string
}

const AddAgent = () => {
  const router = useRouter();

  const [isAdding, setIsAdding] = React.useState(false);

  const { formValues, onChangeValue } = useForm<AddForm>({ name: '', model: '', role: '' });

  const onChangeName = (_v: string) => onChangeValue('name', _v)
  const onChangeModel = (_v: string) => onChangeValue('model', _v)
  const onChangeRole = (_v: string) => onChangeValue('role', _v)

  const onClose = () => {
    router.back()
  }

  const onAdd = async () => {
    try {
      setIsAdding(true)
      if (!formValues.name || !formValues.model || !formValues.role) {
        toast('All fields are required.', {
          type: 'error'
        })
        return;
      }
      const _d = await addAgent(formValues)
      //console.log('added agent', _d)
      
      dispatchEvent(new Event('agents_updated'))
      onClose()
    } catch (err: any) {
      if (err?.message) {
        toast(err?.message, {
          type: 'error'
        })
        return;
      }
      toast('Something went wrong.', {
        type: 'error'
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <ModalLayout
      headerText='Add Agent'
      onClose={onClose}
    >
      <div
        className="flex w-full flex-col gap-4"
      >

        <Input
          label="Name"
          placeholder="Enter your agent name"
          value={formValues?.name}
          onChange={onChangeName}
        />

        <div
          className="flex flex-col w-full gap-2"
        >
          <label>Model</label>
          <Dropdown
            value={formValues?.model}
            options={openAIModels}
            onSelect={onChangeModel}
            placeholder="Select a model"
          />
        </div>


        <Input
          label="Role"
          placeholder="Enter your agent role"
          value={formValues?.role}
          onChange={onChangeRole}
        />
      </div>

      <div
        className="flex w-full  justify-end mt-5"
      >
        <button
          onClick={onAdd}
        >
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </div>
    </ModalLayout>
  )
}

export default AddAgent