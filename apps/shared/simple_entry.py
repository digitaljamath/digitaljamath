"""
Basira Simple Entry Assistant
Parses natural language transaction descriptions into structured double-entry data.
"""

import os
import json
import re
import requests
from decimal import Decimal
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from apps.jamath.models import Ledger


SIMPLE_ENTRY_PROMPT = """You are a financial assistant that converts natural language transaction descriptions into structured accounting entries.

## CURRENT CONTEXT
Date: {current_date}
User: {user_name}

## AVAILABLE ACCOUNTS
{available_accounts}

## TASK
Parse the user's transaction description and output a JSON object with:
- voucher_type: "RECEIPT" (income/donation) or "PAYMENT" (expense)
- amount: numeric amount (extract from text)
- account_name: best matching account from the list above
- donor_or_vendor: person/entity name if mentioned
- narration: professional narration for the transaction
- confidence: "high" or "low" based on clarity of input

## EXAMPLES

Input: "Chanda by Rahman 500"
Output: {{"voucher_type": "RECEIPT", "amount": 500, "account_name": "Donation - General", "donor_or_vendor": "Rahman", "narration": "Chanda received from Rahman", "confidence": "high"}}

Input: "Friday collection 2500"
Output: {{"voucher_type": "RECEIPT", "amount": 2500, "account_name": "Donation - General", "donor_or_vendor": "", "narration": "Friday Juma collection", "confidence": "high"}}

Input: "Paid electrician 800 for fan repair"
Output: {{"voucher_type": "PAYMENT", "amount": 800, "account_name": "Repairs & Maintenance", "donor_or_vendor": "Electrician", "narration": "Payment for fan repair work", "confidence": "high"}}

Input: "zakat 5000 ahmed"
Output: {{"voucher_type": "RECEIPT", "amount": 5000, "account_name": "Donation - Zakat", "donor_or_vendor": "Ahmed", "narration": "Zakat received from Ahmed", "confidence": "high"}}

## RULES
1. ONLY output the JSON object, nothing else
2. If amount is unclear, set confidence to "low" and amount to 0
3. Match account_name to the closest match from available accounts
4. Generate professional narration even from informal input
"""


class SimpleEntryView(APIView):
    """Parse natural language into structured accounting entry."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        text = request.data.get('text', '').strip()
        
        if not text:
            return Response({'error': 'Text is required'}, status=400)
        
        # Get available accounts for context
        ledgers = Ledger.objects.all().values_list('name', flat=True)
        available_accounts = "\n".join([f"- {name}" for name in ledgers[:30]])  # Limit for prompt size
        
        # Get API key
        from apps.shared.models import SystemConfig
        config = SystemConfig.get_solo()
        api_key = config.openrouter_api_key or os.environ.get('OPENROUTER_API_KEY')
        
        if not api_key:
            # Fallback: simple rule-based parsing
            return self._fallback_parse(text)
        
        # Build prompt
        current_date = timezone.now().strftime('%A, %d %B %Y')
        system_prompt = SIMPLE_ENTRY_PROMPT.format(
            current_date=current_date,
            user_name=request.user.get_full_name() or request.user.username,
            available_accounts=available_accounts
        )
        
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://digitaljamath.com",
                    "X-Title": "DigitalJamath - Simple Entry"
                },
                json={
                    "model": "meta-llama/llama-3.2-3b-instruct:free",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text}
                    ],
                    "max_tokens": 300,
                    "temperature": 0.1  # Low temperature for structured output
                },
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data['choices'][0]['message']['content']
                
                # Parse JSON from response
                try:
                    # Extract JSON from response (handle markdown code blocks)
                    json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group())
                        
                        # Match account to actual ledger
                        matched_ledger = self._match_ledger(parsed.get('account_name', ''))
                        if matched_ledger:
                            parsed['ledger_id'] = matched_ledger.id
                            parsed['account_name'] = matched_ledger.name
                        
                        return Response({
                            'success': True,
                            'parsed': parsed,
                            'original_text': text
                        })
                    else:
                        return self._fallback_parse(text)
                except json.JSONDecodeError:
                    return self._fallback_parse(text)
            else:
                return self._fallback_parse(text)
                
        except Exception as e:
            return self._fallback_parse(text)
    
    def _fallback_parse(self, text):
        """Simple rule-based parsing when AI is unavailable."""
        text_lower = text.lower()
        
        # Extract amount (look for numbers)
        amount_match = re.search(r'(\d+(?:,\d+)*(?:\.\d+)?)', text.replace(',', ''))
        amount = float(amount_match.group(1)) if amount_match else 0
        
        # Determine voucher type
        payment_keywords = ['paid', 'bought', 'purchased', 'expense', 'bill']
        is_payment = any(kw in text_lower for kw in payment_keywords)
        voucher_type = 'PAYMENT' if is_payment else 'RECEIPT'
        
        # Determine account
        if 'zakat' in text_lower:
            account_name = 'Donation - Zakat'
        elif 'sadaqah' in text_lower or 'sadqa' in text_lower:
            account_name = 'Donation - Sadaqah'
        elif 'chanda' in text_lower or 'donation' in text_lower:
            account_name = 'Donation - General'
        elif 'electricity' in text_lower or 'electric' in text_lower:
            account_name = 'Electricity'
        elif 'repair' in text_lower or 'maintenance' in text_lower:
            account_name = 'Repairs & Maintenance'
        else:
            account_name = 'Donation - General' if voucher_type == 'RECEIPT' else 'Miscellaneous Expense'
        
        # Match to actual ledger
        matched_ledger = self._match_ledger(account_name)
        
        return Response({
            'success': True,
            'parsed': {
                'voucher_type': voucher_type,
                'amount': amount,
                'account_name': matched_ledger.name if matched_ledger else account_name,
                'ledger_id': matched_ledger.id if matched_ledger else None,
                'donor_or_vendor': '',
                'narration': text.title(),
                'confidence': 'low'
            },
            'original_text': text,
            'fallback': True
        })
    
    def _match_ledger(self, account_name):
        """Find best matching ledger by name."""
        if not account_name:
            return None
        
        # Try exact match first
        ledger = Ledger.objects.filter(name__iexact=account_name).first()
        if ledger:
            return ledger
        
        # Try contains match
        ledger = Ledger.objects.filter(name__icontains=account_name.split()[0]).first()
        if ledger:
            return ledger
        
        # Try common mappings
        mappings = {
            'donation': 'Donation - General',
            'zakat': 'Donation - Zakat',
            'sadaqah': 'Donation - Sadaqah',
            'electricity': 'Electricity',
            'repair': 'Repairs & Maintenance',
            'salary': 'Salaries',
        }
        
        for key, mapped_name in mappings.items():
            if key in account_name.lower():
                return Ledger.objects.filter(name__icontains=mapped_name.split()[0]).first()
        
        return None
