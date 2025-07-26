from flask import Blueprint, request, jsonify
from . import db
from .models import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, create_refresh_token
import re
auth_bp = Blueprint('auth', __name__)
def is_strong_password(password):
    # At least 8 chars, one uppercase, one special char, one number
    if (len(password) < 8 or
        not re.search(r'[A-Z]', password) or
        not re.search(r'[^A-Za-z0-9]', password) or
        not re.search(r'\d', password)):
        return False
    return True
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    confirm_password = data.get('confirm_password')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    if not all([username, password, confirm_password, first_name, last_name, email]):
        return jsonify({'error': 'All fields are required'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409
    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400
    if not is_strong_password(password):
        return jsonify({'error': 'Password must be at least 8 characters long, contain one uppercase letter, one special character, and one number.'}), 400
    new_user = User(username=username, email=email, first_name=first_name, last_name=last_name)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        # Convert user.id to string for JWT identity
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        return jsonify({
            'user':{
            'id': user.id,
            'username':user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            },
            'access_token': access_token,
            'refresh_token': refresh_token
            }), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    # Identity is already a string from the token, but ensure it stays a string
    new_access_token = create_access_token(identity=str(identity))
    return jsonify({'access_token': new_access_token}), 200






