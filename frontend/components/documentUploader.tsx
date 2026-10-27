'use client'
import React from "react";

interface DocumentUploaderProps {
    isOpen: boolean;
    onClose: () => void;
}

const DocumentUploader = ({
    isOpen,
    onClose
}: DocumentUploaderProps) => {
    const [file, setFile] = React.useState<File | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false)

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
        setFile(selectedFile)
    }

    const onUpload = async () => {
        try {
            setLoading(true)
            if (!file) {
                throw new Error('Please select a file to upload')
            }

            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/upload`, {
                method: 'POST',
                body: formData
            })

            //console.log('uploadResponse', uploadResponse)
            window.alert('File uploaded successfully')

        } catch (er: Error | any) {
            window.alert(`Something went wrong. Please try again later.`)
            console.error('onUpload error', er)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null


    return (
        <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,0.9)] opacity"
        >
            <div className="flex flex-col items-center justify-center h-full">
                <div className="bg-white p-8 rounded-lg w-[50%] min-w-96">
                    <div className="flex w-full justify-between flex-row">
                        <h2 className="text-2xl font-bold mb-4 text-black">Upload Document</h2>
                        <button onClick={onClose} className="text-black">
                            <span className="material-symbols-outlined text-black rounded-full">close</span>
                        </button>
                    </div>

                    <div className="flex flex-1 align-center justify-center mb-4 mt-10">
                        <input
                            type="file"
                            className=" flex-1 text-black border-1 p-2 rounded-md border-gray-300"
                            multiple={false}
                            accept=".pdf,.docx,.txt"
                            onChange={onChange}
                            disabled={loading}
                        />

                        <button
                            className={`${file ? 'bg-blue-500' : 'bg-gray-500'} text-white px-4 py-2 rounded hover:bg-blue-600 ml-2`}
                            onClick={onUpload}
                            disabled={loading}
                        >
                            {loading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default DocumentUploader