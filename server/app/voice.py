import whisper
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import PdfData
from werkzeug.utils import secure_filename
from faster_whisper import WhisperModel

import os
import warnings
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")


voice_bp = Blueprint('voice', __name__)
whisper_model = WhisperModel("base") 


@voice_bp.route('/transcribe', methods=['POST'])
@jwt_required()
def voice_to_text():
    import sys
    print("[VOICE_TO_TEXT] Request received", file=sys.stderr)
    if 'audio' not in request.files:
        print("[VOICE_TO_TEXT] No audio file provided", file=sys.stderr)
        return jsonify({"msg": "No audio file provided"}), 400

    audio_file = request.files['audio']
    print(f"[VOICE_TO_TEXT] Audio file received: {audio_file.filename}", file=sys.stderr)
    upload_dir = os.path.abspath('uploads')
    os.makedirs(upload_dir, exist_ok=True)
    save_path = os.path.join(upload_dir, secure_filename(audio_file.filename))
    audio_file.save(save_path)
    print(f"[VOICE_TO_TEXT] Audio file saved to: {save_path}", file=sys.stderr)

    try:
        print("[VOICE_TO_TEXT] Starting transcription", file=sys.stderr)
        segments, _ = whisper_model.transcribe(save_path)
        text = ''.join([s.text for s in segments]).strip()
        print(f"[VOICE_TO_TEXT] Transcription result: {text}", file=sys.stderr)
        return jsonify({"transcription": text}), 200
    except Exception as e:
        import traceback
        print(f"[VOICE_TO_TEXT] Whisper failed: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return jsonify({'error': 'Whisper failed', 'details': str(e)}), 500