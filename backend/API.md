# Public Agent API

Integrate an agent into any project. Every request is authenticated with an **agent API key**.

## 1. Get an API key (dashboard, user JWT)

```
POST /api/agents/{agent_id}/api_keys      {"name": "my-app"}   -> { "key": "ak_...", ... }   # key shown once
GET  /api/agents/{agent_id}/api_keys
DELETE /api/agents/{agent_id}/api_keys/{key_id}                                           # revoke
```

Send the key as `X-API-Key: ak_...` or `Authorization: Bearer ak_...`.

## 2. Concepts

- **Agent**: role + model, owned by a tenant (user account).
- **Agent documents** (`/v1/documents`): shared knowledge, searchable from every thread.
- **Thread** (`/v1/threads`): one conversation with its own history and its own documents.
  Thread documents are only searchable inside that thread. Use `external_user_id` to map threads to your own users.

## 3. Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/v1/agent` | agent info |
| POST/GET | `/v1/documents` | upload (multipart `file`: pdf, docx, txt, md) / list shared docs |
| DELETE | `/v1/documents/{id}` | |
| POST | `/v1/threads` | `{"title", "external_user_id", "metadata"}` |
| GET | `/v1/threads?external_user_id=&limit=&skip=` | |
| GET/PATCH/DELETE | `/v1/threads/{id}` | delete removes messages, docs and embeddings |
| POST/GET | `/v1/threads/{id}/documents` | thread-only docs |
| DELETE | `/v1/threads/{id}/documents/{doc_id}` | |
| GET | `/v1/threads/{id}/messages` | history |
| POST | `/v1/threads/{id}/messages` | `{"message", "stream": false, "source_ids": []}` |

The same routes exist for the dashboard under `/api/agents/{agent_id}/...` with a user JWT.

## 4. Example

```bash
KEY=ak_xxx; BASE=http://localhost:8000
T=$(curl -s -X POST $BASE/v1/threads -H "X-API-Key: $KEY" -H 'Content-Type: application/json' \
      -d '{"title":"Contract Q&A","external_user_id":"user-42"}' | jq -r ._id)
curl -X POST $BASE/v1/threads/$T/documents -H "X-API-Key: $KEY" -F file=@contract.pdf
curl -X POST $BASE/v1/threads/$T/messages -H "X-API-Key: $KEY" -H 'Content-Type: application/json' \
     -d '{"message":"What is the notice period?"}'
```

Non-streaming response:

```json
{"thread_id": "...", "message_id": "...", "answer": "...", "created_at": "...",
 "sources": [{"source_id": "...", "source_name": "contract.pdf", "snippet": "...", "score": 0.83}]}
```

With `"stream": true` the response is `text/event-stream` with events
`token` (`{"content"}`), `sources`, `done` (same payload as the JSON response) and `error`.

## Vector index

On startup the app makes sure the Atlas vector index `vector_index` on `embeddings` declares the
filter fields `agent_id`, `thread_id`, `source_id`. If your cluster tier doesn't allow managing search
indexes from the driver, add them in the Atlas UI:

```json
{"fields": [
  {"type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine"},
  {"type": "filter", "path": "agent_id"},
  {"type": "filter", "path": "thread_id"},
  {"type": "filter", "path": "source_id"}
]}
```
