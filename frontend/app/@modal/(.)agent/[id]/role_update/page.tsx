'use client'

import ModalLayout from "@/components/modal/layout"
import { updateAgent } from "@/lib/api/agents";
import { useParams, useRouter, useSearchParams } from "next/navigation"
import React from "react";
import { toast } from "react-toastify";

const RoleUpdateModal = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const text = searchParams.get('text');

  const [role, setRole] = React.useState<string>(text || '');
  const [isUpdating, setIsUpdating] = React.useState(false)

  const onClose = () => {
    router.back()
  }

  const onChangeRole = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRole(e.target.value)
  }

  const onUpdatePress = async () => {
    try {
      setIsUpdating(true);

      const data = await updateAgent({ id: params?.id as string, payload: { role }})
      //console.log('onUpdatePress --', data)

      toast('Role is updated successfully', {
        type: 'success'
      })
      dispatchEvent(new Event('agent_updated'))
      onClose()
    } catch (err) {
      console.error('onUpdatePress', err)
      toast('Something went wrong.', {
        type: 'error'
      })
    } finally {
      setIsUpdating(false);
    }
  }


  return (
    <ModalLayout
      headerText="Update Agent Role"
      onClose={onClose}
    >
      <div className="flex flex-1 flex-col gap-4 justify-between">
        <div className="flex flex-1">
          <textarea
            value={role}
            className="w-full"
            placeholder="Enter you agent role."
            onChange={onChangeRole}
          />
        </div>
        <button
          onClick={onUpdatePress}
        >
          {
            isUpdating ? 'Updating...' : 'Update'
          }
        </button>
      </div>
    </ModalLayout>
  )
}

export default RoleUpdateModal