import { useMemo, useState } from 'react';

type LandingStats = {
  liveListings: number;
  activeSellers: number;
  acceptedOrders: number;
  alertsSent: number;
};

type ExperienceId = 'whatsapp' | 'buyer' | 'seller';
type ArchitectureNodeId = 'intake' | 'speech' | 'intelligence' | 'marketplace' | 'auth' | 'buyer' | 'seller' | 'alerts';
type WorkflowStageId = 'capture' | 'understand' | 'structure' | 'activate' | 'close';
type PreviewLanguage = 'english' | 'hindi';
type WorkflowCanvasNode = {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  tone: 'mint' | 'rose' | 'amber' | 'sky' | 'violet' | 'teal';
  stage?: WorkflowStageId;
};
type PreviewMessage = {
  side: 'left' | 'right';
  type: 'notice' | 'text' | 'choice' | 'voice' | 'card';
  text: string;
  title?: string;
};

const problemCards = [
  {
    kicker: 'Discovery friction',
    title: 'Supply is live, but visibility is broken.',
    body: 'Fresh produce availability still moves through scattered WhatsApp chats, calls, and informal groups, so buyers cannot reliably discover what is actually available right now.',
  },
  {
    kicker: 'Trust gap',
    title: 'Sellers already work on WhatsApp.',
    body: 'Any solution that forces a separate seller app creates drop-off. The working behavior is already on WhatsApp, so the product has to respect that instead of replacing it.',
  },
  {
    kicker: 'Ops blind spot',
    title: 'Khata, orders, and verification stay hidden in chat.',
    body: 'Important operating signals live inside messages and voice notes. Without structure, there is no clean seller cockpit and no buyer-facing confidence layer.',
  },
];

const experienceModes = [
  {
    id: 'whatsapp' as const,
    label: 'WhatsApp seller flow',
    eyebrow: 'Surface 01',
    title: 'Keep the seller where the seller already is.',
    description:
      'BolBazaar does not force sellers into a new tool. Onboarding, listing creation, verification, voice notes, and khata updates continue inside WhatsApp so adoption stays realistic.',
    metrics: [
      { label: 'Primary input', value: 'Text, image, voice' },
      { label: 'Key actions', value: 'List, khata, orders' },
      { label: 'Why it matters', value: 'Zero behavior change' },
    ],
    bullets: [
      'Seller login stays tied to the same phone number used in WhatsApp.',
      'Voice notes and natural language can trigger menu actions in Hindi and English.',
      'The seller menu remains aligned with the existing backend flow instead of becoming a separate product.',
    ],
    compliance:
      'This is the compliance anchor: the dashboard mirrors WhatsApp activity, but seller operations still originate from the WhatsApp experience already in place.',
  },
  {
    id: 'buyer' as const,
    label: 'Buyer marketplace',
    eyebrow: 'Surface 02',
    title: 'Turn unstructured supply into a clean buying surface.',
    description:
      'Once seller messages become structured inventory, buyers get a modern marketplace to filter produce, compare pickup locations, and place orders with more confidence.',
    metrics: [
      { label: 'Buyer action', value: 'Search and compare' },
      { label: 'Trust layer', value: 'Pickup + seller context' },
      { label: 'Outcome', value: 'Faster ordering' },
    ],
    bullets: [
      'Live listings, seller spotlight, and price filtering make the marketplace feel credible in a demo setting.',
      'Buyers can see seller activity signals without needing access to seller-side tooling.',
      'Demand searches can feed back into seller alerts and marketplace intelligence.',
    ],
    compliance:
      'The buyer web layer is new, but the source of truth for supply still comes from WhatsApp-generated seller data.',
  },
  {
    id: 'seller' as const,
    label: 'Seller control tower',
    eyebrow: 'Surface 03',
    title: 'Give sellers visibility without changing their channel.',
    description:
      'The seller interface becomes a control tower for stats, ongoing orders, khata, verification state, and recent listings while still reflecting the WhatsApp-first operating model.',
    metrics: [
      { label: 'Ops view', value: 'Stats + khata + alerts' },
      { label: 'Decision point', value: 'Accept or reject orders' },
      { label: 'Pitch value', value: 'Judge-ready dashboard' },
    ],
    bullets: [
      'Dashboard metrics make the solution feel like a real operating product rather than a chat demo.',
      'Khata entries from voice or text become visible, reviewable records.',
      'Seller verification, recent listings, and notifications are visible in one place for the hackathon story.',
    ],
    compliance:
      'The seller dashboard is a mirror and control layer, not a replacement for WhatsApp onboarding, listing capture, or ledger notes.',
  },
];

const architectureNodes = [
  {
    id: 'intake' as const,
    title: 'WhatsApp Intake',
    tag: 'Entry point',
    subtitle: 'Messages, images, voice notes',
    body: 'Inbound seller activity lands through the WhatsApp webhook, preserving the original operating channel instead of bypassing it.',
    points: ['Seller onboarding', 'Menu navigation', 'Listing capture'],
  },
  {
    id: 'speech' as const,
    title: 'Speech Layer',
    tag: 'Language bridge',
    subtitle: 'Voice to command and ledger intent',
    body: 'Voice notes are transcribed with Hindi and English hints so natural spoken commands like khata, menu, or orders can be understood.',
    points: ['Hindi + English transcription', 'Voice-note menu control', 'Khata intent support'],
  },
  {
    id: 'intelligence' as const,
    title: 'AI Structuring',
    tag: 'Intelligence',
    subtitle: 'Listings, quality, ledger parsing',
    body: 'Unstructured messages are turned into clean product records, pickup context, quality signals, and ledger updates that the web layers can trust.',
    points: ['Listing extraction', 'Quality signals', 'Ledger parsing'],
  },
  {
    id: 'marketplace' as const,
    title: 'Marketplace Core',
    tag: 'System of record',
    subtitle: 'Orders, sellers, listings, insights',
    body: 'The core service stores listings, dashboards, orders, notifications, and insights so both the buyer and seller interfaces stay synchronized.',
    points: ['Shared data model', 'Order orchestration', 'Seller insights'],
  },
  {
    id: 'auth' as const,
    title: 'Role Login + OTP',
    tag: 'Access layer',
    subtitle: 'Buyer vs seller interface split',
    body: 'Role-based login lets the same frontend open different surfaces while seller identity stays attached to the WhatsApp number.',
    points: ['Buyer login', 'Seller login', 'Phone-number identity'],
  },
  {
    id: 'buyer' as const,
    title: 'Buyer Interface',
    tag: 'Web surface',
    subtitle: 'Search, compare, order',
    body: 'Buyers get a marketplace-first experience with searchable listings, seller context, and a clearer ordering flow.',
    points: ['Live listings', 'Filters', 'Order placement'],
  },
  {
    id: 'seller' as const,
    title: 'Seller Interface',
    tag: 'Web surface',
    subtitle: 'Stats, khata, listings, profile',
    body: 'Sellers get a dashboard that surfaces ongoing orders, outstanding khata, recent listings, alerts, and verification status.',
    points: ['KPI dashboard', 'Khata review', 'Order response'],
  },
  {
    id: 'alerts' as const,
    title: 'Notification Loop',
    tag: 'Closing the loop',
    subtitle: 'Alerts and buyer demand signals',
    body: 'The system can turn activity into seller-facing alerts and buyer-demand signals, making the platform feel operational rather than static.',
    points: ['Order alerts', 'Demand insight', 'Operational feedback'],
  },
];

const proofPills = [
  'No separate seller app required',
  'Hindi and English friendly',
  'Voice + text + image inputs',
  'Buyer and seller web split',
];

