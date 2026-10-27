import { create } from "zustand";

interface AppStore {
  agents: Agent[],
  setAgents: (_agents: Agent[]) => void
}

export const useAppStore = create<AppStore>((set) => ({
  agents: [],
  setAgents: (_agents) => {
    //console.log('setAgents--', _agents)
    set({
      agents: _agents
    })
  }
}))

export default useAppStore