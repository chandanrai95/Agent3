import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const Footer = () => {
  const { user, logout } = useAuthStore();
  const [logoutInProgress, setLogoutInProgress] = useState(false);
  const router = useRouter()

  //console.log('user ---', user)

  const onClickLogout = async () => {
    try {
      setLogoutInProgress(true)
      await logout()
      toast('Logout successful', {
        type: 'success'
      })
      router.replace('/auth/login')
    } catch (err) {
      console.error('onClickLogout error', err);
      toast('Something went wrong.', {
        type: 'error'
      })
    } finally {
      setLogoutInProgress(false)
    }
  }

  return (
    <div
      className="flex w-full px-3 py-4 items-center border-t-1 border-[rgba(0,0,0,0.1)] shadow-sm"
    >
      <div
        className="flex flex-1 flex-col justify-center px-2"
      >
        <span className="tex-xl font-bold">{user?.name}</span>
        <span className="tex-lg font-medium">{user?.email}</span>
      </div>
      <div
        className="ml-2 flex w-10 h-10  items-center rounded-md justify-center cursor-pointer hover:bg-gray-300 transition"
        onClick={onClickLogout}
      >
        {
          logoutInProgress && (
            <div
              className="w-8 h-8 border-b-2 rounded-full animate-spin"
            />
          ) || (
            <span className="material-icons-round text-2xl text-gray-500">logout</span>
          )
        }


      </div>
    </div>
  )
}

export default Footer