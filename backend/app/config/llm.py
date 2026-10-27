from langchain_openai import ChatOpenAI
from openai import OpenAI

def get_llm(model_name: str = 'gpt-4.1-mini', temperature: int = 0.2):
    llm = ChatOpenAI(
        model=model_name,
        temperature=temperature,
        streaming=True
    )

    return llm

def get_chat_llm(model_name: str = 'gpt-4.1-mini', temperature: int = 0.2, messages=[]):
    llm = OpenAI()

    return llm.chat.completions.create(model=model_name, temperature=temperature, messages=messages)