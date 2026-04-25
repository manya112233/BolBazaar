import type { Listing } from '../types';

function formatGrade(grade: string): string {
  if (!grade) return 'Standard';
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function mapUrl(listing: Listing): string | null {
  if (listing.latitude != null && listing.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`;
  }
  if (listing.pickup_location) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.pickup_location)}`;
  }
  return null;
}

export default function ListingCard({ listing, onOrder }: { listing: Listing; onOrder: (listing: Listing) => void }) {
  const mapsHref = mapUrl(listing);
  const isAiVisualGrade = listing.quality_assessment_source === 'ai_visual';

  return (
    <article className="card listing-card">
      <div className="listing-image-wrap">
        <img
          src={listing.image_url || 'https://images.unsplash.com/photo-1546470427-e6ac89a99c4d?auto=format&fit=crop&w=1200&q=80'}
          alt={listing.product_name}
          className="listing-image"
        />
        <span className="badge">{listing.freshness_label}</span>
      </div>
      <div className="listing-body">
        <div className="listing-title-row">
          <div>
            <h3>{listing.product_name}</h3>
            <div className="pill-row">
              <span className="mini-pill">{listing.source_channel === 'whatsapp' ? 'WhatsApp listing' : 'Demo listing'}</span>
              {listing.latitude != null && listing.longitude != null && <span className="mini-pill">Geo-verified</span>}
              {isAiVisualGrade && <span className="mini-pill success-pill">AI photo checked</span>}
            </div>
          </div>
          <span className="price">Rs {listing.price_per_kg}/kg</span>
        </div>
        <p className="muted">{listing.description}</p>
        {listing.quality_summary && (
          <div className="quality-note">
            <strong>{isAiVisualGrade ? 'AI visual freshness' : 'Quality note'}</strong>
            <p>{listing.quality_summary}</p>
          </div>
        )}
        <div className="details-grid">
          <div>
            <span className="label">Available</span>
            <strong>{listing.available_kg} kg</strong>
          </div>
          <div>
            <span className="label">Pickup</span>
            <strong>{listing.pickup_location}</strong>
          </div>
          <div>
            <span className="label">Seller</span>
            <strong>{listing.seller_name}</strong>
          </div>
          <div>
            <span className="label">Grade</span>
            <strong>
              {formatGrade(listing.quality_grade)}
              {listing.quality_score != null ? ` (${listing.quality_score}/100)` : ''}
            </strong>
          </div>
        </div>
        {listing.quality_signals.length > 0 && (
          <div className="pill-row">
            {listing.quality_signals.slice(0, 3).map((signal) => (
              <span key={signal} className="mini-pill neutral-pill">
                {signal}
              </span>
            ))}
          </div>
        )}
        <div className="action-cluster">
          <button className="primary-button" onClick={() => onOrder(listing)}>
            Place order
          </button>
          {mapsHref && (
            <a className="ghost-button inline-link-button" href={mapsHref} target="_blank" rel="noreferrer">
              View on Google Maps
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
