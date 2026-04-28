import Filters from './Filters';
import ListingCard from './ListingCard';
import type { AppLanguage } from '../App';
import type { AuthSession, Insight, Listing, Notification, Order, SellerDashboard, SellerProfile } from '../types';

const buyerCopy = {
  en: {
    eyebrow: 'Buyer interface',
    title: 'Browse live produce, compare trusted sellers, and place orders from one clean marketplace.',
    body: 'Logged in as {name}. The marketplace keeps the existing buyer flow intact while separating seller operations into their own workspace.',
    pulse: 'Live market pulse',
    refresh: 'Refresh data',
    refreshing: 'Refreshing...',
    reset: 'Reset sample data',
    listings: 'Live listings',
    sellers: 'Active sellers',
    orders: 'Accepted orders',
    avg: 'Average price',
    marketplace: 'Buyer marketplace',
    marketplaceBody: 'Search by produce, price, seller, or pickup area. Listings still come from the WhatsApp seller flow.',
    matches: 'live matches',
    loading: 'Loading...',
    noMatches: 'No listings match the current filters.',
    sellerSpotlight: 'Seller spotlight',
    sellerSpotlightBody: 'A buyer-facing view into the selected seller\'s operating signal.',
    seller: 'Seller',
    liveStock: 'Live stock',
    pendingOrders: 'Pending orders',
    repeatBuyers: 'Repeat buyers',
    pickup: 'Pickup',
    notSet: 'Not set',
    selectSeller: 'Select a seller to see live context.',
    trustTitle: 'Why this stays trustworthy',
    trustOne: 'Seller listings still originate from the WhatsApp onboarding and listing flow.',
    trustTwo: 'Pickup locations are normalized before buyers see them.',
    trustThree: 'AI quality notes only appear when supported by image or text signals already in the pipeline.',
    alertsTitle: 'Alerts and insight',
    insightEmpty: 'Seller copilot insight appears after order activity.',
    kg: 'kg',
    currency: 'Rs',
  },
  hi: {
    eyebrow: 'खरीदार इंटरफेस',
    title: 'लाइव उपज देखें, भरोसेमंद विक्रेताओं की तुलना करें और एक साफ marketplace से ऑर्डर करें।',
    body: '{name} के रूप में लॉग इन। Marketplace खरीदार flow को आसान रखता है और seller operations को अलग workspace में दिखाता है।',
    pulse: 'लाइव बाजार संकेत',
    refresh: 'डेटा refresh करें',
    refreshing: 'Refresh हो रहा है...',
    reset: 'Sample data reset करें',
    listings: 'लाइव लिस्टिंग',
    sellers: 'सक्रिय विक्रेता',
    orders: 'स्वीकृत ऑर्डर',
    avg: 'औसत कीमत',
    marketplace: 'खरीदार marketplace',
    marketplaceBody: 'उपज, कीमत, विक्रेता या pickup area से search करें। Listings WhatsApp seller flow से आती हैं।',
    matches: 'लाइव मैच',
    loading: 'लोड हो रहा है...',
    noMatches: 'मौजूदा filter से कोई listing नहीं मिली।',
    sellerSpotlight: 'विक्रेता spotlight',
    sellerSpotlightBody: 'चुने गए विक्रेता के operating signal का खरीदार view।',
    seller: 'विक्रेता',
    liveStock: 'लाइव stock',
    pendingOrders: 'Pending ऑर्डर',
    repeatBuyers: 'Repeat खरीदार',
    pickup: 'पिकअप',
    notSet: 'सेट नहीं है',
    selectSeller: 'Live context देखने के लिए विक्रेता चुनें।',
    trustTitle: 'यह भरोसेमंद क्यों है',
    trustOne: 'Seller listings अभी भी WhatsApp onboarding और listing flow से आती हैं।',
    trustTwo: 'Pickup locations खरीदारों को दिखाने से पहले normalize की जाती हैं।',
    trustThree: 'AI quality notes तभी दिखते हैं जब image या text signals pipeline में पहले से मौजूद हों।',
    alertsTitle: 'Alerts और insight',
    insightEmpty: 'Order activity के बाद seller copilot insight दिखाई देगा।',
    kg: 'किलो',
    currency: 'रु',
  },
};

