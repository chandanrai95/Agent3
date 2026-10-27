from langchain_openai import ChatOpenAI
from openai import OpenAI

def get_llm(model_name: str = 'gpt-4.1-mini', temperature: float = 0.2, streaming: bool = True):
    llm = ChatOpenAI(
        model=model_name,
        temperature=temperature,
        streaming=streaming
    )

    return llm

def get_chat_llm(model_name: str = 'gpt-4.1-mini', temperature: int = 0.2, messages=[]):
    llm = OpenAI()

    return llm.chat.completions.create(model=model_name, temperature=temperature, messages=messages)