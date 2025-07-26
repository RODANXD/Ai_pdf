import requests
import numpy as np
import textwrap
from typing import List, Union
import faiss
from sentence_transformers import SentenceTransformer



OPENROUTER_API_KEY  = "key"
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


def chunk_text(text: str, max_chars: int = 1024) -> list[str]:
    if not isinstance(text, str):
        raise ValueError("Input text must be a string.")
    try:
        wrapped_text = textwrap.wrap(text, max_chars, break_long_words=False)
        return wrapped_text
    except Exception as e:
        raise ValueError(f"Error wrapping text: {e}")


def embed_text(text: Union[str, List[str]]) -> np.ndarray:
    if isinstance(text, str):
        text = [text]
    embeddings = embedding_model.encode(text)
    return np.array(embeddings[0], dtype=np.float32)



    
def create_faiss_index(vectors: List[np.ndarray], dimension: int = 1536) -> faiss.IndexFlatL2:
    """
    Create and return a FAISS index from vectors
    """
    index = faiss.IndexFlatL2(dimension)
    if vectors:
        index.add(np.array(vectors))
    return index






