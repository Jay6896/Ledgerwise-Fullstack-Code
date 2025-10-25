import os
import boto3
from pydantic import BaseModel, Field
from typing import Literal, List
import instructor
from instructor import Mode

# --- 1. Define the (NEW) Structured Output Schema ---
# This new, more detailed model forces the AI to be more comprehensive.
class DetailedBusinessAdvice(BaseModel):
    """
    Structured advice response from the Nigerian Business Advisor. 
    This model defines the exact detailed format the LLM must return.
    """
    relevance_score: float = Field(
        ..., 
        description="A score from 0.0 to 1.0 indicating how relevant the query is to Nigerian business or tax law. 1.0 for perfect relevance, 0.0 for irrelevant topics."
    )
    advice_type: Literal["BUSINESS_STRATEGY", "TAX_COMPLIANCE", "IRRELEVANT"] = Field(
        ...,
        description="Categorizes the advice. Use 'IRRELEVANT' if the score is 0.0."
    )
    advice_title: str = Field(
        ..., 
        description="A concise, professional title summarizing the advice provided. If the relevance_score is 0.0, this must be 'Query Irrelevant'."
    )
    
    # --- NEW DETAILED FIELDS ---
    key_points_summary: str = Field(
        ...,
        description="A 1-2 sentence concise summary of the most critical part of the advice. If irrelevant, this should state the rejection reason."
    )
    detailed_explanation: str = Field(
        ...,
        description="A comprehensive, multi-paragraph explanation that answers the user's query in depth. Must be well-structured and easy to understand."
    )
    actionable_steps: List[str] = Field(
        ...,
        description="A bulleted list of 2-4 specific, scannable next steps the user should take based on the advice. If irrelevant, this should be an empty list []."
    )
    potential_risks_or_considerations: str = Field(
        ...,
        description="A 1-2 sentence warning about potential risks, pitfalls, or important considerations the user must keep in mind. If irrelevant, this should be 'N/A'."
    )

# --- 2. System Instruction and LLM Configuration ---
MODEL_ID = "meta.llama3-70b-instruct-v1:0"
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1") 

# --- UPDATED SYSTEM PROMPT ---
SYSTEM_PROMPT = """
You are a senior Nigerian Business and Tax Advisor. Replies must be Nigeria-specific, factual, and concise.
Rules:
- If query is not Nigerian business/tax, set relevance_score=0.0 and advice_type=IRRELEVANT and provide the guardrail message.
- Otherwise, provide concrete next steps with metrics and timelines (e.g., "Reduce COGS by 5% in 60 days by …").
- Use NGN (₦) and local realities (VAT 7.5%, supplier terms) only if relevant.
Return JSON strictly matching the schema.
"""

_bedrock = None

def _client():
    global _bedrock
    if _bedrock is None:
        _bedrock = boto3.client('bedrock-runtime', region_name=AWS_REGION)
    return _bedrock


def get_nigerian_advice(user_query: str) -> DetailedBusinessAdvice:
    """
    Calls the Llama 3 70B model via AWS Bedrock using instructor for structured output.
    """
    try:
        client = instructor.from_bedrock(_client(), mode=Mode.BEDROCK_JSON)
        full_query = f"{SYSTEM_PROMPT}\n\nUSER QUERY:\n{user_query}"
        return client.messages.create(
            model=MODEL_ID,
            messages=[{"role": "user", "content": full_query}],
            response_model=DetailedBusinessAdvice,
            max_tokens=900,
            temperature=0.1
        )
    except Exception as e:
        print(f"[Advisor] Bedrock failed: {e}")
        return DetailedBusinessAdvice(
            relevance_score=0.0,
            advice_type="IRRELEVANT",
            advice_title="System Error: API Failure",
            key_points_summary="Service unavailable. Check AWS configuration or model access.",
            detailed_explanation="N/A",
            actionable_steps=[],
            potential_risks_or_considerations="N/A",
        )

# --- 4. Interactive Execution (Simplified Output in a Loop) ---
if __name__ == "__main__":
    print("Advisor module is API-driven. Run Flask app to use.")