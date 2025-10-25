from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from extensions import db, bcrypt
from models import User, BusinessProfile

auth = Blueprint("auth", __name__)

@auth.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    business_name = data.get('businessName')
    industry = data.get('industry')  # optional
    # firstName is accepted but not stored separately; only used if needed later
    _first_name = data.get('firstName')

    if not email or not password or not business_name:
        return jsonify({"error": "All fields are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409
    
    if User.query.filter_by(username=business_name).first():
        return jsonify({"error": "Business name already taken"}), 409

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=business_name, email=email, password=hashed_pw)
    
    db.session.add(new_user)
    db.session.commit()

    new_business = BusinessProfile(user_id=new_user.id, name=business_name, industry=industry)
    db.session.add(new_business)
    db.session.commit()

    login_user(new_user)

    return jsonify({"message": "User registered successfully"}), 201

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password, password):
        login_user(user, remember=data.get('rememberMe'))
        return jsonify({"message": "Login successful", "user": {"id": user.id, "email": user.email, "username": user.username}}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@auth.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

@auth.route('/status', methods=['GET'])
@login_required
def status():
    return jsonify({"user": {"id": current_user.id, "email": current_user.email, "username": current_user.username}}), 200
