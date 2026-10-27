from bson import ObjectId
from openai import AsyncOpenAI
import app.config.database as database
from app.helper.agent_history import load_chat_history

class ChatCompletionAgent:
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.history = []
        self.agent = None
        self.db = database.db
        self.context = ''
        self.vector_search =  database.getVectorStoreDb()

    async def setupAgent(self):
        self.agent = self.db.agents.find_one({"_id": ObjectId(self.agent_id)})

    async def setupHistory(self):
        _history = load_chat_history(self.db, self.agent_id, 6)
        for h in _history:
            self.history.append({
                "role": "user", "content": h['question']
            })
            self.history.append({
                "role": "system", "content": h['answer']
            })



    async def setupContext(self, question: str = '',  source_id: str = ''):
        filter = { "agent_id": ObjectId(self.agent_id)}

        if source_id:
            filter["source_id"] = source_id

        docs = await self.vector_search.asimilarity_search(question, k=5, pre_filter=filter)

        context = "\n\n".join([d.page_content for d in docs])

        self.context = context

    async def chat_stream(self, question: str = '', source_id= ''):
        await self.setupAgent()
        await self.setupHistory()
        await  self.setupContext(question, source_id)

        openai = AsyncOpenAI()
        stream = await openai.chat.completions.create(
            model= self.agent['model'] or "gpt-4.1-mini",
            messages=[
                { "role": "system", "content": self.agent["role"] or "You are a helpful assistant."}
                *self.history,
                {
                    "role": "user",
                    "content": f"""
                        Please answer the following questions using only the provided document context. Do not include any external information or general knowledge.
                
                        Context:
                        {self.context}
                    
                        Question:
                        {question}
                    """
                }
            ],
            stream=True
        )

        response = ""

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                response += chunk.choices[0].delta.content
                yield  chunk.choices[0].delta.content

