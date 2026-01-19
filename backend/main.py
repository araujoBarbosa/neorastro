import os
from fastapi import FastAPI, Request, Header, HTTPException, Depends
from pydantic import BaseModel
import stripe
from twilio.rest import Client
import uvicorn
from datetime import datetime, timedelta
from typing import Optional

# Configuração
app = FastAPI(title="NeoRastro API v2.0")

# Chaves (Em produção, usar variáveis de ambiente)
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY", "sk_test_...")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_...")
TWILIO_SID = os.getenv("TWILIO_SID", "AC...")
TWILIO_TOKEN = os.getenv("TWILIO_TOKEN", "...")
TWILIO_FROM = os.getenv("TWILIO_FROM", "whatsapp:+14155238886")

stripe.api_key = STRIPE_API_KEY
twilio_client = Client(TWILIO_SID, TWILIO_TOKEN)

# --- MODELS ---
class CheckoutRequest(BaseModel):
    user_id: str
    email: str
    plan_id: str # 'price_basic', 'price_pro', etc.

class NotificationRequest(BaseModel):
    user_id: str
    phone: str
    template: str # WELCOME, PAYMENT_REMINDER, etc.
    vars: dict = {}

# --- ENDPOINTS ---

@app.post("/api/checkout")
async def create_checkout_session(data: CheckoutRequest):
    """Cria uma sessão de checkout no Stripe para assinatura recorrente"""
    try:
        # Cria ou busca customer (simplificado)
        customer_list = stripe.Customer.list(email=data.email, limit=1)
        if customer_list.data:
            customer_id = customer_list.data[0].id
        else:
            customer = stripe.Customer.create(email=data.email, metadata={"user_id": data.user_id})
            customer_id = customer.id

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': data.plan_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"https://neorastro.com/dashboard?payment=success",
            cancel_url=f"https://neorastro.com/signup?payment=cancelled",
            metadata={"user_id": data.user_id}
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Recebe eventos do Stripe e atualiza o banco de dados"""
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Lógica de Negócio
    if event['type'] == 'invoice.paid':
        invoice = event['data']['object']
        customer_id = invoice['customer']
        subscription_id = invoice['subscription']
        # TODO: Atualizar Supabase (PaymentStatus = 'ok')
        # update_user_status(customer_id, 'ok')
        # send_whatsapp_notification(user_phone, 'PAYMENT_CONFIRMED')
        print(f"Pagamento confirmado para {customer_id}")

    elif event['type'] == 'invoice.payment_failed':
        invoice = event['data']['object']
        # TODO: Bloquear usuário no Supabase
        print(f"Pagamento falhou para {invoice['customer']}")

    elif event['type'] == 'customer.subscription.deleted':
        # TODO: Cancelar acesso
        pass

    return {"status": "success"}

@app.post("/api/notify")
async def send_notification(data: NotificationRequest):
    """Envia mensagens via Twilio API"""
    message_body = ""
    
    if data.template == "WELCOME":
        message_body = "Olá! Bem-vindo ao NeoRastro. Sua conta foi criada."
    elif data.template == "PAYMENT_CONFIRMED":
        message_body = f"NeoRastro: Pagamento confirmado! Seu plano {data.vars.get('plan')} está ativo."
    
    try:
        msg = twilio_client.messages.create(
            from_=TWILIO_FROM,
            body=message_body,
            to=f"whatsapp:{data.phone}"
        )
        return {"id": msg.sid, "status": "queued"}
    except Exception as e:
        # Fallback to Email (Mock implementation)
        print(f"WhatsApp falhou, enviando email para usuário {data.user_id}...")
        return {"status": "email_sent_fallback"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
