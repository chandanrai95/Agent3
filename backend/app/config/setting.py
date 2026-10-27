import  os

PG_DATABASE_URL = os.getenv('PG_DATABASE_URL') or "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
DATABASE_URL = os.getenv("DATABASE_URL") or 'mongodb+srv://chandanrai1995:Holiday2022$$@cluster0.edwznpw.mongodb.net/'
MONGO_DB = 'agent_db'

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') or 'agent_3_secret_key'
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM') or 'HS256'
JWT_ACCESS_TOKEN_EXPIRE_DAYS = 7
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

EMBEDDINGS_COLLECTION = 'embeddings'
VECTOR_INDEX_NAME = os.getenv('VECTOR_INDEX_NAME') or 'vector_index'
TEXT_INDEX_NAME = os.getenv('TEXT_INDEX_NAME') or 'text_index'
# changing the model needs a re-embed of stored chunks: python -m scripts.reembed_chunks
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL') or 'text-embedding-3-small'
EMBEDDING_DIMENSIONS = int(os.getenv('EMBEDDING_DIMENSIONS') or 1536)
# small fast model for query rewriting and conversation summaries
UTILITY_MODEL = os.getenv('UTILITY_MODEL') or 'gpt-4.1-mini'
MAX_UPLOAD_MB = int(os.getenv('MAX_UPLOAD_MB') or 20)
# model used to read images and scanned pages during ingestion, must support image input
VISION_MODEL = os.getenv('VISION_MODEL') or 'gpt-4.1-mini'
MAX_IMAGES_PER_DOCUMENT = int(os.getenv('MAX_IMAGES_PER_DOCUMENT') or 40)
