interface Source {
    _id: string
    agent_id: string
    thread_id?: string | null
    type: string,
    source_name: string
    status?: string
    chunk_count?: number | null
    size_bytes?: number | null
    content_stats?: Record<string, number> | null
    images_processed?: number | null
    images_skipped?: number | null
    created_at: string | Date
}
