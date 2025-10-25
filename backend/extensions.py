from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager


db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()


@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))


login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'


# Return JSON 401 for API instead of redirecting to the login page
@login_manager.unauthorized_handler
def unauthorized():
    from flask import jsonify
    return jsonify({"error": "Unauthorized"}), 401
