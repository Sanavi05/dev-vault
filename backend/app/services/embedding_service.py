"""
embedding_service.py — Generate embeddings using OpenAI API.

Using hosted embeddings dramatically reduces backend memory usage
compared to loading local transformer models. This keeps deployment
lightweight and suitable for platforms like Render free tier.
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_embedding(text: str) -> list[float]:
    """
    Generate embedding for a single text string.
    """
    response = client.embeddings.create(
    model="text-embedding-3-small",
    input=text
    )
    return response.data[0].embedding

def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for multiple text chunks.
    """
    if not texts:
        return []


    embeddings = []

    for text in texts:
        embedding = generate_embedding(text)
        embeddings.append(embedding)

    return embeddings


def embed_query(query: str) -> list[float]:
    """
    Generate embedding for search query.
    """
    return generate_embedding(query)
