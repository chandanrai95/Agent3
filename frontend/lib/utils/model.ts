// chat models that accept temperature 0 (the RAG pipeline answers at temperature 0)
export const chatModels = [
  { value: "gpt-4.1-mini", label: "GPT-4.1 mini", description: "Fast & affordable, good default", color: "text-secondary", dot: "bg-secondary" },
  { value: "gpt-4.1", label: "GPT-4.1", description: "Most capable, best for long documents", color: "text-success", dot: "bg-success" },
  { value: "gpt-4o", label: "GPT-4o", description: "Strong all-round reasoning", color: "text-success", dot: "bg-success" },
  { value: "gpt-4o-mini", label: "GPT-4o mini", description: "Low cost, quick answers", color: "text-tertiary", dot: "bg-tertiary" },
  { value: "gpt-4.1-nano", label: "GPT-4.1 nano", description: "Cheapest, simple lookups", color: "text-rag-syncing", dot: "bg-rag-syncing" },
];

export const getModel = (value?: string) =>
  chatModels.find((m) => m.value === value) || { value: value || '', label: value || 'Unknown model', description: '', color: 'text-outline', dot: 'bg-outline' }
