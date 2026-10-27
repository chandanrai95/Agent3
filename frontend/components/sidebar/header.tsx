import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const Header = () => {
  return (
    <div
      className="flex w-full px-3 py-4 items-center justify-between "
    >
      <span
        className="icon material-symbols-outlined mb-2"
        style={{
          fontSize: '35px'
        }}
      >
        smart_toy
      </span>

      <span
        className="icon material-symbols-outlined mb-2"
        style={{
          fontSize: '35px'
        }}
      >
        side_navigation
      </span>
    </div>
  )
}

export default Header