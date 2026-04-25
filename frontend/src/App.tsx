import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createDemoListing,
  fetchInsight,
  fetchListings,
  fetchNotifications,
  fetchOrders,
  fetchSellerDashboard,
  fetchSellerLedger,
  fetchSellers,
  placeOrder,
  reportBuyerDemandSearch,
  resetDemo,
  respondToOrder,
} from './api';
import AuthModal from './components/AuthModal';
import BuyerWorkspace from './components/BuyerWorkspace';
import LandingPage from './components/LandingPage';
import OrderModal from './components/OrderModal';
import SellerWorkspace from './components/SellerWorkspace';
import type { AuthRole, AuthSession, Insight, Listing, Notification, Order, SellerDashboard, SellerLedgerView, SellerProfile } from './types';

const BUYER_SESSION_STORAGE_KEY = 'bolbazaar_buyer_session_id';
const APP_SESSION_STORAGE_KEY = 'bolbazaar_web_session';

function getOrCreateBuyerSessionId(): string {
  const fallback = `buyer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const existing = window.localStorage.getItem(BUYER_SESSION_STORAGE_KEY);
    if (existing && existing.trim()) {
      return existing;
    }

    const nextId = typeof window.crypto?.randomUUID === 'function'
      ? `buyer-${window.crypto.randomUUID()}`
      : fallback;
    window.localStorage.setItem(BUYER_SESSION_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return fallback;
  }
}

function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(APP_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function sessionSellerId(session: AuthSession | null): string | null {
  if (!session || session.role !== 'seller') {
    return null;
  }
  return session.seller_id || session.phone_number;
}

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [ledger, setLedger] = useState<SellerLedgerView | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(getStoredSession);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<AuthRole | null>(null);
  const buyerSessionIdRef = useRef<string>(getOrCreateBuyerSessionId());

  const activeSellerId = sessionSellerId(session) || selectedSellerId;

  const loadAll = async (preferredSellerId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const [nextListings, nextOrders, nextNotifications, nextSellers] = await Promise.all([
        fetchListings(),
        fetchOrders(),
        fetchNotifications(),
        fetchSellers(),
      ]);

      setListings(nextListings);
      setOrders(nextOrders);
      setNotifications(nextNotifications);
      setSellers(nextSellers);

      const nextSellerId =
        preferredSellerId ||
        sessionSellerId(session) ||
        selectedSellerId ||
        nextSellers[0]?.seller_id ||
        nextListings[0]?.seller_id ||
        nextNotifications[0]?.seller_id ||
        null;

      setSelectedSellerId(nextSellerId);

      if (nextSellerId) {
        const [nextDashboard, nextLedger, nextInsight] = await Promise.all([
          fetchSellerDashboard(nextSellerId),
          fetchSellerLedger(nextSellerId),
          fetchInsight(nextSellerId),
        ]);
        setDashboard(nextDashboard);
        setLedger(nextLedger);
        setInsight(nextInsight);
      } else {
        setDashboard(null);
        setLedger(null);
        setInsight(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (session) {
        window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(APP_SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore local storage failures and keep the in-memory session.
    }
  }, [session]);

  useEffect(() => {
    const sellerId = sessionSellerId(session);
    if (sellerId) {
      setSelectedSellerId(sellerId);
      void loadAll(sellerId);
    }
  }, [session]);

  useEffect(() => {
    const searchQuery = query.trim();
    if (!session || session.role !== 'buyer' || searchQuery.length < 2) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void reportBuyerDemandSearch({
        buyer_id: buyerSessionIdRef.current,
        search_query: searchQuery,
        max_price_per_kg: maxPrice > 0 ? maxPrice : undefined,
      }).catch((err) => {
        console.warn('Failed to report buyer demand search', err);
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [maxPrice, query, session]);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesQuery = `${listing.product_name} ${listing.seller_name} ${listing.pickup_location}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesPrice = listing.price_per_kg <= maxPrice;
      return matchesQuery && matchesPrice;
    });
  }, [listings, maxPrice, query]);

  const acceptedOrders = orders.filter((order) => order.status === 'accepted' || order.status === 'completed').length;
  const currentSeller = activeSellerId ? sellers.find((seller) => seller.seller_id === activeSellerId) || null : null;
  const showWorkspaceHeader = Boolean(session);

  return (
    <div className="app-shell">
      {showWorkspaceHeader && (
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-leaf" />
              BB
            </span>
            <div>
              <strong className="brand-wordmark">
                <span>Bol</span><span>Bazaar</span>
              </strong>
              <p>WhatsApp-first produce marketplace</p>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="session-chip">{session?.role === 'seller' ? 'Seller logged in' : 'Buyer logged in'}</span>
            <button className="ghost-button" onClick={() => setSession(null)}>Logout</button>
          </div>
        </header>
      )}

      {error && (
        <div className="page-shell">
          <div className="error-banner">{error}</div>
        </div>
      )}

      {!session && (
        <LandingPage
          stats={{
            liveListings: listings.length,
            activeSellers: sellers.length,
            acceptedOrders,
            alertsSent: notifications.length,
          }}
          onOpenLogin={(role) => {
            setAuthInitialRole(role);
            setAuthModalOpen(true);
          }}
        />
      )}

      {session?.role === 'buyer' && (
        <BuyerWorkspace
          session={session}
          listings={filteredListings}
          sellers={sellers}
          orders={orders}
          notifications={notifications}
          dashboard={dashboard}
          insight={insight}
          selectedSellerId={activeSellerId}
          query={query}
          maxPrice={maxPrice}
          loading={loading}
          onSelectSeller={(sellerId) => {
            setSelectedSellerId(sellerId);
            void loadAll(sellerId);
          }}
          onQueryChange={setQuery}
          onMaxPriceChange={setMaxPrice}
          onOrder={setSelectedListing}
          onRefresh={() => void loadAll(activeSellerId)}
          onReset={() => {
            void (async () => {
              await resetDemo();
              await createDemoListing();
              await loadAll(activeSellerId);
            })();
          }}
        />
      )}

      {session?.role === 'seller' && (
        <SellerWorkspace
          session={session}
          seller={currentSeller}
          dashboard={dashboard}
          ledger={ledger}
          orders={orders.filter((order) => order.seller_id === activeSellerId)}
          notifications={notifications.filter((note) => note.seller_id === activeSellerId)}
          insight={insight}
          loading={loading}
          onRefresh={() => void loadAll(activeSellerId)}
          onRespondOrder={async (orderId, decision) => {
            await respondToOrder(orderId, decision);
            await loadAll(activeSellerId);
          }}
        />
      )}

      {selectedListing && session?.role === 'buyer' && (
        <OrderModal
          listing={selectedListing}
          defaultBuyerName={`Buyer ${session.phone_number.slice(-4)}`}
          defaultBuyerPhone={session.phone_number}
          onClose={() => setSelectedListing(null)}
          onSubmit={async (payload) => {
            await placeOrder({ listing_id: selectedListing.id, ...payload });
            setSelectedListing(null);
            await loadAll(activeSellerId);
          }}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        initialRole={authInitialRole}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(nextSession) => {
          setSession(nextSession);
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
}
