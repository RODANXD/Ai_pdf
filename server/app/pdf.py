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
import pytesseract
# import pdf2image


pdf_bp = Blueprint('pdf', __name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

embedding_size = 1536
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
        pdf_record = PdfData(filename=filename, pdf_content=pdf_content, user_id=user_id)
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
        return jsonify({"msg": "Database error", "error": str(e)}), 500


    return jsonify({
        "msg": "File uploaded successfully",
        "pdf_id": pdf_record.id,
        "filename": filename,
        "file_text": pdf_content[:500]
    }), 201



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
        ocr_record = PdfData(filename=filename, pdf_content=text, user_id=user_id)
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
        "text": text[:500]
    })


