from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import date
from extensions import db
from models import Sale, Expense, BusinessProfile
import io
import pandas as pd
from werkzeug.utils import secure_filename

business = Blueprint("business", __name__)

ALLOWED_EXTENSIONS = {"csv", "xls", "xlsx"}


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@business.route('/dashboard', methods=['GET'])
@login_required
def dashboard_data():
    profile = BusinessProfile.query.filter_by(user_id=current_user.id).first()
    total_sales = db.session.query(db.func.coalesce(db.func.sum(Sale.amount), 0)).filter_by(business_id=profile.id).scalar() if profile else 0
    total_expenses = db.session.query(db.func.coalesce(db.func.sum(Expense.amount), 0)).filter_by(business_id=profile.id).scalar() if profile else 0
    recent_sales = []
    top_selling = []
    if profile:
        recent_sales = [
            {"id": s.id, "name": s.name, "amount": s.amount}
            for s in Sale.query.filter_by(business_id=profile.id).order_by(Sale.id.desc()).limit(5)
        ]
        # Group sales by item name to compute top selling items
        total_amount = db.func.coalesce(db.func.sum(Sale.amount), 0).label('total_amount')
        units = db.func.coalesce(db.func.sum(Sale.quantity), 0).label('units')
        grouped = (
            db.session.query(
                Sale.name.label('name'),
                total_amount,
                units,
            )
            .filter(Sale.business_id == profile.id)
            .group_by(Sale.name)
            .order_by(total_amount.desc())
            .limit(5)
            .all()
        )
        top_selling = [
            {
                "name": row.name or "Sale",
                "sales": float(row.total_amount or 0),
                "units": int(row.units or 0),
            }
            for row in grouped
        ]
    return jsonify({
        "total_revenue": float(total_sales) if total_sales else 0,
        "total_expenses": float(total_expenses) if total_expenses else 0,
        "recent_sales": recent_sales,
        "top_selling": top_selling,
    }), 200


@business.route('/sales', methods=['GET'])
@login_required
def get_sales():
    profile = BusinessProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify([])
    sales = Sale.query.filter_by(business_id=profile.id).all()
    return jsonify([
        {
            "id": s.id,
            "name": s.name,
            "amount": s.amount,
            "date": s.date.isoformat() if s.date else None,
            "description": s.description,
            "quantity": s.quantity,
            "unit_price": s.unit_price,
        }
        for s in sales
    ]), 200


@business.route('/sales', methods=['POST'])
@login_required
def add_sale():
    profile = BusinessProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({"error": "No business profile"}), 400
    data = request.get_json() or {}

    qty = int(data.get('quantity') or 1)
    total = data.get('totalamount', data.get('amount'))
    unit_price = data.get('unit_price')

    # derive totals if needed
    if total is None and unit_price is not None:
        total = float(unit_price) * qty
    if unit_price is None and total is not None and qty:
        unit_price = float(total) / qty

    sale = Sale(
        name=data.get('name', 'Sale'),
        amount=float(total or 0),
        date=date.fromisoformat(data['date']) if data.get('date') else date.today(),
        description=data.get('description'),
        quantity=qty,
        unit_price=float(unit_price) if unit_price is not None else None,
        business_id=profile.id,
    )
    db.session.add(sale)
    db.session.commit()
    return jsonify({"message": "Sale added", "id": sale.id}), 201


@business.route('/expenses', methods=['GET'])
@login_required
def get_expenses():
    profile = BusinessProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify([])
    expenses = Expense.query.filter_by(business_id=profile.id).all()
    return jsonify([
        {
            "id": e.id,
            "amount": e.amount,
            "date": e.date.isoformat() if e.date else None,
            "description": e.description,
            "quantity": e.quantity,
            "unit_price": e.unit_price,
        }
        for e in expenses
    ]), 200


@business.route('/expenses', methods=['POST'])
@login_required
def add_expense():
    profile = BusinessProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({"error": "No business profile"}), 400
    data = request.get_json() or {}

    qty = int(data.get('quantity') or 1)
    total = data.get('totalamount', data.get('amount'))
    unit_price = data.get('unit_price')

    if total is None and unit_price is not None:
        total = float(unit_price) * qty
    if unit_price is None and total is not None and qty:
        unit_price = float(total) / qty

    expense = Expense(
        amount=float(total or 0),
        date=date.fromisoformat(data['date']) if data.get('date') else date.today(),
        description=data.get('description'),
        quantity=qty,
        unit_price=float(unit_price) if unit_price is not None else None,
        business_id=profile.id,
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify({"message": "Expense added", "id": expense.id}), 201


@business.route('/import', methods=['POST'])
@login_required
def import_catalog():
    """Upload CSV or Excel with columns: name, category(sale/expense), amount, date, quantity, totalamount"""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if not _allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    content = file.read()

    try:
        ext = filename.rsplit('.', 1)[1].lower()
        if ext == 'csv':
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        return jsonify({"error": f"Could not read file: {e}"}), 400

    # Normalize headers
    df.columns = [str(c).strip().lower() for c in df.columns]

    required = {"name", "category", "amount", "date", "quantity", "totalamount"}
    missing = required - set(df.columns)
    if missing:
        return jsonify({"error": f"Missing columns: {', '.join(sorted(missing))}"}), 400

    profile = BusinessProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({"error": "No business profile found"}), 400

    created_sales = 0
    created_expenses = 0
    errors = []

    for i, row in df.iterrows():
        try:
            name = str(row.get('name') or '').strip()
            category = str(row.get('category') or '').strip().lower()
            amount_unit = float(row.get('amount') or 0)
            qty = int(row.get('quantity') or 1)
            totalamount = row.get('totalamount')
            total = float(totalamount) if pd.notna(totalamount) else amount_unit * qty
            date_val = pd.to_datetime(row.get('date'), errors='coerce')
            dt = date_val.date() if pd.notna(date_val) else None

            if category == 'sale':
                sale = Sale(
                    name=name or 'Sale',
                    amount=total,
                    date=dt,
                    quantity=qty,
                    unit_price=amount_unit if amount_unit else None,
                    business_id=profile.id,
                )
                db.session.add(sale)
                created_sales += 1
            elif category == 'expense':
                expense = Expense(
                    amount=total,
                    date=dt,
                    description=name or 'Expense',
                    quantity=qty,
                    unit_price=amount_unit if amount_unit else None,
                    business_id=profile.id,
                )
                db.session.add(expense)
                created_expenses += 1
            else:
                errors.append({"row": i + 1, "error": f"Unknown category '{category}'"})
        except Exception as e:
            errors.append({"row": i + 1, "error": str(e)})

    db.session.commit()
    return jsonify({
        "message": "Import complete",
        "sales_added": created_sales,
        "expenses_added": created_expenses,
        "errors": errors
    }), 200
