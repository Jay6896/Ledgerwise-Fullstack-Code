from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db, bcrypt, login_manager
from sqlalchemy import inspect, text
from dotenv import load_dotenv
import os

def create_app():
    # Load .env before creating app/config so env vars are available
    load_dotenv()

    app = Flask(__name__)
    app.config.from_object(Config)

    # Update CORS configuration
    CORS(app, supports_credentials=True, resources={
        r"/*": {
            "origins": [
                "https://ledgerwise-chi.vercel.app/",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:8080",
                "http://127.0.0.1:8080",
            ],  # Vite/other dev origins
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        }
    })

    # Ensure DB is reachable; if not, fall back to SQLite for local dev
    try:
        from sqlalchemy import create_engine
        test_engine = create_engine(app.config.get("SQLALCHEMY_DATABASE_URI"))
        with test_engine.connect() as _:
            pass
    except Exception:
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)

    # Import and register the Blueprints
    from auth.routes import auth as auth_blueprint
    from business.routes import business as business_blueprint
    from ai.routes import ai as ai_blueprint
    app.register_blueprint(auth_blueprint, url_prefix="/auth")
    app.register_blueprint(business_blueprint, url_prefix="/business")
    app.register_blueprint(ai_blueprint, url_prefix="/ai")

    def ensure_schema():
        """Best-effort schema guard for existing DBs without migrations.
        Adds missing columns used by the app and removes deprecated ones.
        """
        inspector = inspect(db.engine)
        with db.engine.begin() as conn:
            # Expense: quantity, unit_price
            try:
                expense_cols = {c['name'] for c in inspector.get_columns('expense')}
                if 'quantity' not in expense_cols:
                    conn.execute(text('ALTER TABLE expense ADD COLUMN quantity INTEGER DEFAULT 1'))
                if 'unit_price' not in expense_cols:
                    conn.execute(text('ALTER TABLE expense ADD COLUMN unit_price DOUBLE PRECISION'))
            except Exception:
                pass
            # Sale: quantity, unit_price
            try:
                sale_cols = {c['name'] for c in inspector.get_columns('sale')}
                if 'quantity' not in sale_cols:
                    conn.execute(text('ALTER TABLE sale ADD COLUMN quantity INTEGER DEFAULT 1'))
                if 'unit_price' not in sale_cols:
                    conn.execute(text('ALTER TABLE sale ADD COLUMN unit_price DOUBLE PRECISION'))
                # Drop legacy column sale_type if present
                if 'sale_type' in sale_cols:
                    try:
                        conn.execute(text('ALTER TABLE sale DROP COLUMN sale_type'))
                    except Exception:
                        # Fallback: relax NOT NULL and set default if drop not supported (e.g. older SQLite)
                        try:
                            conn.execute(text("ALTER TABLE sale ALTER COLUMN sale_type DROP NOT NULL"))
                            conn.execute(text("ALTER TABLE sale ALTER COLUMN sale_type SET DEFAULT 'fixed'"))
                        except Exception:
                            pass
            except Exception:
                pass

    with app.app_context():
        db.create_all()
        ensure_schema()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
