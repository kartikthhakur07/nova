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
        for attempt in range(5):
            try:
                response = await client.post(url, json=payload, timeout=15.0)
                if response.status_code == 429:
                    import asyncio
                    sleep_time = (2 ** attempt) + 1
                    print(f"Rate limited (429) calling Gemini embedding. Retrying in {sleep_time}s (attempt {attempt+1}/5)...")
                    await asyncio.sleep(sleep_time)
                    continue
                response.raise_for_status()
                data = response.json()
                embedding = data.get("embedding", {}).get("values", [])
                return embedding
            except Exception as e:
                if attempt < 4:
                    import asyncio
                    sleep_time = (2 ** attempt) + 1
                    print(f"Connection or API error calling Gemini embedding: {e}. Retrying in {sleep_time}s...")
                    await asyncio.sleep(sleep_time)
                    continue
                print(f"Error calling Gemini embedding API: {e}")
                return [0.0] * 3072