export default function BuyerWorkspace({
  language,
  onLanguageChange,
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
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
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
  const copy = buyerCopy[language];
  const acceptedOrders = orders.filter((order) => order.status === 'accepted' || order.status === 'completed').length;
  const avgPrice = listings.length > 0
    ? Math.round(listings.reduce((total, item) => total + item.price_per_kg, 0) / listings.length)
    : 0;

  return (
    <div className="workspace-shell">
      <section className="workspace-hero buyer-hero">
        <div>
          <div className="workspace-title-row">
            <span className="eyebrow">{copy.eyebrow}</span>
            <div className="language-switcher" aria-label="Language switcher">
              <button type="button" className={language === 'en' ? 'language-switch-active' : ''} onClick={() => onLanguageChange('en')}>EN</button>
              <button type="button" className={language === 'hi' ? 'language-switch-active' : ''} onClick={() => onLanguageChange('hi')}>HI</button>
            </div>
          </div>
          <h1>{copy.title}</h1>
          <p>{copy.body.replace('{name}', buyerName)}</p>
        </div>
        <div className="dashboard-live-panel card buyer-live-panel">
          <div className="live-panel-header">
            <span className="live-dot" />
            <span>{copy.pulse}</span>
          </div>
          <div className="produce-orbit" aria-hidden="true">
            <span className="orbit-ring" />
            <span className="produce-chip produce-chip-1">{language === 'hi' ? 'टमाटर' : 'Tomato'}</span>
            <span className="produce-chip produce-chip-2">{language === 'hi' ? 'प्याज' : 'Onion'}</span>
            <span className="produce-chip produce-chip-3">{language === 'hi' ? 'साग' : 'Greens'}</span>
          </div>
          <div className="live-panel-actions">
            <button className="primary-button" onClick={onRefresh}>{loading ? copy.refreshing : copy.refresh}</button>
            <button className="ghost-button" onClick={onReset}>{copy.reset}</button>
          </div>
        </div>
      </section>

      <section className="workspace-kpis">
        <article className="card workspace-kpi">
          <span>{copy.listings}</span>
          <strong>{listings.length}</strong>
        </article>
        <article className="card workspace-kpi">
          <span>{copy.sellers}</span>
          <strong>{sellers.length}</strong>
        </article>
        <article className="card workspace-kpi">
          <span>{copy.orders}</span>
          <strong>{acceptedOrders}</strong>
        </article>
        <article className="card workspace-kpi">
          <span>{copy.avg}</span>
          <strong>{copy.currency} {avgPrice}/{copy.kg}</strong>
        </article>
      </section>

      <Filters query={query} setQuery={onQueryChange} maxPrice={maxPrice} setMaxPrice={onMaxPriceChange} language={language} />

      <main className="content-grid buyer-grid">
        <section>
          <div className="section-header">
            <div>
              <h2>{copy.marketplace}</h2>
              <p className="muted compact">{copy.marketplaceBody}</p>
            </div>
            <span>{loading ? copy.loading : `${listings.length} ${copy.matches}`}</span>
          </div>
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} language={language} onOrder={onOrder} />
            ))}
          </div>
          {!loading && listings.length === 0 && <p className="muted">{copy.noMatches}</p>}
        </section>

        <aside className="status-panel">
          <section className="card">
            <div className="panel-header">
              <div>
                <h3>{copy.sellerSpotlight}</h3>
                <p className="muted compact">{copy.sellerSpotlightBody}</p>
              </div>
              {sellers.length > 0 && (
                <label className="seller-selector">
                  <span className="label">{copy.seller}</span>
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
                  <span className="label">{copy.liveStock}</span>
                  <strong>{dashboard.total_available_kg} {copy.kg}</strong>
                </div>
                <div className="metric-tile">
                  <span className="label">{copy.pendingOrders}</span>
                  <strong>{dashboard.pending_orders}</strong>
                </div>
                <div className="metric-tile">
                  <span className="label">{copy.repeatBuyers}</span>
                  <strong>{dashboard.repeat_customers}</strong>
                </div>
                <div className="metric-tile">
                  <span className="label">{copy.pickup}</span>
                  <strong>{dashboard.default_pickup_location || copy.notSet}</strong>
                </div>
              </div>
            ) : (
              <p className="muted">{copy.selectSeller}</p>
            )}
          </section>

          <section className="card">
            <h3>{copy.trustTitle}</h3>
            <ul className="bullet-list">
              <li>{copy.trustOne}</li>
              <li>{copy.trustTwo}</li>
              <li>{copy.trustThree}</li>
            </ul>
          </section>

          <section className="card">
            <h3>{copy.alertsTitle}</h3>
            {insight ? (
              <div className="insight-block">
                <strong>{insight.headline}</strong>
                <p>{insight.message}</p>
              </div>
            ) : (
              <p className="muted">{copy.insightEmpty}</p>
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
