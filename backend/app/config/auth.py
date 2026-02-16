from datetime import timedelta, datetime
from passlib.context import CryptContext
import app.config.setting as setting
from jose import jwt


# -----------------------------
# PASSWORD HELPER
# -----------------------------
pwd_context = CryptContext(schemes=['bcrypt'], deprecated="auto")

def create_hashed_password(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# -----------------------------
# JWT HELPER
# -----------------------------
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=setting.JWT_ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({ "exp": expire })
    return jwt.encode(to_encode, setting.JWT_SECRET_KEY, algorithm=setting.JWT_ALGORITHM)

def verify_access_token(token: str):
    try:
        return jwt.decode(token, setting.JWT_SECRET_KEY, algorithms=setting.JWT_ALGORITHM)
    except Exception :
        return None
