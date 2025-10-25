import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Cookies: use secure cross-site settings in production
    ENV = os.getenv('FLASK_ENV', os.getenv('ENV', 'development'))
    IS_PROD = os.getenv('RENDER') or os.getenv('RAILWAY_STATIC_URL') or os.getenv('VERCEL') or ENV == 'production'
    SESSION_COOKIE_SAMESITE = 'None' if IS_PROD else 'Lax'
    SESSION_COOKIE_SECURE = True if IS_PROD else False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }