import Filters from './Filters';
import ListingCard from './ListingCard';
import type { AuthSession, Insight, Listing, Notification, Order, SellerDashboard, SellerProfile } from '../types';

export default function BuyerWorkspace({
  session,
  listings,
  sellers,
  orders,
  notifications,
  dashboard,
  insight,
  selectedSellerId,
  query,
  maxPrice,
  loading,
  onSelectSeller,
  onQueryChange,
  onMaxPriceChange,
  onOrder,
  onRefresh,
  onReset,
}: {
  session: AuthSession;
  listings: Listing[];
  sellers: SellerProfile[];
  orders: Order[];
  notifications: Notification[];
  dashboard: SellerDashboard | null;
  insight: Insight | null;
  selectedSellerId: string | null;
  query: string;
  maxPrice: number;
  loading: boolean;
  onSelectSeller: (sellerId: string) => void;
  onQueryChange: (value: string) => void;
  onMaxPriceChange: (value: number) => void;
  onOrder: (listing: Listing) => void;
  onRefresh: () => void;
  onReset: () => void;
}) {
  const buyerName = `Buyer ${session.phone_number.slice(-4)}`;
  const acceptedOrders = orders.filter((order) => order.status === 'accepted' || order.status === 'completed').length;
  const avgPrice = listings.length > 0
    ? Math.round(listings.reduce((total, item) => total + item.price_per_kg, 0) / listings.length)
    : 0;

  return (
    <div className="workspace-shell">
      <section className="workspace-hero buyer-hero">
        <div>
          <span className="eyebrow">Buyer interface</span>
          <h1>Browse live produce, compare trusted sellers, and place orders from one clean marketplace.</h1>
          <p>
            Logged in as {buyerName}. The marketplace keeps the existing buyer flow intact while separating seller operations into their own workspace.
          </p>
        </div>
        <div className="dashboard-live-panel card buyer-live-panel">
          <div className="live-panel-header">
            <span className="live-dot" />
            <span>Live market pulse</span>
          </div>
          <div className="produce-orbit" aria-hidden="true">
            <span className="orbit-ring" />
            <span className="produce-chip produce-chip-1">Tomato</span>
            <span className="produce-chip produce-chip-2">Onion</span>
            <span className="produce-chip produce-chip-3">Greens</span>
          </div>
          <div className="live-panel-actions">
            <button className="primary-button" onClick={onRefresh}>{loading ? 'Refreshing...' : 'Refresh data'}</button>
            <button className="ghost-button" onClick={onReset}>Reset sample data</button>
          </div>
        </div>
      </section>

      <section className="workspace-kpis">
        <article className="card workspace-kpi">
          <span>Live listings</span>
          <strong>{listings.length}</strong>
        </article>
        <article className="card workspace-kpi">
          <span>Active sellers</span>
          <strong>{sellers.length}</strong>
        </article>
        <article className="card workspace-kpi">
          <span>Accepted orders</span>
          <strong>{acceptedOrders}</strong>
        </article>
        <article className="card workspace-kpi">
          <span>Average price</span>
          <strong>Rs {avgPrice}/kg</strong>
        </article>
      </section>

      <Filters query={query} setQuery={onQueryChange} maxPrice={maxPrice} setMaxPrice={onMaxPriceChange} />

      <main className="content-grid buyer-grid">
        <section>
          <div className="section-header">
            <div>
              <h2>Buyer marketplace</h2>
              <p className="muted compact">Search by produce, price, seller, or pickup area. Listings still come from the WhatsApp seller flow.</p>
            </div>
            <span>{loading ? 'Loading...' : `${listings.length} live matches`}</span>
          </div>
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onOrder={onOrder} />
            ))}
          </div>
          {!loading && listings.length === 0 && <p className="muted">No listings match the current filters.</p>}
        </section>

        <aside className="status-panel">
          <section className="card">
            <div className="panel-header">
              <div>
                <h3>Seller spotlight</h3>
                <p className="muted compact">A buyer-facing view into the selected seller&apos;s operating signal.</p>
              </div>
              {sellers.length > 0 && (
                <label className="seller-selector">
                  <span className="label">Seller</span>
                  <select value={selectedSellerId || ''} onChange={(event) => onSelectSeller(event.target.value)}>
                    {sellers.map((seller) => (
                      <option key={seller.seller_id} value={seller.seller_id}>
                        {seller.store_name || seller.seller_name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {dashboard ? (
              <div className="metric-grid compact-grid">
                <div className="metric-tile">
                  <span className="label">Live stock</span>
                  <strong>{dashboard.total_available_kg} kg</strong>
                </div>
                <div className="metric-tile">
                  <span className="label">Pending orders</span>
                  <strong>{dashboard.pending_orders}</strong>
                </div>
                <div className="metric-tile">
                  <span className="label">Repeat buyers</span>
                  <strong>{dashboard.repeat_customers}</strong>
                </div>
                <div className="metric-tile">
                  <span className="label">Pickup</span>
                  <strong>{dashboard.default_pickup_location || 'Not set'}</strong>
                </div>
              </div>
            ) : (
              <p className="muted">Select a seller to see live context.</p>
            )}
          </section>

          <section className="card">
            <h3>Why this stays trustworthy</h3>
            <ul className="bullet-list">
              <li>Seller listings still originate from the WhatsApp onboarding and listing flow.</li>
              <li>Pickup locations are normalized before buyers see them.</li>
              <li>AI quality notes only appear when supported by image or text signals already in the pipeline.</li>
            </ul>
          </section>

          <section className="card">
            <h3>Alerts and insight</h3>
            {insight ? (
              <div className="insight-block">
                <strong>{insight.headline}</strong>
                <p>{insight.message}</p>
              </div>
            ) : (
              <p className="muted">Seller copilot insight appears after order activity.</p>
            )}
            <ul className="stack-list compact-stack">
              {notifications
                .filter((note) => (selectedSellerId ? note.seller_id === selectedSellerId : true))
                .slice()
                .reverse()
                .slice(0, 3)
                .map((note) => (
                  <li key={`${note.order_id}-${note.text}`}>
                    <strong>{note.delivery_status}</strong>
                    <p>{note.text}</p>
                  </li>
                ))}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}
