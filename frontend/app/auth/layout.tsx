const AuthLayout = ({
  children
}: { children: React.ReactNode }) => {
  return (
    <div
      className="
        flex 
        flex-1 
        h-screen 
        items-center
        justify-center
      "
    >
      <div
        className="
          flex
          flex-col
          w-[50%]
          bg-white
          min-h-[100px]
          shadow-lg
          rounded-xl
          items-center
          max-w-[650px]
          px-7
          py-5
          border-1
          border-[rgba(0,0,0,0.1)]
        "
      >
        <div
          className="flex pb-2 pt-4 flex-col items-center"
        >
          <span 
            className="logo-icon material-symbols-outlined mb-2"
          >
            smart_toy
          </span>
          <span
            className="
            text-xl
            font-bold
            text-center
          "
          >
            ChatBot
          </span>
        </div>
        <div
          className="flex w-full"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout