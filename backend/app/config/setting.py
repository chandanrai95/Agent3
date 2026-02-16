import  os

PG_DATABASE_URL = os.getenv('PG_DATABASE_URL') or "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
DATABASE_URL = os.getenv("DATABASE_URL") or 'mongodb+srv://chandanrai1995:Holiday2022$$@cluster0.edwznpw.mongodb.net/'
MONGO_DB = 'agent_db'

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') or 'agent_3_secret_key'
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM') or 'HS256'
JWT_ACCESS_TOKEN_EXPIRE_DAYS = 7
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')