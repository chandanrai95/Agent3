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
| POST/GET | `/v1/documents` | upload (multipart `file`: pdf, docx, xlsx, csv, txt, md, png, jpg, webp, gif) / list shared docs |
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

## What gets indexed

| Content | How |
|---|---|
| Text (pdf, docx, txt, md) | split into ~800 char chunks |
| Tables (pdf, docx, xlsx, csv) | kept as markdown tables, split by row groups with the header repeated |
| Images in pdf/docx, image uploads | described/transcribed by `VISION_MODEL` (charts, diagrams, text in images, tables in images) |
| Scanned pdf pages | whole page transcribed by `VISION_MODEL`, tables kept as markdown |

Chunks carry a header embedded with the text (`[Document: x.pdf | Section: Fees | Page 3 | Table: Fee schedule]`),
so a chunk is findable and understandable on its own. Repeated page headers/footers and page numbers are removed.

Each chunk stores `content_type` (`text`, `table`, `image`, `scanned_page`) and `page`/`sheet`, returned in `sources`.
At most `MAX_IMAGES_PER_DOCUMENT` (default 40) images are sent to the vision model per upload.

## How answers are produced

1. **Follow-up rewrite**: with conversation history, the question is rewritten into a standalone search query
   (`"and in 2023?"` → `"Pro plan price in 2023"`), stored on the user message as `search_query`.
2. **Hybrid retrieval**: vector search (`EMBEDDING_MODEL`, default `text-embedding-3-small`) and keyword search
   (Atlas Search, finds exact ids, codes and numbers) are fused with reciprocal rank fusion. Weak vector-only matches are dropped.
3. **Grounded answer** at temperature 0: answers only from the documents, cites `[n]` = `sources[n-1]`, quotes table
   values exactly, says `"I cannot find this in the provided documents."` when the answer isn't there.
4. **Memory**: the last 8 messages are sent verbatim; older messages are folded into a running `summary` on the thread.

## Changing the embedding model

Vectors from different models can't be compared. After changing `EMBEDDING_MODEL` (or for chunks indexed before this
version, which used `text-embedding-ada-002`) run:

```bash
cd backend && python -m scripts.reembed_chunks
```

## Vector index

On startup the app makes sure the Atlas vector index `vector_index` on `embeddings` declares the
filter fields `agent_id`, `thread_id`, `source_id`. It also creates the keyword index `text_index`.
If your cluster tier doesn't allow managing search indexes from the driver, add them in the Atlas UI:

```json
{"fields": [
  {"type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine"},
  {"type": "filter", "path": "agent_id"},
  {"type": "filter", "path": "thread_id"},
  {"type": "filter", "path": "source_id"}
]}
```

`text_index` (Atlas Search):

```json
{"mappings": {"dynamic": false, "fields": {
  "text": {"type": "string"}, "agent_id": {"type": "objectId"},
  "source_id": {"type": "objectId"}, "thread_id": {"type": "token"}
}}}
```

## OpenAI keys and token limits

Each user can save their own OpenAI key (`PUT /api/settings/openai_key`, verified with OpenAI, stored encrypted).
All model calls for that user's agents (answers, query rewriting, summaries, image reading, embeddings), including
calls through the public `/v1` API, then run on their key without limits.

Users without a key use the server's `OPENAI_API_KEY` and get `FREE_TOKEN_LIMIT` tokens per calendar month (UTC,
default 100,000). When it's used up, chat and uploads return `429` with a message pointing to Settings.
`GET /api/settings` returns the key status and this month's usage.

| Env var | Purpose |
|---|---|
| `FREE_TOKEN_LIMIT` | monthly tokens per user on the platform key |
| `SECRETS_ENCRYPTION_KEY` | encrypts stored user keys; changing it makes saved keys unreadable (users re-enter them). Falls back to `JWT_SECRET_KEY` |

## Using an agent on other platforms

Everything is also configured in the app under **Agent → Integrate**.

### OpenAI-compatible endpoint

For tools that accept a custom OpenAI endpoint (Botpress, Typebot, Flowise, n8n, LibreChat, Open WebUI,
LangChain, the OpenAI SDKs):

| Setting | Value |
|---|---|
| Base URL | `https://YOUR-API/v1` |
| API key | an agent API key (`ak_...`) |
| Model | `agent-{agent_id}` (ignored, the key selects the agent) |

`POST /v1/chat/completions` takes OpenAI's request shape (`messages`, `stream`) and returns a `chat.completion`
(or `chat.completion.chunk` SSE ending with `data: [DONE]`) plus a `sources` field. Nothing is stored: send the
whole conversation each time. Caller system messages are ignored, the agent's role applies. `GET /v1/models`
lists the agent.

### Website widget

Enable it per agent, list the allowed origins, then add before `</body>`:

```html
<script src="https://YOUR-API/widget.js" data-agent-key="pk_..." async></script>
```

The `pk_` key is public by design: it only works while the widget is enabled and from allowed origins
(empty list = any site). Each visitor gets their own conversations (stored as threads with
`external_user_id = widget:{visitor id}`), limited to 20 messages per 10 minutes per visitor and 60 per IP.
Usage counts against the agent owner's token quota or OpenAI key. `data-position="left"` and `data-open="true"`
are optional.

The rate limiter is in memory: with several backend workers, move it to Redis.
