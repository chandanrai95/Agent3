import { logoutApi } from "@/lib/api/auth"
import { create } from "zustand"

interface AuthStore {
  user: User | null,
  isLoggedIn: boolean,
  setUser: (_user: User) => void,
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoggedIn: false,
  setUser: (_user) => {
    set({
      user: _user,
      isLoggedIn: _user ? true : false
    })
  },
  logout: async () => {
    set({
      user: null,
      isLoggedIn: false
    })
    await logoutApi()
  }
}))

