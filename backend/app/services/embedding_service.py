"""
embedding_service.py — Generate embeddings using Gemini API.
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_embedding(text: str) -> list[float]:
    """
    Generate embedding for a single text string.
    """

    response = genai.embed_content(
        model="models/gemini-embedding-2",
        content=text,
        task_type="retrieval_document"
    )

    return response["embedding"]


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for multiple text chunks.
    """

    embeddings = []

    for text in texts:
        embeddings.append(generate_embedding(text))

    return embeddings
    

def embed_query(query: str) -> list[float]:
    """
    Generate embedding for search query.
    """


    response = genai.embed_content(
        model="models/gemini-embedding-2",
        content=query,
        task_type="retrieval_query"
    )

    return response["embedding"]
