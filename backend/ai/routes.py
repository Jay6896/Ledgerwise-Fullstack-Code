from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models import Sale, Expense, BusinessProfile
from .advise import get_nigerian_advice
from .analyst import get_business_analysis
from .chat import get_business_chat_reply
from .nigerian_taxcalc import calculate_tax_and_assess
from .pit import estimate_pit, pit_from_file
import os
import tempfile

ai = Blueprint("ai", __name__)

@ai.route('/insights', methods=['POST'])
@login_required
def insights():
    data = request.get_json() or {}
    period = data.get("period", "month")

    # Build a concise business context
    profile = BusinessProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({"error": "No business profile"}), 400

    sales = Sale.query.filter_by(business_id=profile.id).order_by(Sale.date.desc()).all()
    expenses = Expense.query.filter_by(business_id=profile.id).order_by(Expense.date.desc()).all()

    total_sales = float(sum(s.amount or 0 for s in sales))
    total_expenses = float(sum(e.amount or 0 for e in expenses))

    # Create a user_query for the advisor
    recent_sales_str = ", ".join([f"{s.name}:{float(s.amount or 0):,.0f}" for s in sales[:10]])
    user_query = (
        f"Business: {profile.name}\n"
        f"Industry: {profile.industry or 'N/A'}\n"
        f"Period: {period}\n"
        f"Total sales: {total_sales:,.0f}\n"
        f"Total expenses: {total_expenses:,.0f}\n"
        f"Recent sales: {recent_sales_str}"
    )

    # Call AI advisor and map to frontend shape
    advice_object = get_nigerian_advice(user_query)
    steps = advice_object.actionable_steps or []
    if not steps:
        # Provide default Nigeria-specific actionable items when AI is unavailable/empty
        steps = [
            "Collect 80% of receivables in 30 days via weekly reminders.",
            "Negotiate 30–45 day supplier terms to ease cash pressure.",
            "Trim top-3 expense lines by 5% within 60 days.",
        ]
    strategic = {
        "summary": advice_object.key_points_summary,
        "recommendations": [
            {"title": f"Step {i+1}", "detail": step} for i, step in enumerate(steps)
        ],
    }
    return jsonify(strategic), 200

@ai.route('/analyze', methods=['POST'])
@login_required
def analyze():
    data = request.get_json() or {}
    period = data.get("period", "month")

    profile = BusinessProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({"error": "No business profile"}), 400

    sales = Sale.query.filter_by(business_id=profile.id).all()
    expenses = Expense.query.filter_by(business_id=profile.id).all()

    # Aggregate simple metrics for KPIs
    total_revenue = float(sum(s.amount or 0 for s in sales))
    total_costs = float(sum(e.amount or 0 for e in expenses))
    net_profit = total_revenue - total_costs

    # Prepare payload for analyst (uses floats)
    user_data = {
        "industry": profile.industry or "N/A",
        "revenue": total_revenue,
        "total_costs": total_costs,
        "bank_balance": 0.0,  # Not tracked; default to 0
        "net_profit": net_profit,
    }

    report = get_business_analysis(user_data)

    # Map to frontend Analysis shape
    # Derive a simple health score heuristic
    margin = (net_profit / total_revenue * 100.0) if total_revenue > 0 else 0.0
    health_score = max(0, min(100, 70 + (margin / 2)))  # lightweight heuristic

    actions = report.actionable_advice or []
    if not actions:
        actions = [
            "Collect 80% of receivables in 30 days via weekly reminders.",
            "Cut variable costs by 5% in 60 days via supplier renegotiation.",
            "Raise prices 2–3% on top sellers next month to defend margin.",
        ]

    analysis = {
        "health_score": round(health_score),
        "kpis": [
            {"name": "Revenue", "value": total_revenue, "unit": "NGN"},
            {"name": "Expenses", "value": total_costs, "unit": "NGN"},
            {"name": "Cash In", "value": total_revenue, "unit": "NGN"},
            {"name": "Cash Out", "value": total_costs, "unit": "NGN"},
        ],
        "insights": [
            report.profitability_analysis,
            report.business_efficiency_analysis,
            report.growth_and_future_projection,
        ],
        # Extra optional fields
        "profitability": report.profitability_analysis,
        "efficiency": report.business_efficiency_analysis,
        "growth_projection": report.growth_and_future_projection,
        "valuation": report.estimated_business_valuation,
        "loan": report.loan_eligibility_assessment,
        "actions": actions,
    }
    return jsonify(analysis), 200

