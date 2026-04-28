import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { AppLanguage } from '../App';

type LandingStats = {
  liveListings: number;
  activeSellers: number;
  acceptedOrders: number;
  alertsSent: number;
};

type Activity = {
  label: string;
  meta: string;
  value: string;
};

type PreviewMessage = {
  side: 'left' | 'right';
  type: 'notice' | 'text' | 'choice' | 'voice' | 'card';
  text: string;
  title?: string;
};

const produceFlow = [
  { name: 'Onion', share: 72, tone: 'green' },
  { name: 'Tomato', share: 58, tone: 'orange' },
  { name: 'Potato', share: 84, tone: 'blue' },
  { name: 'Leafy greens', share: 46, tone: 'mint' },
];

const activityStream: Activity[] = [
  { label: 'New order accepted', meta: 'Azadpur pickup', value: '2m ago' },
  { label: 'Seller inventory synced', meta: 'Fresh tomato lot', value: '8m ago' },
  { label: 'Buyer demand matched', meta: 'Onion under Rs 24/kg', value: '12m ago' },
  { label: 'Ledger note recorded', meta: 'Khata update captured', value: '18m ago' },
];

const trustSignals = [
  'Phone-linked seller access',
  'Live listing freshness',
  'Order and ledger visibility',
  'Buyer demand intelligence',
];

const landingCopy = {
  en: {
    brand: 'Fresh produce operating dashboard',
    navProblem: 'Problem',
    navSolution: 'Solution',
    navHow: 'How It Works',
    navDashboard: 'Dashboard',
    login: 'Login',
    open: 'Open dashboard',
    badge: 'Live commerce command center',
    title: 'BolBazaar keeps produce trade moving in real time.',
    lead: 'BolBazaar connects WhatsApp-first sellers with buyers through live inventory, order tracking, khata visibility, and a clean SaaS dashboard for daily market operations.',
    buyerCta: 'Explore marketplace',
    sellerCta: 'View seller dashboard',
    problemEyebrow: 'Problem',
    problemTitle: 'Local produce trade is active, but the operating data is scattered.',
    problemBody: 'Sellers share inventory in chats, buyers negotiate across calls, and khata records stay informal. BolBazaar turns that activity into a shared operating system.',
    solutionEyebrow: 'Solution',
    solutionTitle: 'One WhatsApp-friendly workflow, two polished product surfaces.',
    solutionBody: 'Sellers keep using familiar chat behavior, while buyers and sellers get structured dashboards for search, order movement, ledger visibility, and alerts.',
    howEyebrow: 'How It Works',
    howTitle: 'A seller message becomes marketplace inventory and dashboard intelligence.',
    howBody: 'The phone preview shows the familiar chat flow. The dashboard beside it shows how the same signals become live listings, demand alerts, and operational metrics.',
    phoneTitle: 'WhatsApp seller preview',
    phoneSubtitle: 'Scrollable English and Hindi chat',
    dashboardTitle: 'Marketplace Overview',
    sync: 'Sync account',
    operationsTitle: 'A SaaS cockpit for sellers, buyers, orders, and khata.',
    operationsBody: 'BolBazaar brings the daily moving parts of produce commerce into dashboards that are easier to scan, refresh, and act on.',
  },
  hi: {
    brand: 'Fresh produce operating dashboard',
    navProblem: 'Problem',
    navSolution: 'Solution',
    navHow: 'How It Works',
    navDashboard: 'Dashboard',
    login: 'Login',
    open: 'Dashboard खोलें',
    badge: 'Live commerce command center',
    title: 'BolBazaar produce trade को real time में चलाता है.',
    lead: 'BolBazaar WhatsApp-first sellers को buyers से जोड़ता है, जिसमें live inventory, order tracking, khata visibility और daily market operations के लिए clean SaaS dashboard मिलता है.',
    buyerCta: 'Marketplace देखें',
    sellerCta: 'Seller dashboard देखें',
    problemEyebrow: 'Problem',
    problemTitle: 'Local produce trade active है, लेकिन operating data scattered रहता है.',
    problemBody: 'Sellers chats में inventory भेजते हैं, buyers calls पर negotiate करते हैं, और khata informal रहता है. BolBazaar इस activity को shared operating system में बदलता है.',
    solutionEyebrow: 'Solution',
    solutionTitle: 'एक WhatsApp-friendly workflow, और दो polished product surfaces.',
    solutionBody: 'Sellers familiar chat behavior रख सकते हैं, जबकि buyers और sellers को search, order movement, ledger visibility और alerts के लिए structured dashboards मिलते हैं.',
    howEyebrow: 'How It Works',
    howTitle: 'Seller message marketplace inventory और dashboard intelligence बनता है.',
    howBody: 'Phone preview familiar chat flow दिखाता है. साथ वाला dashboard दिखाता है कि वही signals live listings, demand alerts और operational metrics कैसे बनते हैं.',
    phoneTitle: 'WhatsApp seller preview',
    phoneSubtitle: 'Scrollable English और Hindi chat',
    dashboardTitle: 'Marketplace Overview',
    sync: 'Account sync करें',
    operationsTitle: 'Sellers, buyers, orders और khata के लिए SaaS cockpit.',
    operationsBody: 'BolBazaar produce commerce के daily moving parts को ऐसे dashboards में लाता है जिन्हें scan, refresh और act करना आसान है.',
  },
};

