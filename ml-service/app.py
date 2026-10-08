from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

model = SentenceTransformer("all-mpnet-base-v2")


class EmbeddingRequest(BaseModel):
    text: str


@app.get("/")
def root():
    return {"status": "ML service running"}


@app.post("/embed")
def generate_embedding(request: EmbeddingRequest):
    embedding = model.encode(
        request.text,
        normalize_embeddings=True
    )

    return {
        "embedding": embedding.tolist()
    }