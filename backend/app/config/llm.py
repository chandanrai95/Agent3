from typing import Optional

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from openai import OpenAI

from app.config.setting import EMBEDDING_MODEL

# api_key None = platform key from OPENAI_API_KEY, otherwise the user's own key
def get_llm(model_name: str = 'gpt-4.1-mini', temperature: float = 0.2, streaming: bool = True,
            api_key: Optional[str] = None):
    llm = ChatOpenAI(
        model=model_name,
        temperature=temperature,
        streaming=streaming,
        # token counts on streamed answers, needed for usage limits
        stream_usage=True,
        **({"api_key": api_key} if api_key else {}),
    )

    return llm

def get_chat_llm(model_name: str = 'gpt-4.1-mini', temperature: int = 0.2, messages=[]):
    llm = OpenAI()

    return llm.chat.completions.create(model=model_name, temperature=temperature, messages=messages)

def get_embeddings(api_key: Optional[str] = None):
    return OpenAIEmbeddings(model=EMBEDDING_MODEL, **({"api_key": api_key} if api_key else {}))
