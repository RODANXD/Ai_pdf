import os
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Blueprint, request, jsonify
from .models import PdfData, User
from . import db
from pdfminer.high_level import extract_text
from werkzeug.utils import secure_filename
from .services.embedding import chunk_text, embed_text
import numpy as np
import faiss
from PIL import Image
import json
import pytesseract
import traceback
# import pdf2image
import requests
from dotenv import load_dotenv
load_dotenv()



pdf_bp = Blueprint('pdf', __name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

embedding_size = 384
index = faiss.IndexFlatL2(embedding_size)
chunk_metadata = []




@pdf_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_pdf():


    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"msg": "Only PDF files are allowed"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    
    try:
        file.save(file_path)
        pdf_size = f"{os.path.getsize(file_path) / 1024:.1f} KB"
    except Exception as e:
        return jsonify({"msg": "Failed to save file", "error": str(e)}), 500


    try:
        pdf_content = extract_text(file_path)
        if not pdf_content.strip():
            return jsonify({"msg": "PDF appears to be empty or unreadable"}), 400
    except Exception as e:
        return jsonify({"msg": "Failed to extract text from PDF", "error": str(e)}), 500

        
    user_id_str = get_jwt_identity()


    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        return jsonify({"msg": "Invalid user identity"}), 401


    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"msg": "User not found"}), 404
        pdf_record = PdfData(filename=filename, user_id=user_id, pdf_size=pdf_size)
        db.session.add(pdf_record)
        db.session.commit()
        chunks = chunk_text(pdf_content)
        vectors=[]
        for chunk in chunks:
            vector = np.array(embed_text(chunk), dtype=np.float32)
            vectors.append(vector)
            chunk_metadata.append({
                "text": chunk,
                "user_id": user_id,
                "file_id": pdf_record.id
            })
        index.add(np.array(vectors))


    except Exception as e:
        db.session.rollback()
        print(f"Database error: {e}")
        traceback.print_exc()
        return jsonify({"msg": "Database error", "error": str(e)}), 500


    return jsonify({
        "msg": "File uploaded successfully",
        "pdf_id": pdf_record.id,
        "filename": filename,
        # "file_text": pdf_content[:500]
    }), 201

os.environ['TESSDATA_PREFIX'] = r"C:\Program Files\Tesseract-OCR\tessdata"

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

@pdf_bp.route('/image', methods=['POST'])
@jwt_required()
def upload_image():
    import sys
    print("[UPLOAD_IMAGE] Start", file=sys.stderr)
    if 'image' not in request.files:
        print("[UPLOAD_IMAGE] No image part in request", file=sys.stderr)
        return jsonify({"msg": "No image part"}), 400

    image = request.files['image']
    print(f"[UPLOAD_IMAGE] Got image: {image.filename}", file=sys.stderr)
    if image.filename == '':
        print("[UPLOAD_IMAGE] No selected image", file=sys.stderr)
        return jsonify({"msg": "No selected image"}), 400

    if not image.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        print(f"[UPLOAD_IMAGE] Invalid file extension: {image.filename}", file=sys.stderr)
        return jsonify({"msg": "Only image files are allowed"}), 400

    filename = secure_filename(image.filename)
    image_path = os.path.join(UPLOAD_FOLDER, filename)
    print(f"[UPLOAD_IMAGE] Saving image to: {image_path}", file=sys.stderr)

    try:
        image.save(image_path)
        img_size = f"{os.path.getsize(image_path) / 1024:.1f} KB"
        print(f"[UPLOAD_IMAGE] Image saved: {image_path}", file=sys.stderr)
        img = Image.open(image_path)
        print(f"[UPLOAD_IMAGE] Image opened for OCR", file=sys.stderr)
        text = pytesseract.image_to_string(img)
        print(f"[UPLOAD_IMAGE] OCR text length: {len(text)}", file=sys.stderr)
        if not text.strip():
            print("[UPLOAD_IMAGE] No text detected in the image", file=sys.stderr)
            return jsonify({"msg": "No text detected in the image"}), 400
    except Exception as e:
        print(f"[UPLOAD_IMAGE] Failed to process image: {e}", file=sys.stderr)
        return jsonify({"msg": "Failed to process image", "error": str(e)}), 500

    user_id_str = get_jwt_identity()
    print(f"[UPLOAD_IMAGE] JWT identity: {user_id_str}", file=sys.stderr)
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        print("[UPLOAD_IMAGE] Invalid user identity", file=sys.stderr)
        return jsonify({"msg": "Invalid user identity"}), 401

    user = User.query.get(user_id)
    print(f"[UPLOAD_IMAGE] User lookup: {user}", file=sys.stderr)
    if not user:
        print("[UPLOAD_IMAGE] User not found", file=sys.stderr)
        return jsonify({"msg": "User not found"}), 404

    try:
        ocr_record = PdfData(filename=filename, user_id=user_id, pdf_size=img_size)
        db.session.add(ocr_record)
        db.session.commit()
        print(f"[UPLOAD_IMAGE] DB commit successful, ocr_id: {ocr_record.id}", file=sys.stderr)
    except Exception as e:
        db.session.rollback()
        print(f"[UPLOAD_IMAGE] Database error: {e}", file=sys.stderr)
        return jsonify({"msg": "Database error", "error": str(e)}), 500

    print("[UPLOAD_IMAGE] Success", file=sys.stderr)
    return jsonify({
        "msg": "Image uploaded successfully",
        "ocr_id": ocr_record.id,
        "filename": filename,
        # "text": text[:500]
    })



