from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn

app = FastAPI()

print("Loading embedding model...")
model = SentenceTransformer("all-mpnet-base-v2")
print("Embedding model loaded successfully!")


class EmbeddingRequest(BaseModel):
    text: str


@app.get("/")
def root():
    return {
        "status": "ML service running"
    }


@app.post("/embed")
def generate_embedding(request: EmbeddingRequest):

    embedding = model.encode(
        request.text,
        normalize_embeddings=True
    )

    return {
        "embedding": embedding.tolist()
    }


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8001
    )