import React from "react"

type Props = {
  headerText: string,
  onClose: () => void
  children: React.ReactNode
}

const ModalLayout = ({
  headerText = '',
  onClose = () => { },
  children
}: Props) => {
  return (
    <div
      className="flex fixed top-0 left-0 bottom-0 right-0 bg-[rgba(0,0,0,0.3)] z-10 items-center justify-center transition ease-in-out overflow-hidden"
    >
      <div className="flex flex-col max-h-[80%] min-h-[40%] max-w-[80%] w-200 bg-white rounded-lg  px-6 py-4 relative">
        <div
          className="flex justify-between pb-4 items-center"
        >
          <span className="text-2xl font-bold">
            {headerText}
          </span>

          <button
            className="secondary-button border-0"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default ModalLayout