const workflowStages = [
  {
    id: 'capture' as const,
    icon: 'WA',
    title: 'Seller on WhatsApp',
    subtitle: 'Text, image, or voice note',
    body: 'The seller stays in WhatsApp for onboarding, listings, menu commands, and khata notes. That is the behavioral starting point of the product.',
  },
  {
    id: 'understand' as const,
    icon: 'AI',
    title: 'Speech + command understanding',
    subtitle: 'Hindi and English aware',
    body: 'Voice notes and natural messages are recognized as real intents such as khata, menu, dashboard, or listing capture, instead of being treated as raw chat noise.',
  },
  {
    id: 'structure' as const,
    icon: 'DB',
    title: 'Structured marketplace layer',
    subtitle: 'Listings, pickup, ledger, verification',
    body: 'The backend turns conversation into structured records so the product can show reliable listings, seller state, and ledger activity.',
  },
  {
    id: 'activate' as const,
    icon: 'UX',
    title: 'Role-based product surfaces',
    subtitle: 'Buyer web + seller dashboard',
    body: 'Buyers and sellers see different interfaces after OTP login, but both are powered by the same WhatsApp-origin data model.',
  },
  {
    id: 'close' as const,
    icon: 'LOOP',
    title: 'Orders and alerts loop back',
    subtitle: 'Control layer, not a channel split',
    body: 'Orders, alerts, and khata updates stay connected to the WhatsApp workflow so the demo remains compliant with the original seller operating pattern.',
  },
];

const workflowCanvasNodes: WorkflowCanvasNode[] = [
  {
    id: 'seller_whatsapp',
    tag: 'WA',
    title: 'Seller',
    subtitle: 'WhatsApp',
    x: 14,
    y: 18,
    tone: 'mint',
    stage: 'capture',
  },
  {
    id: 'voice_intent',
    tag: 'AI',
    title: 'Voice + Text',
    subtitle: 'Hindi / English',
    x: 37,
    y: 18,
    tone: 'rose',
    stage: 'understand',
  },
  {
    id: 'marketplace_core',
    tag: 'CORE',
    title: 'Marketplace Core',
    subtitle: 'Listings + khata + trust',
    x: 61,
    y: 18,
    tone: 'amber',
    stage: 'structure',
  },
  {
    id: 'web_surfaces',
    tag: 'WEB',
    title: 'Web Surfaces',
    subtitle: 'Buyer + seller',
    x: 84,
    y: 18,
    tone: 'sky',
    stage: 'activate',
  },
  {
    id: 'otp_login',
    tag: 'OTP',
    title: 'OTP Login',
    subtitle: 'Role split',
    x: 20,
    y: 72,
    tone: 'violet',
  },
  {
    id: 'alerts_loop',
    tag: 'LOOP',
    title: 'Demand + Alerts',
    subtitle: 'Loopback signals',
    x: 44,
    y: 72,
    tone: 'teal',
    stage: 'close',
  },
  {
    id: 'buyer_view',
    tag: 'BUYER',
    title: 'Buyer View',
    subtitle: 'Search + order',
    x: 68,
    y: 72,
    tone: 'mint',
    stage: 'activate',
  },
  {
    id: 'seller_view',
    tag: 'SELLER',
    title: 'Seller View',
    subtitle: 'Stats + khata',
    x: 84,
    y: 72,
    tone: 'sky',
    stage: 'activate',
  },
];

const workflowCanvasConnections = [
  ['seller_whatsapp', 'voice_intent'],
  ['voice_intent', 'marketplace_core'],
  ['marketplace_core', 'web_surfaces'],
  ['marketplace_core', 'alerts_loop'],
  ['otp_login', 'buyer_view'],
  ['otp_login', 'seller_view'],
  ['web_surfaces', 'buyer_view'],
  ['web_surfaces', 'seller_view'],
  ['alerts_loop', 'seller_view'],
] as const;

