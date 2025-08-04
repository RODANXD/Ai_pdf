from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import PdfData
import faiss
from sentence_transformers import SentenceTransformer
import numpy as np
import requests
from pdfminer.high_level import extract_text
import os
from dotenv import load_dotenv


load_dotenv()
qa_bp = Blueprint('qa', __name__)


embedder = SentenceTransformer('all-MiniLM-L6-v2')


OPENROUTER_API_KEY = os.getenv('APIKEY')
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
    llm_model = data.get('llm_model', 'openai/gpt-3.5-turbo')
    prompt_style = data.get('prompt_style', 'concise')

    print(f"[DEBUG] User {user_id} is asking question: {question} for PDF ID: {pdf_id} using model: {llm_model} with style: {prompt_style}")
    # Whitelist of free models
    allowed_models = [
        'openai/gpt-3.5-turbo',
        'google/gemini-pro',
        'anthropic/claude-3-haiku',
        'meta-llama/llama-3-8b-instruct',
    ]
    if llm_model not in allowed_models:
        return jsonify({'error': 'Selected LLM model is not allowed. Please choose a free model.'}), 400


    if not question or not pdf_id:
        return jsonify({'error': 'Missing question or pdf_id'}), 400

    pdf = PdfData.query.filter_by(id=pdf_id, user_id=user_id).first()
    if not pdf:
        return jsonify({'error': 'PDF not found'}), 404

    file_path = os.path.join('uploads',pdf.filename)

    # Split PDF content into chunks (simple split, improve as needed)
    try:
        content = extract_text(file_path)
    except Exception as e:
        return jsonify({'error': 'Failed to extract text from PDF', 'details': str(e)}), 500
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

    style_map = {
        "concise": "Be concise and to the point.",
        "technical": "Use technical language and detailed explanations.",
        "casual": "Be casual and friendly."
    }
    style_instruction = style_map.get(prompt_style, "")

    # Call OpenRouter API
    prompt = f"{style_instruction}\nContext: {context}\n\nQuestion: {question}\n\nAnswer:"
    headers = {
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model':llm_model,  
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
    
    new_turn = [
    {
        "role": "user",
        "content": question,
        "model": llm_model,
        "type": "user"
    },
    {
        "role": "assistant",
        "content": answer,
        "model": llm_model,
        "type": "assistant"
    }
]

    print(f"[DEBUG] New turn: {new_turn}")
    history = ChatHistory.query.filter_by(user_id=user_id).first()

    print("going")
    if history:
        print("entered ---------")
        msgs = json.loads(history.messages or "[]")
        print("msgs before extend:", msgs)
        msgs.extend(new_turn)
        print("msgs after extend:", msgs)
        history.messages = json.dumps(msgs)
        print(f"[DEBUG] Saving to DB: {json.dumps(msgs, indent=2)}")
    else:
        history = ChatHistory(user_id=user_id, messages=json.dumps(new_turn))
        db.session.add(history)

    db.session.commit()
    # ⬆⬆⬆  LINES END HERE ⬆⬆⬆

    print(f"[DEBUG] Answer generated: {answer}")
    return jsonify({'answer': answer})


# --- Chat History Endpoints ---
from flask_jwt_extended import get_jwt_identity
import json
from . import db

from .models import ChatHistory

@qa_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
    history = ChatHistory.query.filter_by(user_id=user_id).first()
    if history:
        return jsonify({'history': json.loads(history.messages)})
    else:
        return jsonify({'history': []})

@qa_bp.route('/history', methods=['POST'])
@jwt_required()
def save_history():
    user_id = get_jwt_identity()
    messages = request.json.get('messages', [])
    history = ChatHistory.query.filter_by(user_id=user_id).first()
    if history:
        history.messages = json.dumps(messages)
    else:
        history = ChatHistory(user_id=user_id, messages=json.dumps(messages))
        db.session.add(history)
    db.session.commit()
    return jsonify({'success': True})



from .models import Answershare
@qa_bp.route('/answershare', methods=['POST'])
@jwt_required()
def answershare():
    data = request.get_json()
    answer = data.get('answer')
    if not answer:
        return jsonify({'error': 'Missing answer'}), 400
    share = Answershare(answer=answer)
    db.session.add(share)
    db.session.commit()
    return jsonify({'url': f"http://localhost:3000/dashboard/shared/{share.token}"})


@qa_bp.route('/shared/<token>', methods=['GET'])
def shared(token):
    share = Answershare.query.filter_by(token=token).first_or_404()
    if not share:
        return jsonify({'error': 'Invalid token'}), 404
    return jsonify({'answer': share.answer, 'created_at': share.created_at.isoformat()})



from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import PdfData, ChatHistory  # and any other models you need
from datetime import datetime, timedelta



@qa_bp.route('/summary', methods=['GET'])
@jwt_required()
def dashboard_summary():
    user_id = get_jwt_identity()
    # Total documents
    total_documents = PdfData.query.filter_by(user_id=user_id).count()
    # Total questions (from chat history, or count from another model)
    total_questions = 0
    history = ChatHistory.query.filter_by(user_id=user_id).first()
    if history and history.messages:
        import json
        try:
            total_questions = sum(1 for m in json.loads(history.messages) if m.get("type") == "user")
        except Exception:
            total_questions = 0
    # Insights (for demo, just a static number or count summaries)
    total_insights = PdfData.query.filter(PdfData.user_id == user_id, PdfData.summary != None).count()
    # Recent activity (last 7 days uploads)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_activity = PdfData.query.filter(PdfData.user_id == user_id, PdfData.created_at >= week_ago).count()
    # Recent documents (last 3)
    recent_documents = PdfData.query.filter_by(user_id=user_id).order_by(PdfData.created_at.desc()).limit(3).all()
    docs = [
        {
            "id": doc.id,
            "title": doc.filename,
            "filename": doc.filename,
            "uploadedAt": doc.created_at.strftime("%Y-%m-%d"),
            "status": "processed",
        }
        for doc in recent_documents
    ]
    # Recent insights (for demo, just static or from summaries)
    recent_insights = [
        {
            "type": "summary",
            "title": "New summary generated",
            "description": f"{doc.filename} - {doc.created_at.strftime('%b %d')}",
            "color": "bg-blue-600",
        }
        for doc in recent_documents if doc.summary
    ]
    return jsonify({
        "totalDocuments": total_documents,
        "totalQuestions": total_questions,
        "totalInsights": total_insights,
        "recentActivity": recent_activity,
        "recentDocuments": docs,
        "recentInsights": recent_insights,
    })

from collections import Counter
from sqlalchemy import func

@qa_bp.route('/model-stats', methods=['GET'])
@jwt_required()
def model_stats():
    user_id = get_jwt_identity()
    history = ChatHistory.query.filter_by(user_id=user_id).first()

    def format_model_name(model):
        """Format model names for display"""
        if not model or model == "Unknown":
            return "Unknown"
        model_map = {
            "openai/gpt-3.5-turbo": "GPT-3.5",
            "anthropic/claude-3-haiku": "Claude 3 Haiku",
            "meta-llama/llama-3-8b-instruct": "Llama 3 8B",
            "google/gemini-pro": "Gemini Pro"
        }
        return model_map.get(model, model.split('/').pop() if '/' in model else model)

    model_counts = {}
    if history and history.messages:
        try:
            messages = json.loads(history.messages)  
            for m in messages:
                # Only count assistant messages (responses) to avoid double counting
                if m.get("type") == "assistant":
                    model = m.get("model") or "Unknown"
                    formatted_name = format_model_name(model)
                    model_counts[formatted_name] = model_counts.get(formatted_name, 0) + 1
        except Exception as e:
            print("JSON decode error:", e)

    stats = [{"name": model, "count": cnt} for model, cnt in model_counts.items()]
    return jsonify(stats)