@pdf_bp.route('/documents', methods=['GET'])
@jwt_required()
def get_document():
    user_id = get_jwt_identity()
    try:
        pdfs = PdfData.query.filter_by(user_id=user_id).all()
        if not pdfs:
            return jsonify({"msg": "No PDFs found for this user"}), 404
        data =[{
            "id": pdf.id,
            "filename": pdf.filename,
            "uploaded_at": pdf.uploaded_at.isoformat(),
            "created_at": pdf.created_at.isoformat(),
            "pdf_size": pdf.pdf_size,
            "summary": pdf.summary if pdf.summary else "",  
        } for pdf in pdfs
        ]   

        return jsonify({"document":data}), 200
    except Exception as e:
        print(f"Error retrieving documents: {e}")
        return jsonify({"msg": "Error retrieving documents", "error": str(e)}), 500
    


from flask import send_from_directory

@pdf_bp.route('/download/<int:pdf_id>', methods=['GET'])
@jwt_required()
def download_pdf(pdf_id):
    user_id = get_jwt_identity()
    pdf = PdfData.query.filter_by(id=pdf_id, user_id=user_id).first()
    if not pdf:
        return jsonify({"msg": "PDF not found"}), 404
    file_path = os.path.join(UPLOAD_FOLDER, pdf.filename)
    if not os.path.exists(file_path):
        return jsonify({"msg": "File not found"}), 404
    print(f"Download request for: {file_path}, exists: {os.path.exists(file_path)}")
    return send_from_directory(UPLOAD_FOLDER, pdf.filename, as_attachment=True)



    

OPENROUTER_API_KEY = os.getenv('APIKEY')
OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

@pdf_bp.route('/summarize', methods=['POST'])
@jwt_required()
def summarize_pdf():
    
    data = request.get_json()
    pdf_id = data.get('pdf_id')
    force = data.get('force', False)
    user_id = get_jwt_identity()
    if not pdf_id:
        return jsonify({'error': 'Missing pdf_id'}), 400
    pdf = PdfData.query.filter_by(id=pdf_id, user_id=user_id).first()
    if not pdf:
        return jsonify({'error': 'PDF not found'}), 404
    
    if pdf.summary and not force:
        return jsonify({'summary': pdf.summary}), 200
    file_path = os.path.join(UPLOAD_FOLDER, pdf.filename)
    try:
        content = extract_text(file_path)
    except Exception as e:
        return jsonify({'error': 'Failed to extract text from PDF', 'details': str(e)}), 500
    prompt = f"Summarize the following research paper in a short paragraph. Then, list 3-5 key points and highlight the most important sentences.\n\nPaper:\n{content[:4000]}"
    headers = {
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model': 'openai/gpt-3.5-turbo',
        'messages': [
            {'role': 'system', 'content': 'You are a helpful research assistant.'},
            {'role': 'user', 'content': prompt}
        ]
    }
    try:
        resp = requests.post(OPENROUTER_API_URL, headers=headers, json=payload)
        resp.raise_for_status()
        summary = resp.json()['choices'][0]['message']['content']
        pdf.summary = summary
        db.session.commit()
        return jsonify({'summary': summary}), 200
    except Exception as e:
        print(f"Error summarizing PDF: {e}")
        return jsonify({'error': 'Failed to summarize', 'details': str(e)}), 500

@pdf_bp.route('/entities', methods=['POST'])
@jwt_required()
def extract_entities():
    data = request.get_json()
    pdf_id = data.get('pdf_id')
    user_id = get_jwt_identity()
    if not pdf_id:
        return jsonify({'error': 'Missing pdf_id'}), 400
    pdf = PdfData.query.filter_by(id=pdf_id, user_id=user_id).first()
    if not pdf:
        return jsonify({'error': 'PDF not found'}), 404
    file_path = os.path.join(UPLOAD_FOLDER, pdf.filename)
    try:
        content = extract_text(file_path)
    except Exception as e:
        return jsonify({'error': 'Failed to extract text from PDF', 'details': str(e)}), 500
    prompt = (
        "Extract the main entities (people, organizations, concepts, methods) and their relationships "
        "from the following research paper. Return the result as a JSON object with 'nodes' (entities) "
        "and 'edges' (relationships). Each node should have an 'id' and 'label'. Each edge should have "
        "'source', 'target', and 'label'.\n\nPaper:\n" + content[:4000]
    )
    headers = {
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model': 'openai/gpt-3.5-turbo',
        'messages': [
            {'role': 'system', 'content': 'You are a helpful research assistant.'},
            {'role': 'user', 'content': prompt}
        ]
    }
    try:
        resp = requests.post(OPENROUTER_API_URL, headers=headers, json=payload)
        resp.raise_for_status()
        entities = resp.json()['choices'][0]['message']['content']

        try:
            entities = json.loads(entities)
        except Exception:
            import re 
            match = re.search(r'({.*})', entities, re.DOTALL)
            if match:
                entities = json.loads(match.group(1))
            else:
                return jsonify({'error': 'AI did not return valid JSON','raw': entities}), 500
        return jsonify({'graph': entities}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to extract entities', 'details': str(e)}), 500

@pdf_bp.route('/delete/<int:pdf_id>', methods=['DELETE'])
@jwt_required()
def delete_pdf(pdf_id):
    user_id = get_jwt_identity()
    pdf = PdfData.query.filter_by(id=pdf_id, user_id=user_id).first()
    if not pdf:
        return jsonify({'msg': 'PDF not found'}), 404
    file_path = os.path.join(UPLOAD_FOLDER, pdf.filename)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        db.session.delete(pdf)
        db.session.commit()
        return jsonify({'msg': 'PDF deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Failed to delete PDF', 'error': str(e)}), 500