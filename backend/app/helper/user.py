from bson import ObjectId
from app.models import  user_schema


async def get_user_byid(db, id: str):
    user = await db.users.find_one({ "_id": ObjectId(id) })
    return user
