'use client'

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import ModalLayout from "@/components/modal/layout"
import { toast } from "react-toastify"
import { uploadAgentDocument } from "@/lib/api/agents"

const DocumentUpload = () => {
  const router = useRouter();
  const params = useParams();

  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  // Prevent browser from opening file when dropped outside drop zone
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault()
    }

    window.addEventListener("dragover", preventDefaults)
    window.addEventListener("drop", preventDefaults)

    return () => {
      window.removeEventListener("dragover", preventDefaults)
      window.removeEventListener("drop", preventDefaults)
    }
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile(selectedFile)
  }

  const onClose = () => {
    router.back()
  }

  const onUpload = async () => {
    try {
      setLoading(true)

      if (!file) {
        throw new Error("Please select a file to upload")
      }

      const data = await uploadAgentDocument({ id: (params?.id as string) || null, file })
      //console.log('upload response', data)

      toast("File uploaded successfully", {
        type: 'success'
      })
      setFile(null)
      dispatchEvent(new Event('sources_updated'))
      onClose()

    } catch (error) {
      console.error("Upload error:", error)
      toast("Something went wrong. Please try again later.", {
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalLayout
      headerText="Upload Document"
      onClose={onClose}
    >
      {/* Drop Zone */}
      <div
        className={`flex min-h-[220px] border-2 border-dashed rounded-xl 
        items-center justify-center text-center cursor-pointer transition
        ${isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-100 hover:border-gray-400"
          }`}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()

          if (e.dataTransfer.files?.length) {
            setFile(e.dataTransfer.files[0])
          }

          setIsDragging(false)
        }}
      >
        <div>
          <p className="text-gray-600 font-medium">
            {file ? file.name : "Drag & drop your document here"}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            PDF, DOCX, TXT
          </p>
        </div>
      </div>

      {/* File Input + Upload */}
      <div className="flex items-center justify-center mb-4 mt-8 gap-3">
        <input
          type="file"
          className="flex-1 text-black border p-2 rounded-md border-gray-300"
          multiple={false}
          accept=".pdf,.docx,.txt"
          onChange={onChange}
          disabled={loading}
        />

        <button
          className={`${file ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
            } text-white px-4 py-2 rounded transition`}
          onClick={onUpload}
          disabled={!file || loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Remove File Button */}
      {file && (
        <div className="text-center">
          <button
            onClick={() => setFile(null)}
            className="text-red-500 text-sm hover:underline"
            disabled={loading}
          >
            Remove file
          </button>
        </div>
      )}
    </ModalLayout>
  )
}

export default DocumentUpload
