from langchain_openai import ChatOpenAI


def get_llm(model_name: str = 'gpt-4.1-mini', temperature: int = 0.2):
    llm = ChatOpenAI(
        model=model_name,
        temperature=temperature,
        streaming=True
    )

    return llm
