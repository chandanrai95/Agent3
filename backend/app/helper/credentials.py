import base64
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import tiktoken
from bson import ObjectId
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException, status

from app.config.setting import SECRETS_ENCRYPTION_KEY, JWT_SECRET_KEY, FREE_TOKEN_LIMIT

_fernet = Fernet(base64.urlsafe_b64encode(hashlib.sha256((SECRETS_ENCRYPTION_KEY or JWT_SECRET_KEY).encode()).digest()))
_encoding = tiktoken.get_encoding("cl100k_base")


def encrypt_secret(value: str) -> str:
    return _fernet.encrypt(value.encode()).decode()


def decrypt_secret(value: str) -> Optional[str]:
    try:
        return _fernet.decrypt(value.encode()).decode()
    except InvalidToken:
        # encryption key changed, the stored key can't be used anymore
        return None


def count_tokens(texts: list[str]) -> int:
    return sum(len(_encoding.encode(t)) for t in texts)


def current_period(now: Optional[datetime] = None) -> str:
    return (now or datetime.now(timezone.utc)).strftime("%Y-%m")


def period_reset_at(now: Optional[datetime] = None) -> datetime:
    now = now or datetime.now(timezone.utc)
    return datetime(now.year + (now.month == 12), now.month % 12 + 1, 1, tzinfo=timezone.utc)


@dataclass
class LLMCredentials:
    """Which OpenAI key a user's requests run on. api_key None = the platform key from the environment."""
    user_id: ObjectId
    api_key: Optional[str] = None

    @property
    def own_key(self) -> bool:
        return self.api_key is not None


async def resolve_credentials(db, user_id) -> LLMCredentials:
    user_id = ObjectId(user_id)
    settings = await db.user_settings.find_one({"user_id": user_id}) or {}
    encrypted = settings.get("openai_api_key")
    return LLMCredentials(user_id=user_id, api_key=decrypt_secret(encrypted) if encrypted else None)


async def get_usage(db, user_id) -> dict:
    doc = await db.usage.find_one({"user_id": ObjectId(user_id), "period": current_period()}) or {}
    return {"tokens": doc.get("tokens", 0), "by_kind": doc.get("by_kind", {})}


async def ensure_quota(db, credentials: LLMCredentials):
    """Users on the platform key are limited to FREE_TOKEN_LIMIT tokens per month."""
    if credentials.own_key:
        return
    used = (await get_usage(db, credentials.user_id))["tokens"]
    if used >= FREE_TOKEN_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(f"You've used your free {FREE_TOKEN_LIMIT:,} tokens for this month. "
                    f"Add your own OpenAI API key in Settings to keep going."),
        )


@dataclass
class UsageMeter:
    """Collects token usage during a request and adds it to the user's monthly total."""
    credentials: LLMCredentials
    tokens: dict = field(default_factory=dict)

    def record(self, kind: str, count: Optional[int]):
        if count:
            self.tokens[kind] = self.tokens.get(kind, 0) + int(count)

    def record_response(self, kind: str, message):
        usage = getattr(message, "usage_metadata", None) or {}
        self.record(kind, usage.get("total_tokens"))

    async def save(self, db):
        total = sum(self.tokens.values())
        if not total:
            return
        inc = {"tokens": total, **{f"by_kind.{k}": v for k, v in self.tokens.items()}}
        if not self.credentials.own_key:
            inc["platform_tokens"] = total
        await db.usage.update_one(
            {"user_id": self.credentials.user_id, "period": current_period()},
            {"$inc": inc, "$set": {"updated_at": datetime.utcnow()}},
            upsert=True,
        )
        self.tokens = {}
