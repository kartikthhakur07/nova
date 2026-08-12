import os
import httpx
import uuid
from backend.services.embedder import embed

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")

def get_headers():
    headers = {"Content-Type": "application/json"}
    if QDRANT_API_KEY:
        headers["api-key"] = QDRANT_API_KEY
    return headers

async def _create_collection_if_not_exists(client: httpx.AsyncClient, name: str):
    url = f"{QDRANT_URL}/collections/{name}"
    resp = await client.get(url, headers=get_headers(), timeout=60.0)
    if resp.status_code == 404:
        print(f"Creating Qdrant collection: {name}")
        payload = {
            "vectors": {
                "size": 3072,  # Gemini text-embedding-004 size
                "distance": "Cosine"
            }
        }
        create_resp = await client.put(url, json=payload, headers=get_headers(), timeout=60.0)
        create_resp.raise_for_status()

async def init_collections():
    async with httpx.AsyncClient() as client:
        await _create_collection_if_not_exists(client, "incidents_historical")
        await _create_collection_if_not_exists(client, "lessons_learned")

async def upsert(collection_name: str, payload: dict, vector: list[float], point_id: str = None):
    if not point_id:
        point_id = str(uuid.uuid4())
        
    url = f"{QDRANT_URL}/collections/{collection_name}/points"
    data = {
        "points": [
            {
                "id": point_id,
                "vector": vector,
                "payload": payload
            }
        ]
    }
    async with httpx.AsyncClient() as client:
        resp = await client.put(url, json=data, headers=get_headers(), timeout=60.0)
        if resp.status_code != 200:
            print(f"Qdrant Upsert Error: {resp.text}")
        resp.raise_for_status()
    return point_id

async def retrieve_context(query_text: str, k_incidents=3, k_lessons=2) -> dict:
    """Embed query_text, search both collections, return formatted context dict."""
    vector = await embed(query_text)
    
    async def search_collection(client: httpx.AsyncClient, name: str, limit: int):
        url = f"{QDRANT_URL}/collections/{name}/points/search"
        data = {
            "vector": vector,
            "limit": limit,
            "with_payload": True
        }
        resp = await client.post(url, json=data, headers=get_headers(), timeout=60.0)
        if resp.status_code == 404:
            return []  # Collection doesn't exist yet
        if resp.status_code != 200:
            print(f"Qdrant Search Error: {resp.text}")
        resp.raise_for_status()
        return resp.json().get("result", [])

    async with httpx.AsyncClient() as client:
        incidents = await search_collection(client, "incidents_historical", k_incidents)
        lessons = await search_collection(client, "lessons_learned", k_lessons)
        
    return {
        "historical_incidents": [item.get("payload", {}) for item in incidents],
        "lessons_learned": [item.get("payload", {}) for item in lessons]
    }
