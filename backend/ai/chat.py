import os
import boto3
from pydantic import BaseModel, Field
import instructor
from instructor import Mode
from typing import List
import re

MODEL_ID = "meta.llama3-70b-instruct-v1:0"
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

class ChatReply(BaseModel):
    reply: str = Field(..., description="Short, actionable reply in plain English.")

_SYSTEM_PROMPT = (
    "You are a Nigerian Personal Income Tax (PIT) and small business advisor for sole proprietors.\n"
    "Be concise, accurate, and Nigeria-specific. Use NGN (₦) and percentages.\n"
    "Provide numbered steps with metrics/timeframes when giving advice."
)

_bedrock = None

def _client():
    global _bedrock
    if _bedrock is None:
        _bedrock = boto3.client('bedrock-runtime', region_name=AWS_REGION)
    return _bedrock


def get_business_chat_reply(history: List[dict], user_message: str, context: str = "") -> ChatReply:
    """
    Generate a chat response using Bedrock + instructor with a simple schema.
    history: list of { role: 'user'|'assistant', content: str }
    user_message: latest user message
    context: optional business context string to prepend
    """
    try:
        client = instructor.from_bedrock(_client(), mode=Mode.BEDROCK_JSON)
        prompt = (
            f"{_SYSTEM_PROMPT}\n\nContext:\n{context}\n\n"
            f"History: {history}\n\nQuestion: {user_message}"
        )
        result = client.messages.create(
            model=MODEL_ID,
            messages=[{"role": "user", "content": prompt}],
            response_model=ChatReply,
            max_tokens=500,
            temperature=0.1
        )
        return result
    except Exception as e:
        print(f"[AI Chat] Bedrock invocation failed: {e}")
        # Basic deterministic fallback using context totals
        fallback_text = (
            "I couldn't reach the AI. Based on your recent totals, tighten expenses and keep records for PIT. "
            "Aim to keep net margin above 15%. If profit grows, set aside 10–20% monthly for PIT."
        )
        return ChatReply(reply=fallback_text)
