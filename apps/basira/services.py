import os
import httpx
import json
from pydantic import BaseModel, Field
from typing import Optional, List
from django.conf import settings

# -- Pydantic Models --

class AuditResult(BaseModel):
    is_suspicious: bool = Field(..., description="True if the transaction looks suspicious or violates rules.")
    risk_level: str = Field(..., description="LOW, MEDIUM, or HIGH")
    reason: str = Field(..., description="Explanation of why it is suspicious.")
    suggested_action: Optional[str] = Field(None, description="Recommended action for the admin.")

class TransactionData(BaseModel):
    id: int
    amount: float
    description: str
    fund_category: str
    is_expense: bool

# -- Service Logic --

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

async def audit_transaction(transaction_data: dict) -> AuditResult:
    """
    Sends transaction data to OpenRouter to check for anomalies or fund mixing.
    """
    
    # Validate input
    try:
        data = TransactionData(**transaction_data)
    except Exception as e:
        return AuditResult(is_suspicious=True, risk_level="HIGH", reason=f"Invalid Data Format: {str(e)}")

    prompt = f"""
    You are an Audit Guard for a Masjid ERP system. 
    Analyze the following transaction for compliance with restricted fund rules (e.g. Zakat cannot be used for operational costs).
    
    Transaction:
    - Amount: {data.amount}
    - Description: {data.description}
    - Fund Category: {data.fund_category}
    - Type: {"Expense" if data.is_expense else "Income"}
    
    Rules:
    1. Zakat/Sadaqah must NOT be used for electricity, salaries, or construction unless specified.
    2. Large expenses with vague descriptions (e.g. "Misc") are suspicious.
    
    Return JSON format only matching this schema:
    {{
        "is_suspicious": boolean,
        "risk_level": "LOW" | "MEDIUM" | "HIGH",
        "reason": "string",
        "suggested_action": "string"
    }}
    """

    # Fetch API Key from SystemConfig (DB) or Fallback to Env
    from apps.shared.models import SystemConfig
    config = SystemConfig.get_solo()
    api_key = config.openrouter_api_key or OPENROUTER_API_KEY
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://project-mizan.org", 
    }

    payload = {
        "model": "google/gemini-2.0-flash-exp:free",
        "messages": [
            {"role": "system", "content": "You are a strict financial auditor AI. Output valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"}
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload, timeout=10.0)
            response.raise_for_status()
            result_json = response.json()
            
            # Extract content (OpenRouter structure)
            content_str = result_json['choices'][0]['message']['content']
            
            # Clean and parse JSON
            content_dict = json.loads(content_str)
            
            return AuditResult(**content_dict)
            
        except Exception as e:
            # Fail safe: Mark as warning if AI fails
            return AuditResult(
                is_suspicious=False, 
                risk_level="LOW", 
                reason=f"AI Audit Failed: {str(e)}", 
                suggested_action="Manual Review"
            )
