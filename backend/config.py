import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY') or 'change-this-secret-in-prod'
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Use Lax for non-HTTPS local dev, but None/Secure for prod
    IS_PROD = os.getenv('RENDER') or os.getenv('VERCEL')
    SESSION_COOKIE_SAMESITE = 'None' if IS_PROD else 'Lax'
    SESSION_COOKIE_SECURE = True if IS_PROD else False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_PATH = '/'

    REMEMBER_COOKIE_SAMESITE = 'None' if IS_PROD else 'Lax'
    REMEMBER_COOKIE_SECURE = True if IS_PROD else False
    REMEMBER_COOKIE_HTTPONLY = True

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }