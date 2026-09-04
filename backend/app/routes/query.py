from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ai_service import understand_user_query


router = APIRouter(prefix="/query", tags=["Query"])


class QueryRequest(BaseModel):
    query: str


@router.post("")
def process_query(request: QueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    result = understand_user_query(request.query)

    return result