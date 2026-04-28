import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import type { AppLanguage } from '../App';
import type { AuthSession, Insight, Notification, Order, SellerDashboard, SellerLedgerView, SellerProfile } from '../types';

const sellerCopy = {
  en: {
    eyebrow: 'Seller interface',
    title: 'Track listings, khata, and order movement for the same number that already runs on WhatsApp.',
    body: 'Logged in as {phone}. This dashboard mirrors seller data generated from WhatsApp onboarding, listing creation, verification, and order alerts.',
    live: 'Seller operations live',
    refresh: 'Refresh data',
    refreshing: 'Refreshing...',
    listings: 'Live listings',
    stock: 'Available stock',
    revenue: 'Revenue today',
    khata: 'Outstanding khata',
  },
  hi: {
    eyebrow: 'Seller interface',
    title: 'WhatsApp पर चलने वाले उसी नंबर के लिए listings, khata और orders track करें.',
    body: '{phone} के रूप में logged in. यह dashboard WhatsApp onboarding, listing creation, verification और order alerts से बना seller data दिखाता है.',
    live: 'Seller operations live',
    refresh: 'Data refresh करें',
    refreshing: 'Refresh हो रहा है...',
    listings: 'Live listings',
    stock: 'Available stock',
    revenue: 'आज की revenue',
    khata: 'Outstanding khata',
  },
};

