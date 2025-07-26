from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import PdfData
import faiss
from sentence_transformers import SentenceTransformer
import numpy as np
import requests

qa_bp = Blueprint('qa', __name__)

# Load embedding model once
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Placeholder: Replace with your actual OpenRouter API key
OPENROUTER_API_KEY = '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'
OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

# In-memory FAISS index for demo (should persist in production)
pdf_faiss_indexes = {}
pdf_text_chunks = {}

@qa_bp.route('/ask', methods=['POST'])
@jwt_required()
def ask_question():
    data = request.get_json()
    question = data.get('question')
    pdf_id = data.get('pdf_id')
    user_id = get_jwt_identity()
    if not question or not pdf_id:
        return jsonify({'error': 'Missing question or pdf_id'}), 400

    pdf = PdfData.query.filter_by(id=pdf_id, user_id=user_id).first()
    if not pdf:
        return jsonify({'error': 'PDF not found'}), 404

    # Split PDF content into chunks (simple split, improve as needed)
    content = pdf.pdf_content
    chunk_size = 500  # characters
    chunks = [content[i:i+chunk_size] for i in range(0, len(content), chunk_size)]

    # Build FAISS index if not already built
    if pdf_id not in pdf_faiss_indexes:
        embeddings = embedder.encode(chunks)
        index = faiss.IndexFlatL2(embeddings.shape[1])
        index.add(np.array(embeddings).astype('float32'))
        pdf_faiss_indexes[pdf_id] = index
        pdf_text_chunks[pdf_id] = chunks
    else:
        index = pdf_faiss_indexes[pdf_id]
        chunks = pdf_text_chunks[pdf_id]

    # Embed the question and search
    q_emb = embedder.encode([question]).astype('float32')
    D, I = index.search(q_emb, 3)  # top 3 chunks
    context = '\n'.join([chunks[i] for i in I[0]])

    # Call OpenRouter API
    prompt = f"Context: {context}\n\nQuestion: {question}\n\nAnswer:"
    headers = {
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model': 'openai/gpt-3.5-turbo',  # or another available model
        'messages': [
            {'role': 'system', 'content': 'You are a helpful research assistant.'},
            {'role': 'user', 'content': prompt}
        ]
    }
    try:
        resp = requests.post(OPENROUTER_API_URL, headers=headers, json=payload)
        resp.raise_for_status()
        answer = resp.json()['choices'][0]['message']['content']
    except Exception as e:
        return jsonify({'error': 'LLM call failed', 'details': str(e)}), 500

    return jsonify({'answer': answer})
