import os
import boto3
from pydantic import BaseModel, Field
import instructor
from instructor import Mode
from typing import List
import re

MODEL_ID = "meta.llama3-70b-instruct-v1:0"
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

SYSTEM_PROMPT = (
    "You are a helpful Nigerian SME Business AI Assistant. "
    "Answer questions about sales, expenses, profitability, Nigerian taxes (CIT, VAT, TET), and growth strategies. "
    "Keep answers concise and practical. If a question is unrelated to Nigerian business contexts, politely redirect."
)

class ChatReply(BaseModel):
    reply: str = Field(..., description="Assistant reply text")


def _local_fallback_reply(context: str, user_message: str) -> str:
    """Generate a lightweight reply if Bedrock is unavailable."""
    # Try to extract totals from context like: "Totals -> Sales: 1,234,567, Expenses: 890,123"
    sales = expenses = None
    m = re.search(r"Totals\s*->\s*Sales:\s*([\d,\.]+)\s*,\s*Expenses:\s*([\d,\.]+)", context or "")
    if m:
        try:
            sales = float(m.group(1).replace(",", ""))
            expenses = float(m.group(2).replace(",", ""))
        except Exception:
            pass
    if sales is not None and expenses is not None:
        net = sales - expenses
        margin = (net / sales * 100.0) if sales > 0 else 0.0
        tip = (
            "Consider tightening expenses and improving collections." if net < 0 else
            "Good profitability. Reinvest surplus into top-performing items."
        )
        return (
            f"Based on your recent data: Revenue ₦{sales:,.0f}, Expenses ₦{expenses:,.0f}, Net ₦{net:,.0f} (Margin {margin:.1f}%).\n"
            f"Quick tip: {tip}"
        )
    # Generic fallback
    return (
        "I couldn't reach the AI service. Based on your recent activity, keep tracking sales vs expenses and maintain VAT records. "
        "Ensure invoices are collected on time and review top expense categories for savings."
    )


def get_business_chat_reply(history: List[dict], user_message: str, context: str = "") -> ChatReply:
    """
    Generate a chat response using Bedrock + instructor with a simple schema.
    history: list of { role: 'user'|'assistant', content: str }
    user_message: latest user message
    context: optional business context string to prepend
    """
    try:
        bedrock_client = boto3.client(service_name='bedrock-runtime', region_name=AWS_REGION)
        client = instructor.from_bedrock(bedrock_client, mode=Mode.BEDROCK_JSON)

        messages = []
        # Put system guidance and context into an initial user message for max compatibility
        preamble = SYSTEM_PROMPT + (f"\n\nBUSINESS CONTEXT:\n{context}" if context else "")
        messages.append({"role": "user", "content": preamble})

        # Truncate history to last 8 turns
        for h in (history or [])[-8:]:
            role = h.get("role")
            content = h.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        # Latest user message
        if user_message:
            messages.append({"role": "user", "content": user_message})

        result = client.messages.create(
            model=MODEL_ID,
            messages=messages,
            response_model=ChatReply,
            max_tokens=512,
            temperature=0.2,
        )
        return result
    except Exception as e:
        # Log and return a helpful local reply
        print(f"[AI Chat] Bedrock invocation failed: {e}")
        return ChatReply(reply=_local_fallback_reply(context, user_message))