export default function SellerWorkspace({
  language,
  onLanguageChange,
  session,
  seller,
  dashboard,
  ledger,
  orders,
  notifications,
  insight,
  loading,
  onRefresh,
  onRespondOrder,
  onRecordLedgerPayment,
}: {
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
  session: AuthSession;
  seller: SellerProfile | null;
  dashboard: SellerDashboard | null;
  ledger: SellerLedgerView | null;
  orders: Order[];
  notifications: Notification[];
  insight: Insight | null;
  loading: boolean;
  onRefresh: () => void;
  onRespondOrder: (orderId: string, decision: 'accept' | 'reject') => Promise<void>;
  onRecordLedgerPayment: (payload: { buyer_name: string; amount_paid: number; notes?: string }) => Promise<void>;
}) {
  const copy = sellerCopy[language];
  const [paymentBuyerName, setPaymentBuyerName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const visibleOrders = orders
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const buyersWithDues = useMemo(() => {
    const balances = new Map<string, number>();
    for (const entry of ledger?.items || []) {
      balances.set(entry.buyer_name, Math.round(((balances.get(entry.buyer_name) || 0) + entry.balance_delta) * 100) / 100);
    }
    return Array.from(balances.entries())
      .filter(([, balance]) => balance > 0)
      .map(([buyerName]) => buyerName);
  }, [ledger]);

  const handleLedgerPaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(paymentAmount);
    if (!paymentBuyerName.trim() || !Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Enter buyer name and a valid payment amount.');
      return;
    }

    setPaymentSaving(true);
    setPaymentError(null);
    try {
      await onRecordLedgerPayment({
        buyer_name: paymentBuyerName.trim(),
        amount_paid: amount,
        notes: paymentNotes.trim() || undefined,
      });
      setPaymentBuyerName('');
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Could not update khata.');
    } finally {
      setPaymentSaving(false);
    }
  };

  return (
    <div className="workspace-shell">
      <section className="workspace-hero seller-hero">
        <div>
          <div className="workspace-title-row">
            <span className="eyebrow">{copy.eyebrow}</span>
            <div className="language-switcher" aria-label="Language switcher">
              <button type="button" className={language === 'en' ? 'language-switch-active' : ''} onClick={() => onLanguageChange('en')}>EN</button>
              <button type="button" className={language === 'hi' ? 'language-switch-active' : ''} onClick={() => onLanguageChange('hi')}>HI</button>
            </div>
          </div>
          <h1>{copy.title}</h1>
          <p>{copy.body.replace('{phone}', session.phone_number)}</p>
        </div>
        <div className="dashboard-live-panel card seller-live-panel">
          <div className="live-panel-header">
            <span className="live-dot" />
            <span>{copy.live}</span>
          </div>
          <div className="seller-signal-stack" aria-hidden="true">
            <span style={{ '--delay': '0s' } as CSSProperties}>Order sync</span>
            <span style={{ '--delay': '0.7s' } as CSSProperties}>Khata update</span>
            <span style={{ '--delay': '1.4s' } as CSSProperties}>Alert sent</span>
          </div>
          <div className="live-panel-actions">
            <button className="primary-button" onClick={onRefresh}>{loading ? copy.refreshing : copy.refresh}</button>
          </div>
        </div>
      </section>

      {dashboard ? (
        <section className="workspace-kpis">
          <article className="card workspace-kpi">
            <span>{copy.listings}</span>
            <strong>{dashboard.live_listings_count}</strong>
          </article>
          <article className="card workspace-kpi">
            <span>{copy.stock}</span>
            <strong>{dashboard.total_available_kg} kg</strong>
          </article>
          <article className="card workspace-kpi">
            <span>{copy.revenue}</span>
            <strong>Rs {dashboard.sold_today_revenue}</strong>
          </article>
          <article className="card workspace-kpi">
            <span>{copy.khata}</span>
            <strong>Rs {dashboard.ledger_outstanding_amount}</strong>
          </article>
        </section>
      ) : (
        <div className="card empty-state-card">
          <strong>No seller dashboard yet</strong>
          <p className="muted">This seller needs to complete WhatsApp onboarding and share at least one listing.</p>
        </div>
      )}

      <main className="seller-layout">
        <section className="seller-main-column">
          <section className="card">
            <div className="panel-header">
              <div>
                <h3>Ongoing orders</h3>
                <p className="muted compact">Pending, accepted, and completed order activity for this seller.</p>
              </div>
            </div>
            {visibleOrders.length === 0 ? (
              <p className="muted">No orders yet.</p>
            ) : (
              <ul className="stack-list order-list">
                {visibleOrders.map((order) => (
                  <li key={order.id}>
                    <div className="pill-row">
                      <strong>{order.product_name}</strong>
                      <span className={`mini-pill status-${order.status}`}>{order.status}</span>
                    </div>
                    <p>{order.quantity_kg} kg for {order.buyer_name}</p>
                    <p>Pickup {order.pickup_time} | Rs {order.total_price}</p>
                    {order.status === 'pending' && (
                      <div className="action-cluster order-actions">
                        <button className="primary-button small" onClick={() => void onRespondOrder(order.id, 'accept')}>
                          Accept
                        </button>
                        <button className="ghost-button small" onClick={() => void onRespondOrder(order.id, 'reject')}>
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="panel-header">
              <div>
                <h3>Khata and ledger</h3>
                <p className="muted compact">Captured from the existing WhatsApp voice-note and text-note flow.</p>
              </div>
            </div>
            <form className="ledger-payment-form" onSubmit={handleLedgerPaymentSubmit}>
              <div>
                <label className="label">Buyer name</label>
                <input
                  list="ledger-buyers"
                  value={paymentBuyerName}
                  onChange={(event) => setPaymentBuyerName(event.target.value)}
                  placeholder="Raju"
                />
                <datalist id="ledger-buyers">
                  {buyersWithDues.map((buyerName) => (
                    <option key={buyerName} value={buyerName} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="label">Amount paid</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="500"
                />
              </div>
              <div className="ledger-payment-notes">
                <label className="label">Note</label>
                <input
                  value={paymentNotes}
                  onChange={(event) => setPaymentNotes(event.target.value)}
                  placeholder="UPI, cash, part payment..."
                />
              </div>
              <button className="primary-button" type="submit" disabled={paymentSaving}>
                {paymentSaving ? 'Updating...' : 'Record payment'}
              </button>
              {paymentError && <p className="error-text">{paymentError}</p>}
            </form>
            {!ledger || ledger.items.length === 0 ? (
              <p className="muted">No khata records yet.</p>
            ) : (
              <>
                <div className="metric-grid compact-grid">
                  <div className="metric-tile">
                    <span className="label">Entries</span>
                    <strong>{ledger.summary.total_entries}</strong>
                  </div>
                  <div className="metric-tile">
                    <span className="label">Outstanding</span>
                    <strong>Rs {ledger.summary.total_outstanding_amount}</strong>
                  </div>
                  <div className="metric-tile">
                    <span className="label">Collected</span>
                    <strong>Rs {ledger.summary.total_collected_amount}</strong>
                  </div>
                  <div className="metric-tile">
                    <span className="label">Buyers with dues</span>
                    <strong>{ledger.summary.buyers_with_balance}</strong>
                  </div>
                </div>
                <ul className="stack-list ledger-list">
                  {ledger.items.slice(0, 6).map((entry) => (
                    <li key={entry.id}>
                      <div className="pill-row">
                        <strong>{entry.buyer_name}</strong>
                        <span className={`mini-pill ${entry.entry_kind === 'payment' ? 'success-pill' : 'neutral-pill'}`}>
                          {entry.entry_kind === 'payment' ? 'Payment' : 'Sale'}
                        </span>
                        <span className="mini-pill">{entry.capture_mode === 'voice_note' ? 'Voice note' : 'Text note'}</span>
                      </div>
                      <p>{entry.summary}</p>
                      <p>
                        {entry.entry_kind === 'payment'
                          ? `Received Rs ${entry.amount_paid}`
                          : `Total Rs ${entry.total_amount || 0} | Paid Rs ${entry.amount_paid} | Due Rs ${entry.amount_due}`}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </section>

        <aside className="seller-side-column status-panel">
          <section className="card">
            <h3>Seller profile</h3>
            {seller ? (
              <div className="profile-stack">
                <div>
                  <span className="label">Store</span>
                  <strong>{seller.store_name || seller.seller_name}</strong>
                </div>
                <div>
                  <span className="label">Verification</span>
                  <strong>{seller.verification_status || 'unverified'}</strong>
                </div>
                <div>
                  <span className="label">Method</span>
                  <strong>{seller.verification_method || 'Not set'}</strong>
                </div>
                <div>
                  <span className="label">Pickup</span>
                  <strong>{seller.default_pickup_location || 'Not set'}</strong>
                </div>
              </div>
            ) : (
              <p className="muted">Seller profile not found.</p>
            )}
          </section>

          <section className="card">
            <h3>Live listings</h3>
            {!dashboard || dashboard.recent_listings.length === 0 ? (
              <p className="muted">No live listings yet.</p>
            ) : (
              <ul className="stack-list compact-stack">
                {dashboard.recent_listings.map((listing) => (
                  <li key={listing.id}>
                    <strong>{listing.product_name}</strong>
                    <p>{listing.available_kg} kg at Rs {listing.price_per_kg}/kg</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h3>Seller alerts</h3>
            {notifications.length === 0 ? (
              <p className="muted">No alerts yet.</p>
            ) : (
              <ul className="stack-list compact-stack">
                {notifications.slice().reverse().slice(0, 4).map((note) => (
                  <li key={`${note.order_id}-${note.text}`}>
                    <strong>{note.delivery_status}</strong>
                    <p>{note.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card highlight">
            <h3>AI seller copilot</h3>
            {insight ? (
              <>
                <strong>{insight.headline}</strong>
                <p>{insight.message}</p>
              </>
            ) : (
              <p className="muted">Accept an order to generate the next insight.</p>
            )}
          </section>

          <section className="card">
            <h3>WhatsApp alignment</h3>
            <ul className="bullet-list">
              <li>Seller login is tied to the same phone number used during WhatsApp onboarding.</li>
              <li>Listings, khata entries, and alerts shown here are the same records generated by the WhatsApp workflow.</li>
              <li>This dashboard is a mirror and control layer, not a separate seller system.</li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}
