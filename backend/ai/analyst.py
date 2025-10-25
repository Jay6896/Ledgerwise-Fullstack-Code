import os
import boto3
from pydantic import BaseModel, Field
from typing import List
import instructor
from instructor import Mode

# --- Structured Output Schema ---
class BusinessAnalysisReport(BaseModel):
    """A concise Nigerian MSME analysis and advisory report."""
    profitability_analysis: str = Field(
        ..., description="1-2 short paragraphs on net profit and margin (Net Profit / Revenue)."
    )
    growth_and_future_projection: str = Field(
        ..., description="1 short paragraph on growth potential; state if no history exists."
    )
    business_efficiency_analysis: str = Field(
        ..., description="1 short paragraph on Cost-to-Revenue ratio and implications."
    )
    estimated_business_valuation: str = Field(
        ..., description="Very high-level estimate (e.g., 2x annual net profit) with disclaimer."
    )
    tax_compliance_overview: str = Field(
        ..., description="High-level note on VAT 7.5%, CIT/TET context based on size; no calculations."
    )
    loan_eligibility_assessment: str = Field(
        ..., description="Brief assessment based on profitability and liquidity; non-committal."
    )
    actionable_advice: List[str] = Field(
        ...,
        description="3-5 Nigeria-specific bullets with measurable target and timeframe."
    )

# --- 2. System Instruction and LLM Configuration ---
MODEL_ID = "meta.llama3-70b-instruct-v1:0"
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

SYSTEM_PROMPT = (
    "You are an expert Nigerian Business Analyst for MSMEs. Be numeric, concise, and Nigeria-specific.\n"
    "Guidelines:\n"
    "- Use NGN and percentages.\n"
    "- Mention Nigerian realities (VAT 7.5%, rent, supplier terms) only if relevant.\n"
    "- Actionable advice: 3-5 bullets, each starting with a verb and including a metric/goal + timeframe.\n"
    "- Do not invent history; say 'insufficient history' if missing.\n"
    "- Keep total output under ~1200 characters for speed.\n"
    "Return JSON matching the schema exactly."
)

_bedrock_client = None

def _get_bedrock_client():
    global _bedrock_client
    if _bedrock_client is None:
        _bedrock_client = boto3.client("bedrock-runtime", region_name=AWS_REGION)
    return _bedrock_client


def get_business_analysis(user_data: dict) -> BusinessAnalysisReport:
    """Generate a structured business analysis via Bedrock with Instructor."""
    try:
        bedrock_client = _get_bedrock_client()
        client = instructor.from_bedrock(bedrock_client, mode=Mode.BEDROCK_JSON)

        data_string = (
            f"Monthly Revenue: {user_data.get('revenue', 0):,.2f} NGN\n"
            f"Total Costs: {user_data.get('total_costs', 0):,.2f} NGN\n"
            f"Net Profit: {user_data.get('net_profit', 0):,.2f} NGN\n"
            f"Bank Balance: {user_data.get('bank_balance', 0):,.2f} NGN\n"
            f"Industry: {user_data.get('industry', 'N/A')}"
        )
        full_query = f"{SYSTEM_PROMPT}\n\nContext:\n{data_string}"
        report_object = client.messages.create(
            model=MODEL_ID,
            messages=[{"role": "user", "content": full_query}],
            response_model=BusinessAnalysisReport,
            max_tokens=650,
            temperature=0.05
        )
        return report_object
    except Exception as e:
        print(f"[Analyst] Bedrock failed: {e}")
        # Fallback: compute a minimal report from numeric inputs
        revenue = float(user_data.get('revenue', 0) or 0)
        total_costs = float(user_data.get('total_costs', 0) or 0)
        net_profit = float(user_data.get('net_profit', revenue - total_costs))
        margin = (net_profit / revenue * 100) if revenue > 0 else 0.0
        est_valuation = f"Approx. NGN {int(max(0, net_profit) * 12 * 2):,} (2x annual net profit)"
        return BusinessAnalysisReport(
            profitability_analysis=f"Net profit NGN {net_profit:,.2f} (margin {margin:.1f}%).",
            growth_and_future_projection="Insufficient history for projections; provide monthly series.",
            business_efficiency_analysis=f"Cost-to-revenue ratio {(total_costs / revenue * 100) if revenue>0 else 0:.1f}%.",
            estimated_business_valuation=est_valuation,
            tax_compliance_overview="Maintain VAT (7.5%) records; CIT/TET depend on company size.",
            loan_eligibility_assessment="Positive profit improves odds; maintain 3-6 months statements.",
            actionable_advice=[
                "Collect 80% of receivables in 30 days via weekly reminders.",
                "Cut variable costs by 5% in 60 days via supplier renegotiation.",
                "Raise prices 2-3% on top sellers next month to defend margin.",
            ]
        )

if __name__ == "__main__":
    print("Analyst module is API-driven. Run Flask app to use.")