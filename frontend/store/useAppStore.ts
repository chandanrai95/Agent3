import { create } from "zustand";
import { getAgentDocuments } from "@/lib/api/documents";
import { getThreads } from "@/lib/api/threads";
import { getSettings } from "@/lib/api/settings";

export type AgentTemplate = { name: string, model: string, role: string }

type Modal =
  | { type: 'add-agent', template?: AgentTemplate }
  | { type: 'edit-agent', agent: Agent }
  | null

interface AppStore {
  agents: Agent[],
  agentsLoaded: boolean,
  setAgents: (_agents: Agent[]) => void

  modal: Modal,
  openModal: (modal: Exclude<Modal, null>) => void
  closeModal: () => void

  // documents per agent, shared by the sources drawer and the upload modal
  documents: Record<string, Source[]>,
  documentsLoading: Record<string, boolean>,
  refreshDocuments: (agentId: string) => Promise<void>

  // conversations per agent, listed under each agent in the sidebar
  threads: Record<string, Thread[]>,
  threadsLoading: Record<string, boolean>,
  refreshThreads: (agentId: string) => Promise<void>

  // OpenAI key status and token usage, drives the usage meter
  settings: UserSettings | null,
  setSettings: (settings: UserSettings) => void
  refreshSettings: () => Promise<void>

  sidebarOpen: boolean,
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  agents: [],
  agentsLoaded: false,
  setAgents: (_agents) => {
    set({
      agents: Array.isArray(_agents) ? _agents : [],
      agentsLoaded: true
    })
  },

  modal: null,
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),

  documents: {},
  documentsLoading: {},
  refreshDocuments: async (agentId) => {
    set((s) => ({ documentsLoading: { ...s.documentsLoading, [agentId]: true } }))
    try {
      const docs = await getAgentDocuments(agentId)
      set((s) => ({ documents: { ...s.documents, [agentId]: docs } }))
    } catch (err) {
      console.error('refreshDocuments', err)
    } finally {
      set((s) => ({ documentsLoading: { ...s.documentsLoading, [agentId]: false } }))
    }
  },

  threads: {},
  threadsLoading: {},
  refreshThreads: async (agentId) => {
    set((s) => ({ threadsLoading: { ...s.threadsLoading, [agentId]: true } }))
    try {
      const threads = await getThreads(agentId)
      set((s) => ({ threads: { ...s.threads, [agentId]: threads } }))
    } catch (err) {
      console.error('refreshThreads', err)
    } finally {
      set((s) => ({ threadsLoading: { ...s.threadsLoading, [agentId]: false } }))
    }
  },

  settings: null,
  setSettings: (settings) => set({ settings }),
  refreshSettings: async () => {
    try {
      set({ settings: await getSettings() })
    } catch (err) {
      console.error('refreshSettings', err)
    }
  },

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))

export default useAppStore