const whatsappPreviewThreads: Record<AppLanguage, PreviewMessage[]> = {
  en: [
    { side: 'left', type: 'notice', text: 'BolBazaar seller workflow' },
    { side: 'right', type: 'text', text: 'Hi, I want to list today stock' },
    { side: 'left', type: 'text', text: 'Welcome to BolBazaar. Send product, quantity, price, and pickup location.' },
    { side: 'right', type: 'voice', text: 'Voice note: 30 kg tomato, Rs 28 per kg, Okhla pickup' },
    { side: 'left', type: 'card', title: 'Listing created', text: 'Tomato | 30 kg | Rs 28/kg | Okhla pickup' },
    { side: 'left', type: 'text', text: 'Buyer demand found nearby. Alert sent to matching buyers.' },
    { side: 'right', type: 'text', text: 'Show khata' },
    { side: 'left', type: 'card', title: 'Khata summary', text: 'Rs 680 due | 3 recent ledger notes | 1 payment pending' },
  ],
  hi: [
    { side: 'left', type: 'notice', text: 'BolBazaar seller workflow' },
    { side: 'right', type: 'text', text: 'नमस्ते, आज का stock list करना है' },
    { side: 'left', type: 'text', text: 'BolBazaar में आपका स्वागत है. Product, quantity, price और pickup location भेजें.' },
    { side: 'right', type: 'voice', text: 'Voice note: 30 किलो टमाटर, Rs 28 per kg, Okhla pickup' },
    { side: 'left', type: 'card', title: 'Listing created', text: 'Tomato | 30 kg | Rs 28/kg | Okhla pickup' },
    { side: 'left', type: 'text', text: 'Nearby buyer demand मिला. Matching buyers को alert भेजा गया.' },
    { side: 'right', type: 'text', text: 'खाता दिखाओ' },
    { side: 'left', type: 'card', title: 'Khata summary', text: 'Rs 680 due | 3 recent ledger notes | 1 payment pending' },
  ],
};