const whatsappPreviewThreads: Record<PreviewLanguage, PreviewMessage[]> = {
  english: [
    { side: 'left', type: 'notice', text: 'Live seller workflow on WhatsApp' },
    { side: 'right', type: 'text', text: 'Hi' },
    { side: 'left', type: 'text', text: 'Welcome to BolBazaar. Choose your preferred language.' },
    { side: 'right', type: 'choice', text: 'English' },
    { side: 'left', type: 'card', title: 'Seller menu', text: 'Dashboard, listings, khata, profile, verification' },
    { side: 'right', type: 'voice', text: 'Voice note: "Khata dikhao"' },
    { side: 'left', type: 'text', text: 'Outstanding due: Rs 400 from buyer 7076. 1 khata entry recorded.' },
    { side: 'right', type: 'text', text: '20 kilo onion, 20 rupees kilo, Okhla pickup' },
    { side: 'left', type: 'card', title: 'Listing live', text: 'Onion | 20 kg | Rs 20/kg | Buyer demand alert sent' },
  ],
  hindi: [
    { side: 'left', type: 'notice', text: 'WhatsApp पर seller workflow' },
    { side: 'right', type: 'text', text: 'नमस्ते' },
    { side: 'left', type: 'text', text: 'BolBazaar में आपका स्वागत है। अपनी पसंद की भाषा चुनें।' },
    { side: 'right', type: 'choice', text: 'हिंदी' },
    { side: 'left', type: 'card', title: 'Seller menu', text: 'डैशबोर्ड, लिस्टिंग, खाता, प्रोफाइल, verification tools' },
    { side: 'right', type: 'voice', text: 'आवाज़: "खाता दिखाओ"' },
    { side: 'left', type: 'text', text: 'Buyer 7076 पर Rs 400 बाकी हैं। 1 खाता एंट्री दर्ज है।' },
    { side: 'right', type: 'text', text: '20 किलो प्याज, 20 रुपये किलो, ओखला पिकअप' },
    { side: 'left', type: 'card', title: 'Listing live', text: 'प्याज | 20 किलो | Rs 20/किलो | buyer alert भेजा गया' },
  ],
};

