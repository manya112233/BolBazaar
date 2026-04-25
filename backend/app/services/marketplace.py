from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta
import hashlib

import httpx

from app.config import get_settings
from app.schemas import BuyerDemandEvent, BuyerDemandSearchIn, BuyerDemandSearchResponse, LedgerCaptureMode, LedgerEntry, LedgerSummary, Listing, ListingCreate, Order, OrderCreate, ProduceQualityAssessment, SellerLedgerView, SellerNotification, SourceChannel
from app.schemas import SellerDashboard, SellerProfile
from app.services.extraction import ExtractionService
from app.services.geo_service import GeoService
from app.services.speech_service import SpeechService
from app.services.store import JsonStore
from app.services.whatsapp_service import WhatsAppService


class MarketplaceService:
    def __init__(self, store: JsonStore):
        self.store = store
        self.settings = get_settings()
        self.extractor = ExtractionService()
        self.speech = SpeechService()
        self.geo = GeoService()
        self.whatsapp = WhatsAppService()

    def _public_image_url(self, image_url: str | None) -> str | None:
        if image_url and image_url.startswith(('http://', 'https://')):
            return image_url
        return None

    def _fetch_public_image_bytes(self, image_url: str | None) -> tuple[bytes | None, str | None]:
        public_image_url = self._public_image_url(image_url)
        if not public_image_url:
            return None, None

        try:
            response = httpx.get(public_image_url, timeout=20.0)
            response.raise_for_status()
        except httpx.HTTPError:
            return None, None

        return response.content, response.headers.get('content-type')

    def assess_produce_image(
        self,
        *,
        image_bytes: bytes | None,
        image_mime_type: str | None,
        image_url: str | None = None,
        product_hint: str | None = None,
    ) -> ProduceQualityAssessment | None:
        candidate_bytes = image_bytes
        candidate_mime_type = image_mime_type
        if not candidate_bytes:
            candidate_bytes, candidate_mime_type = self._fetch_public_image_bytes(image_url)
        if not candidate_bytes or not candidate_mime_type:
            return None
        return self.extractor.assess_produce_image(
            image_bytes=candidate_bytes,
            mime_type=candidate_mime_type,
            product_hint=product_hint,
        )

    def create_listing_from_message(
        self,
        *,
        seller_id: str,
        seller_name: str,
        message_text: str,
        image_url: str | None,
        source_channel: SourceChannel = 'api',
        default_pickup_location: str | None = None,
        image_bytes: bytes | None = None,
        image_mime_type: str | None = None,
        quality_assessment: ProduceQualityAssessment | None = None,
    ) -> Listing:
        public_image_url = self._public_image_url(image_url)
        effective_quality_assessment = quality_assessment or self.assess_produce_image(
            image_bytes=image_bytes,
            image_mime_type=image_mime_type,
            image_url=public_image_url,
        )

        draft: ListingCreate = self.extractor.extract_listing(
            message=message_text,
            seller_id=seller_id,
            seller_name=seller_name,
            image_url=public_image_url,
            source_channel=source_channel,
            default_pickup_location=default_pickup_location,
            quality_assessment=effective_quality_assessment,
        )

        geocoded = self.geo.geocode(draft.pickup_location)
        if geocoded:
            draft.pickup_location = geocoded['pickup_location']
            draft.latitude = geocoded.get('latitude')
            draft.longitude = geocoded.get('longitude')
            draft.place_id = geocoded.get('place_id')

        listing = Listing(
            seller_id=draft.seller_id,
            seller_name=draft.seller_name,
            product_name=draft.product_name,
            category=draft.category,
            quantity_kg=draft.quantity_kg,
            available_kg=draft.quantity_kg,
            price_per_kg=draft.price_per_kg,
            pickup_location=draft.pickup_location,
            quality_grade=draft.quality_grade,
            quality_score=draft.quality_score,
            quality_summary=draft.quality_summary,
            quality_assessment_source=draft.quality_assessment_source,
            quality_signals=draft.quality_signals,
            image_url=draft.image_url,
            description=draft.description,
            tags=draft.tags,
            latitude=draft.latitude,
            longitude=draft.longitude,
            place_id=draft.place_id,
            source_channel=draft.source_channel,
            raw_message=draft.raw_message,
            freshness_label='AI photo checked' if draft.quality_assessment_source == 'ai_visual' else 'Fresh today',
        )
        saved_listing = self.store.save_listing(listing)

        profile = self.store.get_seller_profile(seller_id)
        quality_text = ''
        if saved_listing.quality_assessment_source == 'ai_visual':
            grade_text = saved_listing.quality_grade.title()
            if saved_listing.quality_score is not None:
                quality_text = f' AI quality grade: {grade_text} ({saved_listing.quality_score}/100).'
            else:
                quality_text = f' AI quality grade: {grade_text}.'
        if profile is not None and profile.preferred_language == 'hi':
            confirmation_text = (
                f'आपकी लिस्टिंग लाइव हो गई है। {saved_listing.product_name}, '
                f'{saved_listing.available_kg} किलो, Rs {saved_listing.price_per_kg} प्रति किलो।'
            )
            if quality_text:
                confirmation_text += quality_text.replace('AI quality grade', 'AI गुणवत्ता ग्रेड')
        else:
            confirmation_text = (
                f'Your listing is live. {saved_listing.product_name}, '
                f'{saved_listing.available_kg} kg, Rs {saved_listing.price_per_kg} per kg.'
            ) + quality_text
        try:
            whatsapp_result = self.whatsapp.send_text_message(to=seller_id, body=confirmation_text)
        except Exception as exc:  # pragma: no cover - network failures depend on runtime
            whatsapp_result = {'sent': False, 'reason': 'send_failed', 'error': str(exc)}

        try:
            audio_base64 = self.speech.synthesize(confirmation_text)
        except Exception:  # pragma: no cover - cloud TTS failures depend on runtime
            audio_base64 = None

        notification = SellerNotification(
            seller_id=seller_id,
            order_id='listing_confirmation',
            text=confirmation_text,
            audio_base64=audio_base64,
            delivery_status=self.whatsapp.delivery_status(whatsapp_result),
        )
        self.store.add_notification(notification.model_dump())
        return saved_listing

    def list_live_listings(self) -> list[Listing]:
        items = [listing for listing in self.store.list_listings() if listing.status == 'live']
        return sorted(items, key=lambda item: item.created_at, reverse=True)

    def list_seller_profiles(self) -> list[SellerProfile]:
        profiles = self.store.list_seller_profiles()
        return sorted(profiles, key=lambda item: item.updated_at, reverse=True)

    def list_ledger_entries(self, seller_id: str | None = None) -> list[LedgerEntry]:
        list_entries = getattr(self.store, 'list_ledger_entries', None)
        if list_entries is None:
            return []

        entries = list_entries()
        if seller_id is not None:
            entries = [entry for entry in entries if entry.seller_id == seller_id]
        return sorted(entries, key=lambda item: item.created_at, reverse=True)

    def _normalize_search_query(self, query: str) -> str:
        normalized = ' '.join(query.strip().lower().split())
        if not normalized:
            return ''

        normalize_message = getattr(self.extractor, '_normalize_message', None)
        if callable(normalize_message):
            try:
                candidate = normalize_message(query)
                if isinstance(candidate, str) and candidate.strip():
                    return candidate
            except Exception:
                return normalized
        return normalized

    def _demand_alert_fingerprint(self, seller_id: str, product_name: str) -> str:
        payload = f'demand_push|{seller_id}|{product_name.strip().lower()}'
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def _format_demand_push_message(self, profile: SellerProfile, product_name: str, buyer_count: int) -> str:
        seller_name = (profile.seller_name or 'Seller').strip()
        if profile.preferred_language == 'hi':
            return (
                f'नमस्ते {seller_name}, अभी {buyer_count} खरीदार {product_name} ढूंढ रहे हैं। '
                'जल्दी बेचने के लिए अभी लिस्ट करें।'
            )
        return (
            f'Hi {seller_name}, {buyer_count} buyers are looking for {product_name} right now. '
            'List now to sell faster.'
        )

    def process_buyer_demand_search(self, payload: BuyerDemandSearchIn) -> BuyerDemandSearchResponse:
        normalized_query = self._normalize_search_query(payload.search_query)
        signals = self.extractor.parse_listing_signals(payload.search_query)
        detected_product_name = signals.get('product_name')
        detected_category = signals.get('category')
        if detected_category not in {'vegetables', 'fruits', 'grains', 'spices', 'other'}:
            detected_category = None

        event = BuyerDemandEvent(
            buyer_id=payload.buyer_id,
            search_query=payload.search_query,
            normalized_query=normalized_query,
            detected_product_name=detected_product_name,
            detected_category=detected_category,
            max_price_per_kg=payload.max_price_per_kg,
            source_channel='api',
        )

        save_event = getattr(self.store, 'save_buyer_search_event', None)
        if callable(save_event):
            save_event(event)

        threshold = self.settings.demand_push_threshold
        if not detected_product_name:
            return BuyerDemandSearchResponse(
                event_id=event.id,
                detected_product_name=None,
                detected_category=None,
                unique_buyer_count=0,
                threshold=threshold,
                threshold_reached=False,
                notified_seller_count=0,
                reason='unsupported_query',
            )

        list_events = getattr(self.store, 'list_buyer_search_events', None)
        if not callable(list_events):
            return BuyerDemandSearchResponse(
                event_id=event.id,
                detected_product_name=detected_product_name,
                detected_category=detected_category,
                unique_buyer_count=0,
                threshold=threshold,
                threshold_reached=False,
                notified_seller_count=0,
                reason='demand_storage_unavailable',
            )

        since = datetime.utcnow() - timedelta(minutes=self.settings.demand_push_window_minutes)
        recent_events = list_events(since=since, detected_product_name=detected_product_name)
        unique_buyers = {
            item.buyer_id.strip().lower()
            for item in recent_events
            if item.buyer_id and item.buyer_id.strip()
        }
        unique_buyer_count = len(unique_buyers)
        if unique_buyer_count < threshold:
            return BuyerDemandSearchResponse(
                event_id=event.id,
                detected_product_name=detected_product_name,
                detected_category=detected_category,
                unique_buyer_count=unique_buyer_count,
                threshold=threshold,
                threshold_reached=False,
                notified_seller_count=0,
                reason='below_threshold',
            )

        claim_fingerprint = getattr(self.store, 'claim_demand_alert_fingerprint', None)
        mark_fingerprint = getattr(self.store, 'mark_demand_alert_fingerprint_processed', None)
        release_fingerprint = getattr(self.store, 'release_demand_alert_fingerprint', None)

        cooldown_seconds = self.settings.demand_push_cooldown_minutes * 60
        active_sellers = [
            profile
            for profile in self.list_seller_profiles()
            if profile.registration_status == 'active'
        ]

        notified_seller_count = 0
        for profile in active_sellers:
            fingerprint = self._demand_alert_fingerprint(profile.seller_id, detected_product_name)
            if callable(claim_fingerprint):
                can_send = claim_fingerprint(fingerprint, window_seconds=cooldown_seconds)
                if not can_send:
                    continue

            message_text = self._format_demand_push_message(profile, detected_product_name, unique_buyer_count)
            try:
                whatsapp_result = self.whatsapp.send_text_message(to=profile.seller_id, body=message_text)
            except Exception as exc:  # pragma: no cover - network failures depend on runtime
                whatsapp_result = {'sent': False, 'reason': 'send_failed', 'error': str(exc)}

            if whatsapp_result.get('sent'):
                notified_seller_count += 1
                if callable(mark_fingerprint):
                    mark_fingerprint(fingerprint)
            elif callable(release_fingerprint):
                release_fingerprint(fingerprint)

            notification = SellerNotification(
                seller_id=profile.seller_id,
                order_id=f'demand_push:{event.id}',
                text=message_text,
                delivery_status=self.whatsapp.delivery_status(whatsapp_result),
            )
            self.store.add_notification(notification.model_dump())

        reason = None
        if not active_sellers:
            reason = 'no_active_sellers'
        elif notified_seller_count == 0:
            reason = 'cooldown_active_or_delivery_failed'

        return BuyerDemandSearchResponse(
            event_id=event.id,
            detected_product_name=detected_product_name,
            detected_category=detected_category,
            unique_buyer_count=unique_buyer_count,
            threshold=threshold,
            threshold_reached=True,
            notified_seller_count=notified_seller_count,
            reason=reason,
        )

    def _build_ledger_summary(self, seller_id: str) -> LedgerSummary:
        entries = self.list_ledger_entries(seller_id)
        buyer_balances: dict[str, float] = {}
        for entry in entries:
            buyer_balances[entry.buyer_name] = round(buyer_balances.get(entry.buyer_name, 0.0) + entry.balance_delta, 2)

        return LedgerSummary(
            total_entries=len(entries),
            total_outstanding_amount=round(sum(max(balance, 0.0) for balance in buyer_balances.values()), 2),
            total_collected_amount=round(sum(entry.amount_paid for entry in entries), 2),
            buyers_with_balance=sum(1 for balance in buyer_balances.values() if balance > 0),
            recent_entries=entries[:5],
        )

    def build_seller_ledger(self, seller_id: str) -> SellerLedgerView | None:
        profile = self.store.get_seller_profile(seller_id)
        if profile is None:
            return None

        entries = self.list_ledger_entries(seller_id)
        return SellerLedgerView(
            seller_id=seller_id,
            summary=self._build_ledger_summary(seller_id),
            items=entries[:20],
        )

    def record_ledger_entry_from_message(
        self,
        *,
        seller_id: str,
        message_text: str,
        source_channel: SourceChannel = 'whatsapp',
        capture_mode: LedgerCaptureMode = 'text_message',
    ) -> LedgerEntry | None:
        entry = self.extractor.extract_ledger_entry(
            message=message_text,
            seller_id=seller_id,
            source_channel=source_channel,
            capture_mode=capture_mode,
        )
        if entry is None:
            return None

        save_entry = getattr(self.store, 'save_ledger_entry', None)
        if save_entry is None:
            return None
        return save_entry(entry)

    def build_seller_dashboard(self, seller_id: str) -> SellerDashboard | None:
        profile = self.store.get_seller_profile(seller_id)
        if profile is None:
            return None

        listings = [item for item in self.store.list_listings() if item.seller_id == seller_id]
        live_listings = [item for item in listings if item.status == 'live']
        orders = [item for item in self.store.list_orders() if item.seller_id == seller_id]
        accepted_orders = [item for item in orders if item.status in {'accepted', 'completed'}]

        today = datetime.utcnow().date()
        todays_orders = [item for item in accepted_orders if item.created_at.date() == today]
        customer_counts = Counter(item.buyer_name for item in accepted_orders)
        recent_customers = list(dict.fromkeys(
            item.buyer_name
            for item in sorted(accepted_orders, key=lambda order: order.created_at, reverse=True)
        ))
        ledger_summary = self._build_ledger_summary(seller_id)

        return SellerDashboard(
            seller_id=profile.seller_id,
            seller_name=profile.seller_name,
            store_name=profile.store_name,
            preferred_language=profile.preferred_language,
            default_pickup_location=profile.default_pickup_location,
            live_listings_count=len(live_listings),
            total_available_kg=round(sum(item.available_kg for item in live_listings), 2),
            sold_today_kg=round(sum(item.quantity_kg for item in todays_orders), 2),
            sold_today_revenue=round(sum(item.total_price for item in todays_orders), 2),
            total_customers=len(customer_counts),
            repeat_customers=sum(1 for count in customer_counts.values() if count > 1),
            pending_orders=len([item for item in orders if item.status == 'pending']),
            ledger_entries_count=ledger_summary.total_entries,
            ledger_outstanding_amount=ledger_summary.total_outstanding_amount,
            ledger_collected_amount=ledger_summary.total_collected_amount,
            ledger_buyers_with_balance=ledger_summary.buyers_with_balance,
            recent_customers=recent_customers[:5],
            recent_listings=sorted(live_listings, key=lambda item: item.created_at, reverse=True)[:5],
            recent_ledger_entries=ledger_summary.recent_entries,
        )

    def place_order(self, payload: OrderCreate) -> Order:
        listing = self.store.get_listing(payload.listing_id)
        if listing is None:
            raise ValueError('Listing not found')
        if payload.quantity_kg > listing.available_kg:
            raise ValueError('Requested quantity exceeds available stock')

        order = Order(
            listing_id=listing.id,
            seller_id=listing.seller_id,
            seller_name=listing.seller_name,
            product_name=listing.product_name,
            buyer_name=payload.buyer_name,
            buyer_type=payload.buyer_type,
            quantity_kg=payload.quantity_kg,
            pickup_time=payload.pickup_time,
            unit_price=listing.price_per_kg,
            total_price=round(payload.quantity_kg * listing.price_per_kg, 2),
        )
        self.store.save_order(order)

        profile = self.store.get_seller_profile(listing.seller_id)
        quantity = f'{payload.quantity_kg:g}'
        if profile is not None and profile.preferred_language == 'hi':
            notification_text = (
                f'{payload.quantity_kg} किलो {listing.product_name.lower()} का ऑर्डर {payload.buyer_name} से आया है। '
                f'पिकअप: {payload.pickup_time}। हाँ या नहीं जवाब दें।'
            )
        else:
            notification_text = (
                f'New order: {quantity} kg {listing.product_name} from {payload.buyer_name}. '
                f'Pickup {payload.pickup_time}. Tap Accept or Reject, or reply YES/NO.'
            )
        try:
            whatsapp_result = self.whatsapp.send_reply_buttons(
                to=listing.seller_id,
                body=notification_text,
                buttons=[
                    {'id': f'order_accept:{order.id}', 'title': 'Accept'},
                    {'id': f'order_reject:{order.id}', 'title': 'Reject'},
                ],
            )
            if not whatsapp_result.get('sent'):
                whatsapp_result = self.whatsapp.send_text_message(to=listing.seller_id, body=notification_text)
        except Exception as exc:  # pragma: no cover - network failures depend on runtime
            whatsapp_result = {'sent': False, 'reason': 'send_failed', 'error': str(exc)}

        try:
            audio_base64 = self.speech.synthesize(notification_text)
        except Exception:  # pragma: no cover - cloud TTS failures depend on runtime
            audio_base64 = None

        notification = SellerNotification(
            seller_id=listing.seller_id,
            order_id=order.id,
            text=notification_text,
            audio_base64=audio_base64,
            delivery_status=self.whatsapp.delivery_status(whatsapp_result),
        )
        self.store.add_notification(notification.model_dump())
        return order

    def respond_to_order(self, order_id: str, decision: str) -> Order:
        order = self.store.get_order(order_id)
        if order is None:
            raise ValueError('Order not found')
        if order.status != 'pending':
            return order

        listing = self.store.get_listing(order.listing_id)
        if listing is None:
            raise ValueError('Listing not found')
        if not order.product_name or order.product_name == 'items':
            order.product_name = listing.product_name

        if decision == 'accept':
            order.status = 'accepted'
            listing.available_kg = max(0, listing.available_kg - order.quantity_kg)
            if listing.available_kg == 0:
                listing.status = 'sold_out'
        else:
            order.status = 'rejected'

        self.store.save_order(order)
        self.store.save_listing(listing)

        recent_orders = len([
            item for item in self.store.list_orders() if item.seller_id == listing.seller_id and item.status == 'accepted'
        ])
        insight = self.extractor.build_insight(
            seller_id=listing.seller_id,
            seller_name=listing.seller_name,
            product_name=listing.product_name,
            available_kg=listing.available_kg,
            recent_orders=recent_orders,
        )
        self.store.save_insight(insight)
        return order