function scrollToSection(id: string) {
  if (typeof document === 'undefined') {
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LandingPage({
  language,
  onLanguageChange,
  stats,
  onOpenLogin,
}: {
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
  stats: LandingStats;
  onOpenLogin: (role: 'buyer' | 'seller' | null) => void;
}) {
  const [pulseIndex, setPulseIndex] = useState(0);
  const copy = landingCopy[language];
  const activePreviewThread = whatsappPreviewThreads[language];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPulseIndex((index) => (index + 1) % activityStream.length);
    }, 2200);

    return () => window.clearInterval(timer);
  }, []);

  const dashboardStats = useMemo(
    () => [
      { label: 'Live listings', value: stats.liveListings || 24, delta: '+12%', accent: 'green' },
      { label: 'Active sellers', value: stats.activeSellers || 8, delta: '+4 today', accent: 'orange' },
      { label: 'Orders closed', value: stats.acceptedOrders || 16, delta: '91% fill rate', accent: 'blue' },
      { label: 'Alerts sent', value: stats.alertsSent || 31, delta: 'Live demand', accent: 'mint' },
    ],
    [stats],
  );

  return (
    <div className="landing-shell saas-landing">
      <header className="landing-nav saas-nav">
        <button type="button" className="landing-brand" onClick={() => scrollToSection('hero')}>
          <span className="landing-brand-mark">BB</span>
          <span className="landing-brand-text">
            <strong>BolBazaar</strong>
            <small>{copy.brand}</small>
          </span>
        </button>

        <nav className="landing-nav-links" aria-label="Landing page sections">
          <button type="button" className="landing-nav-link" onClick={() => scrollToSection('problem')}>
            {copy.navProblem}
          </button>
          <button type="button" className="landing-nav-link" onClick={() => scrollToSection('solution')}>
            {copy.navSolution}
          </button>
          <button type="button" className="landing-nav-link" onClick={() => scrollToSection('how-it-works')}>
            {copy.navHow}
          </button>
          <button type="button" className="landing-nav-link" onClick={() => scrollToSection('dashboard')}>
            {copy.navDashboard}
          </button>
        </nav>

        <div className="landing-nav-actions">
          <div className="language-switcher" aria-label="Language switcher">
            <button type="button" className={language === 'en' ? 'language-switch-active' : ''} onClick={() => onLanguageChange('en')}>EN</button>
            <button type="button" className={language === 'hi' ? 'language-switch-active' : ''} onClick={() => onLanguageChange('hi')}>HI</button>
          </div>
          <button type="button" className="ghost-button small" onClick={() => onOpenLogin(null)}>
            {copy.login}
          </button>
          <button type="button" className="primary-button small" onClick={() => onOpenLogin('seller')}>
            {copy.open}
          </button>
        </div>
      </header>

      <section id="hero" className="saas-hero">
        <div className="saas-hero-copy">
          <span className="landing-badge">{copy.badge}</span>
          <h1 className="landing-display">{copy.title}</h1>
          <p className="landing-lead">{copy.lead}</p>

          <div className="hero-action-row">
            <button type="button" className="primary-button" onClick={() => onOpenLogin('buyer')}>
              {copy.buyerCta}
            </button>
            <button type="button" className="ghost-button" onClick={() => onOpenLogin('seller')}>
              {copy.sellerCta}
            </button>
          </div>

          <div className="landing-proof-row">
            {trustSignals.map((signal) => (
              <span key={signal} className="landing-proof-chip">
                {signal}
              </span>
            ))}
          </div>
        </div>

        <aside id="dashboard" className="saas-dashboard card" aria-label="Live BolBazaar dashboard preview">
          <div className="saas-dashboard-top">
            <div>
              <span className="live-dot" />
              <span className="mini-pill">Live now</span>
              <h2>{copy.dashboardTitle}</h2>
            </div>
            <button type="button" className="ghost-button small" onClick={() => onOpenLogin(null)}>
              {copy.sync}
            </button>
          </div>

          <div className="saas-kpi-grid">
            {dashboardStats.map((item) => (
              <article key={item.label} className={`saas-kpi-card saas-tone-${item.accent}`}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.delta}</small>
              </article>
            ))}
          </div>

          <div className="saas-live-grid">
            <section className="saas-panel saas-chart-panel">
              <div className="saas-panel-head">
                <strong>Supply Flow</strong>
                <span>Today</span>
              </div>
              <div className="saas-bars">
                {produceFlow.map((item) => (
                  <div key={item.name} className="saas-bar-row">
                    <span>{item.name}</span>
                    <div className="saas-bar-track">
                      <div className={`saas-bar-fill saas-tone-${item.tone}`} style={{ width: `${item.share}%` }} />
                    </div>
                    <strong>{item.share}%</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="saas-panel saas-activity-panel">
              <div className="saas-panel-head">
                <strong>Live Activity</strong>
                <span>Auto-refresh</span>
              </div>
              <div className="saas-activity-list">
                {activityStream.map((activity, index) => (
                  <article key={activity.label} className={index === pulseIndex ? 'is-active' : ''}>
                    <span className="saas-activity-dot" />
                    <div>
                      <strong>{activity.label}</strong>
                      <small>{activity.meta}</small>
                    </div>
                    <em>{activity.value}</em>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </section>

      <section id="problem" className="landing-section saas-story-section">
        <div className="section-heading">
          <span className="eyebrow">{copy.problemEyebrow}</span>
          <h2>{copy.problemTitle}</h2>
          <p>{copy.problemBody}</p>
        </div>
        <div className="saas-story-grid">
          <article className="card saas-story-card">
            <span className="mini-pill">01</span>
            <h3>Inventory disappears inside chats.</h3>
            <p>Fresh stock changes quickly, but buyers cannot always see what is available now.</p>
          </article>
          <article className="card saas-story-card">
            <span className="mini-pill">02</span>
            <h3>Trust signals are hard to read.</h3>
            <p>Pickup, seller activity, order status, and ledger context need one reliable place.</p>
          </article>
          <article className="card saas-story-card">
            <span className="mini-pill">03</span>
            <h3>Manual follow-up slows trade.</h3>
            <p>BolBazaar turns repeated daily actions into structured workflows and live alerts.</p>
          </article>
        </div>
      </section>

      <section id="solution" className="landing-section saas-story-section">
        <div className="section-heading">
          <span className="eyebrow">{copy.solutionEyebrow}</span>
          <h2>{copy.solutionTitle}</h2>
          <p>{copy.solutionBody}</p>
        </div>
      </section>

      <section id="how-it-works" className="landing-section saas-how-section">
        <div className="section-heading">
          <span className="eyebrow">{copy.howEyebrow}</span>
          <h2>{copy.howTitle}</h2>
          <p>{copy.howBody}</p>
        </div>

        <div className="landing-demo-layout saas-phone-layout">
          <aside className="card landing-phone-card">
            <div className="landing-phone-header">
              <div>
                <span className="mini-pill">{copy.phoneSubtitle}</span>
                <h3>{copy.phoneTitle}</h3>
              </div>
              <div className="landing-phone-language-switch" role="tablist" aria-label="WhatsApp preview language">
                <button type="button" className={`landing-phone-language-button ${language === 'en' ? 'landing-phone-language-button-active' : ''}`} onClick={() => onLanguageChange('en')}>English</button>
                <button type="button" className={`landing-phone-language-button ${language === 'hi' ? 'landing-phone-language-button-active' : ''}`} onClick={() => onLanguageChange('hi')}>हिंदी</button>
              </div>
            </div>

            <div className="landing-phone-shell">
              <span className="landing-phone-side-button landing-phone-side-button-top" aria-hidden="true" />
              <span className="landing-phone-side-button landing-phone-side-button-mid" aria-hidden="true" />
              <div className="landing-phone-screen">
                <div className="landing-phone-statusbar">
                  <span>9:41</span>
                  <span>5G 88%</span>
                </div>
                <div className="landing-phone-notch" aria-hidden="true" />
                <div className="landing-phone-topbar">
                  <div className="landing-phone-avatar">BB</div>
                  <div>
                    <strong>BolBazaar</strong>
                    <span>Seller workflow</span>
                  </div>
                  <div className="landing-phone-status">Online</div>
                </div>

                <div className="landing-chat-thread">
                  {activePreviewThread.map((message, index) => (
                    <div key={`${language}-${index}-${message.text}`} className={`landing-chat-row ${message.side === 'right' ? 'landing-chat-row-right' : ''}`}>
                      <div className={`landing-chat-bubble landing-chat-bubble-${message.type}`}>
                        {message.title && <strong>{message.title}</strong>}
                        {message.type === 'voice' && <span className="landing-chat-wave" aria-hidden="true" />}
                        <p>{message.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="landing-phone-input">
                  <span className="landing-phone-input-pill">Voice</span>
                  <span className="landing-phone-input-pill">Listings</span>
                  <span className="landing-phone-input-pill">Khata</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="card saas-flow-card">
            <span className="mini-pill">Workflow</span>
            <h3>Chat signals become operating data.</h3>
            <div className="saas-flow-steps">
              <span>WhatsApp message</span>
              <span>Listing and khata extraction</span>
              <span>Buyer marketplace update</span>
              <span>Seller dashboard alert</span>
            </div>
          </div>
        </div>
      </section>

      <section id="operations" className="landing-section saas-section">
        <div className="section-heading">
          <span className="eyebrow">Operations</span>
          <h2>{copy.operationsTitle}</h2>
          <p>{copy.operationsBody}</p>
        </div>

        <div className="saas-ops-grid">
          <article className="card saas-ops-card">
            <span className="mini-pill">Seller control</span>
            <h3>Inventory and order readiness in one place.</h3>
            <p>Track active listings, available quantity, accepted orders, pickup location, and customer activity.</p>
            <div className="saas-mini-metrics">
              <div>
                <strong>{stats.liveListings || 24}</strong>
                <span>Listings</span>
              </div>
              <div>
                <strong>{stats.activeSellers || 8}</strong>
                <span>Sellers</span>
              </div>
            </div>
          </article>

          <article className="card saas-ops-card">
            <span className="mini-pill">Buyer demand</span>
            <h3>Search behavior turns into marketplace intelligence.</h3>
            <p>Demand searches can surface matches, price intent, and seller-side alerts before inventory goes stale.</p>
            <div className="saas-demand-radar">
              <span style={{ '--size': '86%' } as CSSProperties} />
              <span style={{ '--size': '62%' } as CSSProperties} />
              <span style={{ '--size': '38%' } as CSSProperties} />
              <strong>Live</strong>
            </div>
          </article>

          <article className="card saas-ops-card">
            <span className="mini-pill">Ledger clarity</span>
            <h3>Khata activity stays visible with orders.</h3>
            <p>Outstanding amounts and ledger entries sit beside operational activity instead of being buried in chat.</p>
            <div className="saas-ledger-list">
              <span><strong>Paid</strong><em>Rs 1,240</em></span>
              <span><strong>Due</strong><em>Rs 680</em></span>
              <span><strong>Review</strong><em>3 notes</em></span>
            </div>
          </article>
        </div>
      </section>

      <section id="market" className="landing-section saas-market-section">
        <div className="section-heading">
          <span className="eyebrow">Market</span>
          <h2>Built for repeated daily use, not a static storefront.</h2>
          <p>
            The buyer marketplace and seller dashboard share the same operating data, so every action updates the
            wider BolBazaar system.
          </p>
        </div>

        <div className="saas-market-grid">
          <article className="card saas-market-card">
            <div className="saas-panel-head">
              <strong>Buyer Marketplace</strong>
              <span>Search, compare, order</span>
            </div>
            <div className="landing-preview-frame">
              <div className="landing-preview-row">
                <strong>Fresh listings</strong>
                <span>Filter by product, price, seller, and pickup area.</span>
              </div>
              <div className="landing-preview-row">
                <strong>Seller context</strong>
                <span>Use activity signals to choose with more confidence.</span>
              </div>
              <div className="landing-preview-row">
                <strong>Order loop</strong>
                <span>Place structured orders that sellers can accept quickly.</span>
              </div>
            </div>
          </article>

          <article className="card saas-market-card">
            <div className="saas-panel-head">
              <strong>Seller Dashboard</strong>
              <span>Inventory, orders, khata</span>
            </div>
            <div className="landing-preview-frame">
              <div className="landing-preview-row">
                <strong>Live KPIs</strong>
                <span>Listings, quantity, revenue, pending orders, and repeat customers.</span>
              </div>
              <div className="landing-preview-row">
                <strong>Recent activity</strong>
                <span>Orders, alerts, and ledger events stay easy to review.</span>
              </div>
              <div className="landing-preview-row">
                <strong>One identity</strong>
                <span>Phone-linked access keeps seller operations connected.</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="card landing-cta-panel saas-cta-panel">
        <div>
          <span className="eyebrow">Start operating</span>
          <h2>Open BolBazaar and move directly into the right workspace.</h2>
          <p>Login with phone OTP, then continue as a buyer or seller with live marketplace data already loaded.</p>
        </div>

        <div className="landing-cta-actions">
          <button type="button" className="primary-button" onClick={() => onOpenLogin(null)}>
            Login with OTP
          </button>
          <button type="button" className="ghost-button" onClick={() => onOpenLogin('buyer')}>
            Buyer view
          </button>
          <button type="button" className="ghost-button" onClick={() => onOpenLogin('seller')}>
            Seller view
          </button>
        </div>
      </section>
    </div>
  );
}