function scrollToSection(id: string) {
  if (typeof document === 'undefined') {
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LandingPage({
  stats,
  onOpenLogin,
}: {
  stats: LandingStats;
  onOpenLogin: (role: 'buyer' | 'seller' | null) => void;
}) {
  const [activeExperienceId, setActiveExperienceId] = useState<ExperienceId>('whatsapp');
  const [activeNodeId, setActiveNodeId] = useState<ArchitectureNodeId>('intake');
  const [activeWorkflowStageId, setActiveWorkflowStageId] = useState<WorkflowStageId>('capture');
  const [previewLanguage, setPreviewLanguage] = useState<PreviewLanguage>('english');

  const activeExperience = useMemo(
    () => experienceModes.find((item) => item.id === activeExperienceId) || experienceModes[0],
    [activeExperienceId],
  );
  const activeNode = useMemo(
    () => architectureNodes.find((item) => item.id === activeNodeId) || architectureNodes[0],
    [activeNodeId],
  );
  const activeWorkflowStage = useMemo(
    () => workflowStages.find((item) => item.id === activeWorkflowStageId) || workflowStages[0],
    [activeWorkflowStageId],
  );
  const activePreviewThread = whatsappPreviewThreads[previewLanguage];
  const workflowNodeMap = useMemo(
    () => Object.fromEntries(workflowCanvasNodes.map((node) => [node.id, node])),
    [],
  );

  return (
    <div className="landing-shell challenge-landing">
      <header className="landing-nav">
        <button type="button" className="landing-brand" onClick={() => scrollToSection('hero')}>
          <span className="landing-brand-mark">BB</span>
          <span className="landing-brand-text">
            <strong>BolBazaar</strong>
            <small>WhatsApp-first agri commerce</small>
          </span>
        </button>

        <nav className="landing-nav-links" aria-label="Landing page sections">
          <button type="button" className="landing-nav-link" onClick={() => scrollToSection('problem')}>
            Problem
          </button>
          <button type="button" className="landing-nav-link" onClick={() => scrollToSection('solution')}>
            Solution
          </button>
          <button type="button" className="landing-nav-link" onClick={() => scrollToSection('how-it-works')}>
            How It Works
          </button>
          <button type="button" className="landing-nav-link" onClick={() => scrollToSection('architecture')}>
            Architecture
          </button>
        </nav>

        <div className="landing-nav-actions">
          <button type="button" className="ghost-button small" onClick={() => onOpenLogin(null)}>
            Login
          </button>
          <button type="button" className="primary-button small" onClick={() => scrollToSection('solution')}>
            See solution
          </button>
        </div>
      </header>

      <section id="hero" className="landing-hero-panel">
        <div className="landing-hero-copy">
          <span className="landing-badge">Hackathon demo | Problem, solution, product, and architecture in one scroll</span>
          <h1 className="landing-display">The operating layer for WhatsApp-first fresh produce commerce.</h1>
          <p className="landing-lead">
            BolBazaar turns seller chats, voice notes, verification steps, listings, and khata updates into a buyer
            marketplace and a seller control tower, while keeping the seller journey aligned with WhatsApp behavior.
          </p>

          <div className="hero-action-row">
            <button type="button" className="primary-button" onClick={() => scrollToSection('how-it-works')}>
              See how it works
            </button>
            <button type="button" className="ghost-button" onClick={() => onOpenLogin('buyer')}>
              Open buyer view
            </button>
            <button type="button" className="ghost-button" onClick={() => onOpenLogin('seller')}>
              Open seller view
            </button>
          </div>

          <div className="landing-proof-row">
            {proofPills.map((item) => (
              <span key={item} className="landing-proof-chip">
                {item}
              </span>
            ))}
          </div>
        </div>

        <aside className="landing-command-card card">
          <div className="landing-kpi-mosaic">
            <article className="landing-kpi-card">
              <span>Live listings</span>
              <strong>{stats.liveListings}</strong>
              <p>Structured from seller-side activity.</p>
            </article>
            <article className="landing-kpi-card">
              <span>Active sellers</span>
              <strong>{stats.activeSellers}</strong>
              <p>Phone-number linked access for seller dashboards.</p>
            </article>
            <article className="landing-kpi-card">
              <span>Accepted orders</span>
              <strong>{stats.acceptedOrders}</strong>
              <p>Buyer ordering loop already reflected in the product story.</p>
            </article>
            <article className="landing-kpi-card">
              <span>Alerts sent</span>
              <strong>{stats.alertsSent}</strong>
              <p>Operational feedback remains visible to sellers.</p>
            </article>
          </div>

          <div className="landing-mini-stack">
            <article className="landing-mini-card">
              <span className="mini-pill">Problem statement</span>
              <strong>Unstructured agri commerce becomes hard to trust and hard to scale.</strong>
              <p>BolBazaar translates what sellers already do on WhatsApp into a system buyers and judges can understand.</p>
            </article>
            <article className="landing-mini-card is-contrast">
              <span className="mini-pill">Solution framing</span>
              <strong>One seller channel. Two polished interfaces.</strong>
              <p>WhatsApp stays the operating rail. The web experience becomes the visibility and control layer.</p>
            </article>
          </div>
        </aside>
      </section>

      <section id="problem" className="landing-section">
        <div className="section-heading">
          <span className="eyebrow">Problem</span>
          <h2>Fresh produce moves fast. Information about it does not.</h2>
          <p>
            The hackathon opportunity is not just commerce. It is the missing operating layer between informal WhatsApp
            behavior and a trustworthy, searchable market experience.
          </p>
        </div>

        <div className="landing-problem-grid">
          {problemCards.map((card) => (
            <article key={card.title} className="card landing-problem-card">
              <span className="mini-pill">{card.kicker}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}

          <article className="card landing-problem-summary">
            <span className="eyebrow">What judges should see</span>
            <h3>A real-world adoption path, not a behavior rewrite.</h3>
            <p>
              BolBazaar wins the story by meeting sellers where they already operate, then using AI to create structure,
              visibility, and a better transaction layer on top of that familiar behavior.
            </p>
            <div className="landing-summary-grid">
              <div>
                <span className="label">Adoption logic</span>
                <strong>WhatsApp stays primary</strong>
              </div>
              <div>
                <span className="label">Product logic</span>
                <strong>Web adds clarity</strong>
              </div>
              <div>
                <span className="label">AI logic</span>
                <strong>Structure from natural input</strong>
              </div>
              <div>
                <span className="label">Demo logic</span>
                <strong>Interactive and judge-friendly</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="solution" className="landing-section">
        <div className="section-heading">
          <span className="eyebrow">Solution</span>
          <h2>BolBazaar is a dual-surface product built around one WhatsApp-native seller workflow.</h2>
          <p>Select a surface to see how the experience changes by role while the underlying seller behavior stays aligned.</p>
        </div>

        <div className="landing-experience-layout">
          <div className="landing-experience-main">
            <div className="landing-switcher">
              {experienceModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`landing-switch-button ${activeExperience.id === mode.id ? 'landing-switch-button-active' : ''}`}
                  onClick={() => setActiveExperienceId(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <article className="card landing-experience-card">
              <span className="eyebrow">{activeExperience.eyebrow}</span>
              <h3>{activeExperience.title}</h3>
              <p>{activeExperience.description}</p>

              <div className="landing-experience-metrics">
                {activeExperience.metrics.map((item) => (
                  <div key={item.label} className="landing-experience-metric">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div className="landing-experience-content">
                <div className="landing-experience-list">
                  <h4>What this surface adds</h4>
                  <ul className="bullet-list">
                    {activeExperience.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="landing-compliance-note">
                  <span className="mini-pill">WhatsApp alignment</span>
                  <p>{activeExperience.compliance}</p>
                </div>
              </div>
            </article>
          </div>

          <aside className="card landing-judge-card">
            <span className="eyebrow">Why this works for the challenge</span>
            <h3>A working narrative, not just a visual refresh.</h3>
            <div className="landing-judge-stack">
              <article>
                <strong>AI with grounded inputs</strong>
                <p>Voice notes, free text, and listings are converted into structured commerce operations.</p>
              </article>
              <article>
                <strong>Adoption-first design</strong>
                <p>The solution respects existing seller behavior instead of pretending a new app will magically be used.</p>
              </article>
              <article>
                <strong>Interactive storytelling</strong>
                <p>The landing page explains the problem, the product, and the system design before the demo branches into buyer and seller views.</p>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <div className="section-heading">
          <span className="eyebrow">How It Works</span>
          <h2>The product flow on the left, the WhatsApp journey inside the device.</h2>
          <p>The workflow stays visual and clean, while the seller story plays out in a scrollable phone-shaped WhatsApp preview.</p>
        </div>

        <div className="landing-demo-layout">
          <div className="card landing-pipeline-board">
            <div className="landing-pipeline-header">
              <div>
                <span className="mini-pill">Workflow canvas</span>
                <h3>System map</h3>
              </div>
              <p>Tap the highlighted blocks to explain how seller activity becomes structured commerce.</p>
            </div>

            <div className="landing-workflow-canvas">
              <svg className="landing-workflow-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {workflowCanvasConnections.map(([fromId, toId]) => {
                  const fromNode = workflowNodeMap[fromId];
                  const toNode = workflowNodeMap[toId];
                  if (!fromNode || !toNode) {
                    return null;
                  }
                  return (
                    <line
                      key={`${fromId}-${toId}`}
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                    />
                  );
                })}
              </svg>

              {workflowCanvasNodes.map((node) => {
                const interactive = Boolean(node.stage);
                const isActive = node.stage ? node.stage === activeWorkflowStage.id : false;

                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`landing-workflow-node landing-workflow-node-${node.tone} ${isActive ? 'landing-workflow-node-active' : ''} ${interactive ? 'landing-workflow-node-interactive' : 'landing-workflow-node-static'}`}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    aria-pressed={interactive ? isActive : undefined}
                    onClick={() => {
                      if (node.stage) {
                        setActiveWorkflowStageId(node.stage);
                      }
                    }}
                  >
                    <em>{node.tag}</em>
                    <strong>{node.title}</strong>
                    <span>{node.subtitle}</span>
                  </button>
                );
              })}
            </div>

            <div className="landing-pipeline-detail">
              <span className="mini-pill">Active stage</span>
              <strong>{activeWorkflowStage.title}</strong>
              <p>{activeWorkflowStage.body}</p>
            </div>
          </div>

          <aside className="card landing-phone-card">
            <div className="landing-phone-header">
              <div>
                <span className="mini-pill">WhatsApp preview</span>
                <h3>Seller chat preview</h3>
              </div>
              <div className="landing-phone-language-switch" role="tablist" aria-label="WhatsApp preview language">
                <button
                  type="button"
                  className={`landing-phone-language-button ${previewLanguage === 'english' ? 'landing-phone-language-button-active' : ''}`}
                  onClick={() => setPreviewLanguage('english')}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`landing-phone-language-button ${previewLanguage === 'hindi' ? 'landing-phone-language-button-active' : ''}`}
                  onClick={() => setPreviewLanguage('hindi')}
                >
                  हिंदी
                </button>
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
                    <div
                      key={`${previewLanguage}-${index}-${message.text}`}
                      className={`landing-chat-row ${message.side === 'right' ? 'landing-chat-row-right' : ''}`}
                    >
                      <div className={`landing-chat-bubble landing-chat-bubble-${message.type}`}>
                        {message.title && <strong>{message.title}</strong>}
                        {message.type === 'voice' && <span className="landing-chat-wave" aria-hidden="true" />}
                        <p>{message.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="landing-phone-input">
                  <span className="landing-phone-input-pill">Voice notes</span>
                  <span className="landing-phone-input-pill">Listings</span>
                  <span className="landing-phone-input-pill">Khata</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="architecture" className="landing-section">
        <div className="section-heading">
          <span className="eyebrow">Architecture</span>
          <h2>Interactive system view for the hackathon pitch.</h2>
          <p>Tap any block to explain the technical pipeline in a way that feels visual, structured, and demo-ready.</p>
        </div>

        <div className="landing-architecture-layout">
          <div className="card landing-architecture-board">
            <div className="landing-architecture-grid">
              {architectureNodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className={`landing-architecture-node ${activeNode.id === node.id ? 'landing-architecture-node-active' : ''}`}
                  onClick={() => setActiveNodeId(node.id)}
                >
                  <span className="landing-node-tag">{node.tag}</span>
                  <strong>{node.title}</strong>
                  <small>{node.subtitle}</small>
                </button>
              ))}
            </div>
          </div>

          <aside className="card landing-architecture-detail">
            <span className="eyebrow">{activeNode.tag}</span>
            <h3>{activeNode.title}</h3>
            <p>{activeNode.body}</p>
            <div className="landing-detail-points">
              {activeNode.points.map((point) => (
                <span key={point} className="landing-detail-pill">
                  {point}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <span className="eyebrow">Interface Preview</span>
          <h2>Two distinct dashboards after login, one consistent product story.</h2>
        </div>

        <div className="landing-preview-grid">
          <article className="card landing-preview-card">
            <div className="landing-preview-head">
              <span className="mini-pill">Buyer interface</span>
              <strong>Marketplace view</strong>
            </div>
            <div className="landing-preview-frame">
              <div className="landing-preview-metric strong">
                <span>Live matches</span>
                <strong>{stats.liveListings}</strong>
              </div>
              <div className="landing-preview-list">
                <div className="landing-preview-row">
                  <strong>Search produce</strong>
                  <span>Tomato, onion, potato, leafy greens</span>
                </div>
                <div className="landing-preview-row">
                  <strong>Compare sellers</strong>
                  <span>Pickup, price, trust, order readiness</span>
                </div>
                <div className="landing-preview-row">
                  <strong>Place orders</strong>
                  <span>Structured order flow instead of scattered chat negotiation</span>
                </div>
              </div>
            </div>
          </article>

          <article className="card landing-preview-card">
            <div className="landing-preview-head">
              <span className="mini-pill">Seller interface</span>
              <strong>Control tower view</strong>
            </div>
            <div className="landing-preview-frame">
              <div className="landing-preview-metric strong">
                <span>Seller signals</span>
                <strong>Orders + khata + alerts</strong>
              </div>
              <div className="landing-preview-list">
                <div className="landing-preview-row">
                  <strong>Track khata</strong>
                  <span>Ledger entries captured from voice or text notes</span>
                </div>
                <div className="landing-preview-row">
                  <strong>Review orders</strong>
                  <span>Pending, accepted, and completed activity in one view</span>
                </div>
                <div className="landing-preview-row">
                  <strong>Stay aligned</strong>
                  <span>Same phone number, same WhatsApp-origin workflow, better visibility</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="card landing-cta-panel">
        <div>
          <span className="eyebrow">Ready to demo</span>
          <h2>Open the buyer or seller interface, or start from role login.</h2>
          <p>
            The landing page now frames the problem and solution like a challenge submission, then routes into the
            appropriate product surface without losing the WhatsApp-first story.
          </p>
        </div>

        <div className="landing-cta-actions">
          <button type="button" className="primary-button" onClick={() => onOpenLogin(null)}>
            Login with phone OTP
          </button>
          <button type="button" className="ghost-button" onClick={() => onOpenLogin('buyer')}>
            Buyer demo
          </button>
          <button type="button" className="ghost-button" onClick={() => onOpenLogin('seller')}>
            Seller demo
          </button>
        </div>
      </section>
    </div>
  );
}
