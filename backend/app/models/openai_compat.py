from typing import Literal, Optional, Union

from pydantic import BaseModel, Field


class ContentPart(BaseModel):
    type: str
    text: Optional[str] = None


class CompatMessage(BaseModel):
    role: Literal["system", "user", "assistant", "tool", "developer"]
    # plain text, or OpenAI content parts (only text parts are used)
    content: Union[str, list[ContentPart], None] = None


class ChatCompletionRequest(BaseModel):
    """Subset of OpenAI's chat completion request. `model` is ignored: the API key picks the agent."""
    model: Optional[str] = None
    messages: list[CompatMessage] = Field(..., min_length=1)
    stream: bool = False
    user: Optional[str] = None
    # extension: restrict retrieval to these document ids
    source_ids: Optional[list[str]] = None
