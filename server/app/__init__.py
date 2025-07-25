from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from config import Config



db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    bcrypt.init_app(app)
    
    from .auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    from .pdf import pdf_bp
    app.register_blueprint(pdf_bp, url_prefix='/api/pdf')
    from .routes import qa_bp
    app.register_blueprint(qa_bp, url_prefix='/api/qa')
    
    return app
    
    
    