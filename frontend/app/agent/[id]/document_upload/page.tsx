'use client'

import ModalLayout from "@/components/modal/layout"
import { useRouter } from "next/navigation"

const DocumentUpload = () => {
  const router = useRouter()

  const onClose = () => {
    router.back()
  }

  return (
    <ModalLayout
      headerText='Upload Document'
      onClose={onClose}
    >
      <div>

      </div>
    </ModalLayout>
  )
}

export default DocumentUpload