import type { CSSProperties } from 'react';
import type { AuthSession, Insight, Notification, Order, SellerDashboard, SellerLedgerView, SellerProfile } from '../types';

export default function SellerWorkspace({
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
}: {
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
}) {
  const visibleOrders = orders
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="workspace-shell">
      <section className="workspace-hero seller-hero">
        <div>
          <span className="eyebrow">Seller interface</span>
          <h1>Track listings, khata, and order movement for the same number that already runs on WhatsApp.</h1>
          <p>
            Logged in as {session.phone_number}. This dashboard mirrors the seller data generated from WhatsApp onboarding,
            listing creation, verification, and order alerts.
          </p>
        </div>
        <div className="dashboard-live-panel card seller-live-panel">
          <div className="live-panel-header">
            <span className="live-dot" />
            <span>Seller operations live</span>
          </div>
          <div className="seller-signal-stack" aria-hidden="true">
            <span style={{ '--delay': '0s' } as CSSProperties}>Order sync</span>
            <span style={{ '--delay': '0.7s' } as CSSProperties}>Khata update</span>
            <span style={{ '--delay': '1.4s' } as CSSProperties}>Alert sent</span>
          </div>
          <div className="live-panel-actions">
            <button className="primary-button" onClick={onRefresh}>{loading ? 'Refreshing...' : 'Refresh data'}</button>
          </div>
        </div>
      </section>

      {dashboard ? (
        <section className="workspace-kpis">
          <article className="card workspace-kpi">
            <span>Live listings</span>
            <strong>{dashboard.live_listings_count}</strong>
          </article>
          <article className="card workspace-kpi">
            <span>Available stock</span>
            <strong>{dashboard.total_available_kg} kg</strong>
          </article>
          <article className="card workspace-kpi">
            <span>Revenue today</span>
            <strong>Rs {dashboard.sold_today_revenue}</strong>
          </article>
          <article className="card workspace-kpi">
            <span>Outstanding khata</span>
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