@ai.route('/tax', methods=['GET'])
@login_required
def tax():
    profile = BusinessProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({"error": "No business profile"}), 400

    total_sales = float(db.session.query(db.func.coalesce(db.func.sum(Sale.amount), 0)).filter_by(business_id=profile.id).scalar() or 0)
    total_expenses = float(db.session.query(db.func.coalesce(db.func.sum(Expense.amount), 0)).filter_by(business_id=profile.id).scalar() or 0)

    # Approximate VAT figures for demo
    vat_collected = total_sales * 0.075
    vat_paid = total_expenses * 0.05
    net_vat = max(0.0, vat_collected - vat_paid)

    annualized_revenue = total_sales  # if your data is all-time, this is a rough demo
    vat_threshold_nearing = annualized_revenue >= (25_000_000 * 0.6) and annualized_revenue < 25_000_000
    cit_exempt = annualized_revenue <= 100_000_000

    summary = {
        "vat_threshold_nearing": bool(vat_threshold_nearing),
        "vat_collected": float(vat_collected),
        "vat_paid": float(vat_paid),
        "net_vat": float(net_vat),
        "cit_exempt": bool(cit_exempt),
        "cac_due_days": 30,
    }
    return jsonify(summary), 200


@ai.route('/tax/upload', methods=['POST'])
@login_required
def tax_upload():
    """Accept a CSV/XLSX file and compute tax using nigerian_taxcalc."""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    business_size = (request.form.get('business_size') or 'MEDIUM').upper()
    if business_size not in ("MEDIUM", "LARGE"):
        return jsonify({"error": "business_size must be MEDIUM or LARGE"}), 400

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename or 'data')[1]) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        result = calculate_tax_and_assess(business_size, tmp_path)
        # Ensure cleanup
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        return jsonify(result.model_dump()), 200
    except Exception as e:
        return jsonify({"error": f"Tax analysis failed: {e}"}), 500

@ai.route('/chat', methods=['POST'])
@login_required
def chat():
    data = request.get_json() or {}
    history = data.get("history", [])  # [{role, content}]
    user_message = data.get("message", "")

    profile = BusinessProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({"error": "No business profile"}), 400

    # Build lightweight context from recent sales/expenses
    sales = Sale.query.filter_by(business_id=profile.id).order_by(Sale.date.desc()).limit(10).all()
    expenses = Expense.query.filter_by(business_id=profile.id).order_by(Expense.date.desc()).limit(10).all()
    total_sales = float(sum(s.amount or 0 for s in sales))
    total_expenses = float(sum(e.amount or 0 for e in expenses))
    context = (
        f"Business: {profile.name}\nIndustry: {profile.industry or 'N/A'}\n"
        f"Recent Sales: {', '.join([f'{s.name}:{float(s.amount or 0):,.0f}' for s in sales])}\n"
        f"Recent Expenses: {', '.join([f'{e.description}:{float(e.amount or 0):,.0f}' for e in expenses])}\n"
        f"Totals -> Sales: {total_sales:,.0f}, Expenses: {total_expenses:,.0f}"
    )

    result = get_business_chat_reply(history, user_message, context)
    return jsonify({"reply": result.reply}), 200

@ai.route('/pit', methods=['GET'])
@login_required
def pit_quick():
    profile = BusinessProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({"error": "No business profile"}), 400
    # Use sums as annualized approximation until a date filter exists
    total_sales = float(db.session.query(db.func.coalesce(db.func.sum(Sale.amount), 0)).filter_by(business_id=profile.id).scalar() or 0)
    total_expenses = float(db.session.query(db.func.coalesce(db.func.sum(Expense.amount), 0)).filter_by(business_id=profile.id).scalar() or 0)
    est = estimate_pit(total_sales, total_expenses)
    return jsonify(est.model_dump()), 200
