import os
import json
from django.http import StreamingHttpResponse, JsonResponse
from django.views import View
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
import requests


SYSTEM_PROMPT = """You are Basira (بصيرة - "Insight"), the AI guide for Project Mizan.

**CRITICAL DIRECTIVE:**
You are a SPECIALIZED technical assistant for this specific software application only.
You are NOT a general purpose AI assistant.
You MUST REFUSE to answer any question that is not directly related to:
1. Using the Project Mizan software
2. Masjid/Jamath administration
3. Islamic finance (Zakat/Sadaqah) rules relevant to the bookkeeping

**REFUSAL PROTOCOL:**
If a user asks about politics, celebrities, history, coding, or general knowledge, you MUST reply with this exact phrase:
"I apologize, but I can only assist with Project Mizan features and Masjid management tasks."

**EXAMPLES:**
User: "Who is the Prime Minister?"
Basira: "I apologize, but I can only assist with Project Mizan features and Masjid management tasks."

User: "Write a python script for me."
Basira: "I apologize, but I can only assist with Project Mizan features and Masjid management tasks."

User: "What is the capital of India?"
Basira: "I apologize, but I can only assist with Project Mizan features and Masjid management tasks."

User: "How do I record a donation?"
Basira: "To record a donation, go to **Finance** → **New Entry** → **Receipt**. Select the appropriate income account (e.g., Donation - General) and enter the amount."

## KEY FEATURES DOCUMENTATION
[... Standard documentation follows ...]

### 1. Households (Jamath/Gharane)
- Register families with head of household, address, occupation
- Add family members with relationships (son, daughter, spouse)
- Track membership status and fees

### 2. Baitul Maal (Finance) - Mizan Ledger
- **Receipt Voucher**: Record donations, membership fees
- **Payment Voucher**: Record expenses, bills
- **Journal Entry**: Adjustments and transfers
- **Fund Types**: Zakat, Sadaqah, Construction, General

### 3. Reports
- **Day Book**: Daily transaction list
- **Trial Balance**: Account balances
- **Tally Export**: For auditing

## STYLE GUIDELINES
- Be helpful and concise for relevant queries.
- Use Islamic greetings (Assalamu Alaikum) for opening.
- Use Indian Rupee (₹).
"""


class BasiraGuideView(APIView):
    """AI Guide endpoint using OpenRouter with streaming."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        user_message = request.data.get('message', '')
        conversation_history = request.data.get('history', [])
        stream = request.data.get('stream', True)

        if not user_message:
            return Response({'error': 'Message is required'}, status=400)

        api_key = os.environ.get('OPENROUTER_API_KEY')
        if not api_key:
            return Response({'error': 'API key not configured'}, status=200)

        # Build messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add conversation history (limit to last 5 strictly to keep context focused)
        for msg in conversation_history[-5:]:
            messages.append(msg)
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})

        if stream:
            return self._stream_response(api_key, messages)
        else:
            return self._sync_response(api_key, messages)

    def _stream_response(self, api_key, messages):
        """Stream response using Server-Sent Events."""
        def generate():
            try:
                response = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://project-mizan.com",
                        "X-Title": "Project Mizan - Basira Guide"
                    },
                    json={
                        "model": "meta-llama/llama-3.2-3b-instruct:free",
                        "messages": messages,
                        "max_tokens": 500,
                        "temperature": 0.2, # Strict adherence
                        "stream": True
                    },
                    stream=True,
                    timeout=60
                )

                for line in response.iter_lines():
                    if line:
                        line_text = line.decode('utf-8')
                        if line_text.startswith('data: '):
                            data = line_text[6:]
                            if data == '[DONE]':
                                yield f"data: [DONE]\n\n"
                                break
                            try:
                                chunk = json.loads(data)
                                if 'choices' in chunk and len(chunk['choices']) > 0:
                                    delta = chunk['choices'][0].get('delta', {})
                                    content = delta.get('content', '')
                                    if content:
                                        yield f"data: {json.dumps({'content': content})}\n\n"
                            except json.JSONDecodeError:
                                pass

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        response = StreamingHttpResponse(generate(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

    def _sync_response(self, api_key, messages):
        """Non-streaming response (fallback)."""
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://project-mizan.com",
                    "X-Title": "Project Mizan - Basira Guide"
                },
                json={
                    "model": "meta-llama/llama-3.2-3b-instruct:free",
                    "messages": messages,
                    "max_tokens": 500,
                    "temperature": 0.2
                },
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                assistant_message = data['choices'][0]['message']['content']
                return Response({
                    'response': assistant_message,
                    'model': data.get('model', 'unknown')
                })
            else:
                return Response({
                    'response': "I'm having trouble connecting right now. Please try again in a moment.",
                    'error': f"API error: {response.status_code}"
                }, status=200)

        except Exception as e:
            return Response({'error': str(e)}, status=500)
