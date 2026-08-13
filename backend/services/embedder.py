import os
import httpx

async def embed(text: str) -> list[float]:
    """
    Generate embedding for the given text using Gemini API.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY not found. Cannot embed text.")
        return [0.0] * 3072  # Return dummy embedding if key is missing

    model = "gemini-embedding-001"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent?key={api_key}"
    
    payload = {
        "model": f"models/{model}",
        "content": {
            "parts": [{"text": text}]
        }
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            embedding = data.get("embedding", {}).get("values", [])
            return embedding
        except Exception as e:
            print(f"Error calling Gemini embedding API: {e}")
            return [0.0] * 3072
