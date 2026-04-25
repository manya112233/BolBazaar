# BolBazaar Google-Stack MVP

BolBazaar is a Meta WhatsApp + Google Cloud marketplace MVP for Google Solution Challenge.

This version is intentionally **Google-native** behind the scenes:
- **Meta WhatsApp Cloud API** for seller messaging
- **Gemini API** for listing extraction and seller insights
- **Google Cloud Speech-to-Text** for voice-note transcription
- **Google Cloud Text-to-Speech** for seller confirmation audio
- **Cloud Firestore** for listings, orders, notifications, and insights
- **Google Maps Geocoding API** for pickup-location normalization
- **FastAPI backend** that can be deployed to **Cloud Run**
- **React + Vite frontend** for the buyer marketplace

## What this MVP demonstrates

1. Seller sends a WhatsApp text or voice note
2. Backend transcribes and extracts a structured produce listing
3. Pickup location is normalized with Google Maps Geocoding
4. Listing is stored in Firestore and shown in the buyer web app
5. Buyer places an order
6. Seller receives a WhatsApp text alert and TTS audio preview is stored
7. Seller can go through a lightweight verification flow during onboarding (farmer / aggregator / FPO / trader + proof capture)
8. Seller accepts the order and BolBazaar generates a Gemini-powered insight

## Project structure

- `backend/`: FastAPI API, Meta webhook handling, Google AI/services integration, Firestore-backed state
- `frontend/`: Buyer-facing marketplace app

## Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
# .venv\Scriptsctivate   # Windows PowerShell
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Recommended environment variables

Fill these in `backend/.env`:

```env
GEMINI_API_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
GCP_PROJECT_ID=...
MAPS_API_KEY=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=...
STORAGE_MODE=firestore
ALLOW_LOCAL_FALLBACK=true
```

## Meta webhook endpoints

- Verification: `GET /api/webhooks/whatsapp/inbound`
- Inbound messages: `POST /api/webhooks/whatsapp/inbound`

Point your Meta app callback URL at:

```text
https://YOUR_BACKEND_DOMAIN/api/webhooks/whatsapp/inbound
```

## Local demo path

Even before connecting Meta, you can demo the flow with:

```bash
curl -X POST http://localhost:8000/api/demo/seed

curl -X POST http://localhost:8000/api/demo/seller-message   -H "Content-Type: application/json"   -d '{
    "seller_id": "919999999999",
    "seller_name": "Shakti FPO",
    "message_text": "Aaj 50 kilo tamatar hai, 28 rupay kilo, Laxmi Nagar pickup",
    "image_url": "https://images.unsplash.com/photo-1546470427-e6ac89a99c4d?auto=format&fit=crop&w=1200&q=80",
    "source_channel": "demo"
  }'
```

Then open the frontend and place an order.

## Deployment shape for judging

- Deploy backend to **Cloud Run**
- Keep Firestore as the source of truth
- Connect Meta webhook to the deployed backend
- Host frontend on Firebase Hosting or any static host

## Notes

- If Firestore credentials are not available locally, the app can fall back to a JSON store for easier development. The intended challenge architecture is still Firestore-first.
- The backend stores generated audio as Base64 preview data. For production voice playback in WhatsApp, add a media upload/send flow.
- The current webhook handler focuses on the first inbound message bundle and supports text, image captions, and audio transcription for MVP demos.

## Seller verification flow added

This version now supports a simple seller-authentication step inside WhatsApp onboarding:

- seller type selection: Farmer / Aggregator / FPO / Trader
- verification method selection based on seller type
- registration / certificate number capture
- proof-image or screenshot capture over WhatsApp
- profile fields stored in Firestore / JSON store

For hackathon demo use, the proof is captured and the seller is marked verified-for-demo so the user can continue listing. In production, this can be connected to official registry checks or manual review queues.
