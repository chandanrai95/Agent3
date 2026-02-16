from datetime import datetime
from bson import ObjectId
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

import app.config.database as database
from app.helper.agent_history import chat_agent_history, load_chat_history
from app.config.llm import get_llm


class ChatAgent:
    def __init__(self, agent_id: str = '', collection_name: str = 'embeddings'):
        self.history = []
        self.vector_store = database.getVectorStoreDb(collection_name)
        self.db = database.db
        self.agent_id = agent_id
        self.llm = None
        self.messages = []

    async def load_history(self):
        history_context = await chat_agent_history(self.db, self.agent_id)
        self.history = history_context
        print("load_history", len(history_context))

    def dynamic_k(self, question: str):
        word_count = len(question.split())

        if word_count <= 2:
            return 8  # short vague query
        elif word_count <= 6:
            return 6
        else:
            return 4  # specific question


    async def setup_llm_context(self, question):
        print("setup_llm_context")
        await self.load_history()
        agent = await self.db.agents.find_one({"_id": ObjectId(self.agent_id)})

        self.llm = get_llm(agent['model'])
        k = self.dynamic_k(question)
        print(f"k: {k}")
        docs = await self.vector_store.asimilarity_search(
            question,
            k=k,
            pre_filter={"agent_id": ObjectId(self.agent_id)}
        )

        context = "\n\n".join(d.page_content for d in docs)

        SYSTEM_PROMPT = f"""
        {agent["role"]}

        Answer strictly using only the provided document context.

        If the answer is not in the context, say:
        "I cannot find this in the provided document."

        Do not make up information.
        """

        # messages = [
        #     SystemMessage(content=SYSTEM_PROMPT),
        #     *(self.history or []),
        #     # SystemMessage(content=f"Relevant document context:\n{context}"),
        #     HumanMessage(
        #         content=f"""
        #             Context:
        #             {context}
        #
        #             Question:
        #             {question}
        #         """
        #     )
        # ]

        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            *(self.history or []),
            SystemMessage(content=f"Document Context:\n{context}"),
            HumanMessage(content=question)
        ]

        print(f"messages {messages}")
        self.messages = messages

    async def stream_chat(self, question: str = '', user_id: str = ''):
        print("stream_chat")
        await  self.setup_llm_context(question)
        full_answer = ""

        chunks = self.llm.astream(self.messages)

        async for chunk in chunks:
            full_answer += chunk.content
            yield chunk.content

        _ag = {
            'user_id': ObjectId(user_id),
            'question': question,
            'answer': full_answer,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'agent_id': ObjectId(self.agent_id)
        }
        await self.db.agent_history.insert_one(_ag)

    async def generate_prompt(self, message: str):
        docs = await self.vector_store.asimilarity_search(
            message,
            k=5
        )

        # Build context
        context = "\n\n".join(
            [f"{d.page_content}" for i, d in enumerate(docs)]
        )

        final_prompt = f"""
            You are an assistant. Use the following context to answer.

            Context:
            {context}

            User:
            {message}
        """

        return final_prompt, docs

    def extract_sources(self, docs):
        sources = []
        for i, d in enumerate(docs):
            sources.append({
                "id": i + 1,
                "source": d.metadata.get("source", "unknown").replace("uploads/", " "),
                "snippet": d.page_content[:200]  # optional preview
            })
        return sources

    async def stream_chat_v2(self, question: str = ''):
        llm = get_llm('gpt-4.1')
        prompt = ChatPromptTemplate.from_messages([
            ('system', 'You are a helpuful assistant!'),
            ("human", "{input}")
        ])

        chain = prompt | llm

        final_prompt, docs = await self.generate_prompt(question)
        print(f"final_prompt : {final_prompt}")

        async for chunk in chain.astream({"input": final_prompt}):
            if chunk.content:
                yield chunk.content

        # After streaming the answer, send sources
        sources = self.extract_sources(docs)
        yield "\n\nSources:\n"
        for s in sources:
            yield f"[{s['id']}] {s['source']}\n"

    async def stream_chat_v3(self, question: str = '', source_id: str = '', user_id: str = ''):
        # 1️⃣ Load history
        await self.load_history()
        print(f"stream_chat_v3 1")
        agent = await self.db.agents.find_one({"_id": ObjectId(self.agent_id)})

        print(f"stream_chat_v3 2")
        # 2️⃣ Model
        llm = get_llm(agent['model'] or 'gpt-4.1')

        print(f"stream_chat_v3 3")

        filter = {"agent_id": ObjectId(self.agent_id)}

        if source_id :
            filter["source_id"] = ObjectId(source_id)

        print(f"filter---- {filter}")

        # 3️⃣ Retrieval
        docs = await self.vector_store.asimilarity_search(
            question,
            k=5,
            pre_filter=filter
        )

        context = "\n\n".join([d.page_content for d in docs])

        # 4️⃣ Prompt template with history
        prompt = ChatPromptTemplate.from_messages([
            ("system", agent['role'] or "You are a helpful assistant."),
            MessagesPlaceholder(variable_name="history"),
            ("human", """
    Please answer the following questions using only the provided document context. Do not include any external information or general knowledge.

    Context:
    {context}

    Question:
    {question}
    """)
        ])

        chain = prompt | llm

        # 5️⃣ Stream response
        full_answer = ""

        async for chunk in chain.astream({
            "history": self.history[-6:] if self.history else [],
            "context": context,
            "question": question
        }):
            if chunk.content:
                full_answer += chunk.content
                yield chunk.content

        # 7️⃣ Append sources
        sources = self.extract_sources(docs)

        full_answer += "\n\nSources:\n"
        yield "\n\nSources:\n"
        for s in sources:
            full_answer += f"[{s['id']}] {s['source']}\n"
            yield f"[{s['id']}] {s['source']}\n"

        # 6️⃣ Save conversation
        if user_id:
            await self.db.agent_history.insert_one({
                'user_id': ObjectId(user_id),
                'question': question,
                'answer': full_answer,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'agent_id': ObjectId(self.agent_id)
            })

