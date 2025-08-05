from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(1024))
    first_name = db.Column(db.String(64))
    last_name = db.Column(db.String(64))
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class PdfData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship('User', backref=db.backref('pdfs', lazy=True))
    filename = db.Column(db.String(256), nullable=False)
    summary = db.Column(db.Text(length=4294967295), nullable=True)
    file_type = db.Column(db.String(10), default='pdf')
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    pdf_size = db.Column(db.String(32), nullable=False)
    def __repr__(self):
        return f'<PdfData {self.filename}>'

class ChatHistory(db.Model):
    __tablename__ = 'chat_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    messages = db.Column(db.Text, nullable=False) 
    model = db.Column(db.String(64), nullable=True)

class Answershare(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(256), unique= True, default=lambda:str(uuid.uuid4()))
    answer = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())