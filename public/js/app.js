/**
 * Abalfazl Travels — app.js (High Performance Optimized)
 * ========================================================
 * Only injects dynamic modules: Destinations, Tours, Rentals, Reviews, Booking.
 * Static elements (Navbar, Hero, Services, About, Footer, Forms) are hardcoded in HTML for 0ms load speed.
 */
'use strict';

/* ═══════════════════════════════════════════════════════
   CONFIGURATION
═══════════════════════════════════════════════════════ */
// Google Apps Script Web App URL for reviews
const REVIEWS_API_URL = 'https://script.google.com/macros/s/AKfycbx4a_IBpaTBTC4hDFGaSL61GbIb5nuAcRxEjk5POUO_40_Jvjvny80RMyg20xxpr29n/exec';

// Google Form Entry IDs for review fallback
const FORM_ENTRIES = {
  review: {
    name: 'entry.XXXXXXXXX',
    email: 'entry.XXXXXXXXX',
    location: 'entry.XXXXXXXXX',
    rating: 'entry.XXXXXXXXX',
    text: 'entry.XXXXXXXXX',
    gender: 'entry.XXXXXXXXX'
  }
};

// Curated Unsplash profile avatars for male/female travelers
const MALE_AVATARS = [
  'https://img.magnific.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg?semt=ais_hybrid&w=740&q=80',
  'https://img.magnific.com/premium-vector/professional-male-avatar-profile-picture-employee-work_1322206-66523.jpg?semt=ais_hybrid&w=740&q=80'
];

const FEMALE_AVATARS = [
  'https://img.magnific.com/free-vector/smiling-woman-with-glasses_1308-177859.jpg?semt=ais_hybrid&w=740&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZMJHsEHMda2k8RD__yKT8rx7jvzLH6RZ6V4dVWIT26ysbwSiBQyaZXYHI&s=10'
];

// Reviews pagination
const REVIEWS_PER_PAGE = 10;
let allReviews = [];
let currentReviewsPage = 1;

/* ═══════════════════════════════════════════════════════
   WHATSAPP MESSAGE BUILDER
═══════════════════════════════════════════════════════ */
function buildWhatsAppUrl(formType, formData) {
  const brand = window.SITE_CONTENT?.brand || {};
  const waNumber = brand.whatsapp || '918825083535';

  let message = '';
  switch (formType) {
    case 'contact':
      message = `📬 *New Contact Enquiry — Abalfazl Travels*\n\n`;
      message += `👤 *Name:* ${formData.name || 'Not provided'}\n`;
      message += `📱 *Phone:* ${formData.phone || 'Not provided'}\n`;
      message += `📧 *Email:* ${formData.email || 'Not provided'}\n`;
      if (formData.destination) message += `📍 *Destination:* ${formData.destination}\n`;
      if (formData.service) message += `🚌 *Service:* ${formData.service}\n`;
      message += `💬 *Message:* ${formData.message || 'No message provided'}\n\n`;
      message += `— Sent from website contact form`;
      break;

    case 'booking':
    case 'booking-page':
    case 'booking-home':
      message = `🗺️ *New Booking Enquiry — Abalfazl Travels*\n\n`;
      message += `👤 *Name:* ${formData.name || 'Not provided'}\n`;
      message += `📱 *Phone:* ${formData.phone || 'Not provided'}\n`;
      message += `📧 *Email:* ${formData.email || 'Not provided'}\n`;
      if (formData.destination) message += `📍 *Destination:* ${formData.destination}\n`;
      if (formData.service) message += `🚌 *Service:* ${formData.service}\n`;
      if (formData.travellers) message += `👥 *Travellers:* ${formData.travellers}\n`;
      if (formData.dates) message += `🗓 *Dates:* ${formData.dates}\n`;
      if (formData.selected_package) message += `📦 *Package:* ${formData.selected_package}\n`;
      message += `💬 *Message:* ${formData.message || 'No additional details'}\n\n`;
      message += `— Sent from website booking form`;
      break;

    case 'newsletter':
      message = `📧 *New Newsletter Subscription — Abalfazl Travels*\n\n`;
      message += `📧 *Email:* ${formData.email || 'Not provided'}\n\n`;
      message += `— Subscribed via website newsletter form`;
      break;

    default:
      message = `📝 *New Enquiry — Abalfazl Travels*\n\n`;
      for (const [key, value] of Object.entries(formData)) {
        if (value) message += `${key}: ${value}\n`;
      }
  }

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function esc(s) {
  const d = document.createElement('div');
  d.textContent = String(s ?? '');
  return d.innerHTML;
}

function stars(n) {
  const full = Math.floor(n), half = Math.ceil(n) > full ? 1 : 0, empty = 5 - full - half;
  return `<span class="stars" aria-label="${n} out of 5">${'★'.repeat(full)}${half ? '½' : ''}${'☆'.repeat(empty)}</span>`;
}

/* ═══════════════════════════════════════════════════════
   NAVIGATION INTERACTION (Hamburger & Scroll)
═══════════════════════════════════════════════════════ */
function initNav() {
  const nav = document.getElementById('site-nav');
  const hamburger = document.getElementById('hamburger');
  const mob = document.getElementById('mobile-nav');

  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  if (hamburger && mob) {
    hamburger.addEventListener('click', function () {
      const open = !mob.classList.contains('open');
      mob.classList.toggle('open', open);
      this.classList.toggle('active', open);
      this.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    mob.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mob.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC: DESTINATIONS HOME (index.html)
═══════════════════════════════════════════════════════ */
function renderDestinationsHome(d) {
  const sec = document.getElementById('destinations-home');
  if (!sec) return;
  const ds = d.destinations;
  sec.innerHTML = `
    <div class="container">
      <div class="destinations__header" data-aos="fade-up">
        <div>
          <span class="section-eyebrow">${esc(ds.sectionEyebrow)}</span>
          <h2 class="section-title">${esc(ds.sectionTitle)}</h2>
          <p class="section-subtitle">${esc(ds.sectionSubtitle)}</p>
        </div>
        <a href="destinations.html" class="btn btn--outline-gold btn--sm">View All Destinations →</a>
      </div>
      <div class="destinations__grid">
        ${ds.items.slice(0, 8).map((item, i) => `
          <article class="dest-card" data-aos="fade-up" data-aos-delay="${(i % 4) * 80}">
            <a href="${esc(item.href)}" aria-label="${esc(item.name)} — ${esc(item.country)}">
              <img src="${esc(item.image)}" alt="${esc(item.imageAlt)}" class="dest-card__img" loading="lazy" width="600" height="400">
              <div class="dest-card__overlay"></div>
              <span class="dest-card__badge">${esc(item.category)}</span>
              <div class="dest-card__body">
                <span class="dest-card__country">${esc(item.country)}</span>
                <h3 class="dest-card__name">${esc(item.name)}</h3>
                <div class="dest-card__meta">
                  <span class="dest-card__price">${esc(item.price)}</span>
                  <span>${stars(item.rating)}</span>
                </div>
              </div>
            </a>
          </article>`).join('')}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC: DESTINATIONS PAGE (destinations.html)
═══════════════════════════════════════════════════════ */
function renderDestinationsPage(d) {
  const sec = document.getElementById('destinations-page');
  if (!sec) return;
  const ds = d.destinations;
  const categories = ['All', 'Heritage', 'Spiritual', 'Nature', 'Adventure', 'Beach'];
  sec.innerHTML = `
    <div class="container" style="padding:3rem 1.5rem var(--section-py)">
      <div class="dest-filters" role="group" aria-label="Filter destinations">
        ${categories.map(c => `<button class="dest-filter-btn${c === 'All' ? ' active' : ''}" data-filter="${c}">${c}</button>`).join('')}
      </div>
      <div class="dest-full-grid" id="dest-grid">
        ${ds.items.map((item, i) => `
          <article class="dest-full-card" data-aos="fade-up" data-aos-delay="${(i % 3) * 80}" data-category="${esc(item.category)}">
            <div class="dest-full-card__img-wrap">
              <img src="${esc(item.image)}" alt="${esc(item.imageAlt)}" class="dest-full-card__img" loading="lazy" width="600" height="400">
              <span class="dest-full-card__country-badge">${esc(item.country)}</span>
            </div>
            <div class="dest-full-card__body">
              <span class="dest-full-card__tagline">${esc(item.tagline)}</span>
              <h2 class="dest-full-card__name" id="${esc(item.id)}">${esc(item.name)}</h2>
              <div class="dest-full-card__highlights">
                ${(item.highlights || []).map(h => `<span class="dest-full-card__highlight">✓ ${esc(h)}</span>`).join('')}
              </div>
              <div class="dest-full-card__footer">
                <span class="dest-full-card__price">${esc(item.price)}</span>
                <span>${stars(item.rating)} (${item.reviews})</span>
              </div>
              <a href="${`booking.html?type=destination&name=${encodeURIComponent(item.name)}&price=${encodeURIComponent(item.price)}&id=${esc(item.id)}`}" class="btn btn--gold btn--sm" style="margin-top:1rem;width:100%;justify-content:center;">Book Now</a>
            </div>
          </article>`).join('')}
      </div>
    </div>`;

  sec.querySelectorAll('.dest-filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      sec.querySelectorAll('.dest-filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const f = this.dataset.filter;
      document.querySelectorAll('#dest-grid .dest-full-card').forEach(card => {
        card.style.display = (f === 'All' || card.dataset.category === f) ? '' : 'none';
      });
    });
  });
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC: TOURS HOME (index.html)
═══════════════════════════════════════════════════════ */
function renderToursHome(d) {
  const sec = document.getElementById('tours-home');
  if (!sec) return;
  const ts = d.tours;
  sec.innerHTML = `
    <div class="container">
      <div class="tours__header" data-aos="fade-up">
        <span class="section-eyebrow">${esc(ts.sectionEyebrow)}</span>
        <h2 class="section-title">${esc(ts.sectionTitle)}</h2>
        <p class="section-subtitle">${esc(ts.sectionSubtitle)}</p>
      </div>
      <div class="tours__grid">
        ${ts.items.slice(0, 6).map((t, i) => tourCardHTML(t, i)).join('')}
      </div>
      <div style="text-align:center;margin-top:3rem" data-aos="fade-up">
        <a href="tours.html" class="btn btn--dark">View All Packages →</a>
      </div>
    </div>`;
}

function tourCardHTML(t, i = 0) {
  const bkUrl = `booking.html?type=tour&name=${encodeURIComponent(t.title)}&price=${encodeURIComponent(t.price)}&duration=${encodeURIComponent(t.duration)}&group=${encodeURIComponent(t.groupSize)}&id=${esc(t.id)}`;
  return `
    <article class="tour-card" data-aos="fade-up" data-aos-delay="${(i % 3) * 80}" id="${esc(t.id)}">
      <div class="tour-card__img-wrap">
        <img src="${esc(t.image)}" alt="${esc(t.imageAlt)}" class="tour-card__img" loading="lazy" width="700" height="450">
        <span class="badge ${esc(t.badgeClass)} tour-card__badge">${esc(t.badge)}</span>
      </div>
      <div class="tour-card__body">
        <h3 class="tour-card__title">${esc(t.title)}</h3>
        <p class="tour-card__desc">${esc(t.desc)}</p>
        <div class="tour-card__meta">
          <span>🗓 ${esc(t.duration)}</span>
          <span>👥 ${esc(t.groupSize)}</span>
        </div>
        <div class="tour-card__includes">
          ${t.includes.map(x => `<span class="tour-card__tag">✓ ${esc(x)}</span>`).join('')}
        </div>
        <div class="tour-card__footer">
          <div>
            <div class="tour-card__price">${esc(t.price)}</div>
            <div class="tour-card__price-note">${esc(t.priceNote)}</div>
          </div>
          <a href="${bkUrl}" class="btn btn--gold btn--sm">Book Now</a>
        </div>
      </div>
    </article>`;
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC: TOURS PAGE (tours.html)
═══════════════════════════════════════════════════════ */
function renderToursPage(d) {
  const sec = document.getElementById('tours-page');
  if (!sec) return;
  sec.innerHTML = `
    <div class="container" style="padding:3rem 1.5rem var(--section-py)">
      <div class="tours__grid">
        ${d.tours.items.map((t, i) => tourCardHTML(t, i)).join('')}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC: RENTALS HOME (index.html)
═══════════════════════════════════════════════════════ */
function renderRentalsHome(d) {
  const sec = document.getElementById('rentals-home');
  if (!sec) return;
  const rn = d.rentals;

  sec.innerHTML = `
    <div class="container">
      <div class="rentals__header" data-aos="fade-up">
        <span class="section-eyebrow">${esc(rn.sectionEyebrow)}</span>
        <h2 class="section-title">${esc(rn.sectionTitle)}</h2>
        <p class="section-subtitle" style="margin:0 auto;">${esc(rn.sectionSubtitle)}</p>
      </div>
      <div class="rentals__tabs" role="tablist">
        ${rn.categories.map((cat, i) => `
          <button class="rentals__tab${i === 0 ? ' active' : ''}" data-tab="${esc(cat.id)}" role="tab" aria-selected="${i === 0}">
            <span class="rentals__tab-icon">${esc(cat.icon)}</span>
            ${esc(cat.title)}
          </button>`).join('')}
      </div>
      ${rn.categories.map((cat, i) => `
        <div class="rentals__panel${i === 0 ? ' active' : ''}" id="tab-${esc(cat.id)}" role="tabpanel">
          <div class="rentals__grid">
            ${cat.items.map((item, j) => rentalCardHTML(item, j)).join('')}
          </div>
        </div>`).join('')}
      <div style="text-align:center;margin-top:2.5rem" data-aos="fade-up">
        <a href="${esc(rn.cta.href)}" class="btn btn--dark">${esc(rn.cta.text)}</a>
      </div>
    </div>`;

  sec.querySelectorAll('.rentals__tab').forEach(btn => {
    btn.addEventListener('click', function () {
      sec.querySelectorAll('.rentals__tab').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      sec.querySelectorAll('.rentals__panel').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');
      document.getElementById('tab-' + this.dataset.tab)?.classList.add('active');
    });
  });
}

function rentalCardHTML(item, i = 0) {
  return `
    <article class="rental-card" data-aos="fade-up" data-aos-delay="${(i % 3) * 80}">
      <div class="rental-card__img-wrap">
        <img src="${esc(item.image)}" alt="${esc(item.imageAlt)}" class="rental-card__img" loading="lazy" width="500" height="300">
        <span class="badge badge--gold rental-card__badge">${esc(item.badge)}</span>
      </div>
      <div class="rental-card__body">
        <h3 class="rental-card__name">${esc(item.name)}</h3>
        <p class="rental-card__type">${esc(item.type)}</p>
        <div class="rental-card__features">
          ${item.features.map(f => `<span class="rental-card__feat">${esc(f)}</span>`).join('')}
        </div>
        <div class="rental-card__pricing">
          <div>
            <div class="rental-card__price">${esc(item.priceDay)}</div>
            <div class="rental-card__price-sub">${esc(item.priceKm)}</div>
          </div>
          <a href="${`booking.html?type=rental&name=${encodeURIComponent(item.name)}&price=${encodeURIComponent(item.priceDay)}&vehicle=${encodeURIComponent(item.type)}`}" class="btn btn--gold btn--sm">Book Now</a>
        </div>
      </div>
    </article>`;
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC: RENTALS PAGE (rentals.html)
═══════════════════════════════════════════════════════ */
function renderRentalsPage(d) {
  const sec = document.getElementById('rentals-page');
  if (!sec) return;
  const rn = d.rentals;
  sec.innerHTML = `
    <div class="container" style="padding:3rem 1.5rem var(--section-py)">
      ${rn.categories.map(cat => `
        <div style="margin-bottom:4rem;">
          <h2 style="font-family:var(--font-serif);font-size:2rem;margin-bottom:2rem;display:flex;align-items:center;gap:.75rem;">
            ${esc(cat.icon)} ${esc(cat.title)}
          </h2>
          <div class="rentals__grid">
            ${cat.items.map((item, j) => rentalCardHTML(item, j)).join('')}
          </div>
        </div>`).join('')}

      <div style="margin-top:5rem;">
        <div style="text-align:center;margin-bottom:3rem;" data-aos="fade-up">
          <span class="section-eyebrow">Rental Information</span>
          <h2 class="section-title">Why Rent With Us</h2>
        </div>
        <div class="rentals-page__why-grid">
          <div class="why-card" data-aos="fade-up">
            <div class="why-card__icon">✅</div>
            <h3>Verified Vehicles</h3>
            <p>All vehicles regularly serviced and inspected. GPS tracking available on request.</p>
          </div>
          <div class="why-card" data-aos="fade-up" data-aos-delay="100">
            <div class="why-card__icon">🔑</div>
            <h3>Instant Confirmation</h3>
            <p>Book online and receive confirmation within 15 minutes via call or WhatsApp.</p>
          </div>
          <div class="why-card" data-aos="fade-up" data-aos-delay="200">
            <div class="why-card__icon">🛡️</div>
            <h3>Full Insurance</h3>
            <p>Comprehensive insurance coverage on all rentals. Travel completely worry-free.</p>
          </div>
          <div class="why-card" data-aos="fade-up" data-aos-delay="300">
            <div class="why-card__icon">📞</div>
            <h3>24/7 Support</h3>
            <p>Round-the-clock roadside assistance and customer support wherever you go.</p>
          </div>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC: TESTIMONIALS (index.html)
═══════════════════════════════════════════════════════ */
async function renderTestimonials(d) {
  const sec = document.getElementById('testimonials');
  if (!sec) return;

  sec.innerHTML = `
    <div class="container">
      <div class="testimonials__header" data-aos="fade-up">
        <span class="section-eyebrow">What Travellers Say</span>
        <h2 class="section-title">Stories From Our Guests</h2>
      </div>
      <div class="testimonials__track-wrap" style="overflow:hidden;">
        <div class="testimonials__track" id="testi-track">
          <div class="reviews-loading">Loading reviews...</div>
        </div>
      </div>
      <div class="testimonials__controls">
        <button class="testi-btn" id="testi-prev" aria-label="Previous review">◀</button>
        <div class="testi-dots" id="testi-dots"></div>
        <button class="testi-btn" id="testi-next" aria-label="Next review">▶</button>
      </div>
      <div style="text-align:center;margin-top:2.5rem;display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;" data-aos="fade-up">
        <a href="reviews.html" class="btn btn--dark">View All Guest Reviews →</a>
        <a href="reviews.html#write-review" class="btn btn--gold">★ Write a Review</a>
      </div>
    </div>`;

  try {
    const reviews = await fetchTestimonials();
    renderTestimonialsCarousel(reviews);
  } catch (err) {
    console.error('Failed to load testimonials:', err);
    renderTestimonialsCarousel(d.testimonials || []);
  }
}

async function fetchTestimonials() {
  if (!REVIEWS_API_URL || REVIEWS_API_URL.includes('YOUR_APPS_SCRIPT_ID')) {
    return getFallbackReviews();
  }

  try {
    const response = await fetch(REVIEWS_API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const reviews = Array.isArray(data) && data.length ? data : getFallbackReviews();
    return reviews;
  } catch (err) {
    return getFallbackReviews();
  }
}

function renderTestimonialsCarousel(items) {
  const track = document.getElementById('testi-track');
  const dots = document.getElementById('testi-dots');
  const prevBtn = document.getElementById('testi-prev');
  const nextBtn = document.getElementById('testi-next');
  if (!track || !dots || !prevBtn || !nextBtn || !items.length) return;

  let idx = 0;
  const pv = () => window.innerWidth < 769 ? 1 : window.innerWidth < 1025 ? 2 : 3;

  track.innerHTML = items.map(t => `
    <article class="testi-card">
      <div class="testi-card__stars">${stars(t.rating)}</div>
      <p class="testi-card__quote">"${esc(t.text)}"</p>
      <div class="testi-card__author">
        <img src="${esc(t.avatar)}" alt="${esc(t.name)}" class="testi-card__avatar" loading="lazy" width="48" height="48">
        <div>
          <div class="testi-card__name">${esc(t.name)}</div>
          <div class="testi-card__location">${esc(t.location)}</div>
          ${t.tour ? `<div class="testi-card__tour">${esc(t.tour)}</div>` : ''}
        </div>
      </div>
    </article>`).join('');

  function getMax() {
    return Math.max(0, items.length - pv());
  }

  function updateDots() {
    const max = getMax();
    const count = Math.max(1, max + 1);
    dots.innerHTML = Array.from({ length: count }).map((_, i) =>
      `<button class="testi-dot${i === idx ? ' active' : ''}" data-i="${i}" aria-label="Review slide ${i + 1}"></button>`
    ).join('');
  }

  function goTo(n) {
    const max = getMax();
    if (n > max) {
      idx = 0; // Loop seamlessly to start
    } else if (n < 0) {
      idx = max; // Loop seamlessly to end
    } else {
      idx = n;
    }

    const cards = track.querySelectorAll('.testi-card');
    if (!cards.length) return;
    const targetCard = cards[idx];
    const moveAmount = targetCard ? (targetCard.offsetLeft - cards[0].offsetLeft) : 0;

    track.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform = `translateX(-${moveAmount}px)`;

    dots.querySelectorAll('.testi-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  updateDots();

  prevBtn.onclick = (e) => {
    e.preventDefault();
    goTo(idx - 1);
  };

  nextBtn.onclick = (e) => {
    e.preventDefault();
    goTo(idx + 1);
  };

  dots.onclick = (e) => {
    const dot = e.target.closest('.testi-dot');
    if (dot && dot.dataset.i !== undefined) {
      goTo(parseInt(dot.dataset.i, 10));
    }
  };

  // Touch Swipe for Mobile / Tablet
  let touchStartX = 0;
  let touchEndX = 0;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(idx + 1);
      else goTo(idx - 1);
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    updateDots();
    goTo(Math.min(idx, getMax()));
  }, { passive: true });
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC: REVIEWS PAGE (reviews.html)
═══════════════════════════════════════════════════════ */
function renderReviewsPage() {
  const sec = document.getElementById('reviews-page');
  if (!sec) return;

  sec.innerHTML = `
    <div class="container">
      <div class="reviews-header" data-aos="fade-up">
        <span class="section-eyebrow">Guest Experiences</span>
        <h2 class="section-title">What Our Guests Say</h2>
        <div class="reviews-meta-bar" style="margin-top:1rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">
          <div class="reviews-rating-big" style="font-size:2.5rem;font-weight:700;color:var(--gold);font-family:var(--font-serif);line-height:1;">
            4.9 <span style="font-size:1.25rem;color:var(--text-light);font-weight:400;">/ 5</span>
          </div>
          <div class="reviews-stars-summary">
            <div style="color:var(--gold);font-size:1.2rem;">★★★★★</div>
            <div style="font-size:0.875rem;color:var(--text-light);">Based on 800+ Verified Guests</div>
          </div>
          <a href="#write-review" class="btn btn--gold btn--sm" style="margin-left:auto;">Write a Review ↓</a>
        </div>
      </div>

      <!-- REVIEW FORM AT THE TOP -->
      <div id="review-form-mount" data-aos="fade-up" style="margin-top:2.5rem;"></div>

      <!-- VERIFIED REVIEWS LIST BELOW FORM -->
      <div class="reviews-section-heading" data-aos="fade-up" style="margin-top:4.5rem;margin-bottom:2rem;">
        <span class="section-eyebrow">Verified Guest Feedback</span>
        <h3 style="font-family:var(--font-serif);font-size:2.2rem;color:var(--dark);">Recent Traveler Reviews</h3>
      </div>

      <div class="reviews-grid" id="reviews-grid">
        <div class="reviews-loading">Loading verified reviews...</div>
      </div>

      <div class="reviews-pagination" id="reviews-pagination" style="display:none;margin-top:2.5rem;justify-content:center;gap:.5rem;"></div>
    </div>`;

  // Mount the Review Form FIRST
  renderReviewForm();

  // Load reviews list below it
  fetchReviewsFromAPI().then(reviews => {
    allReviews = reviews;
    currentReviewsPage = 1;
    renderReviewsGrid(getCurrentPageReviews());
    renderPagination();
    if (typeof refreshAOS === 'function') refreshAOS();
  }).catch(err => {
    console.error('Failed to load reviews:', err);
    allReviews = getFallbackReviews();
    renderReviewsGrid(getCurrentPageReviews());
    if (typeof refreshAOS === 'function') refreshAOS();
  });
}

async function fetchReviewsFromAPI() {
  if (!REVIEWS_API_URL || REVIEWS_API_URL.includes('YOUR_APPS_SCRIPT_ID')) {
    return getFallbackReviews();
  }

  try {
    const response = await fetch(REVIEWS_API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return Array.isArray(data) ? data : getFallbackReviews();
  } catch (err) {
    return getFallbackReviews();
  }
}

function getCurrentPageReviews() {
  const start = (currentReviewsPage - 1) * REVIEWS_PER_PAGE;
  return allReviews.slice(start, start + REVIEWS_PER_PAGE);
}

function renderPagination() {
  const pagination = document.getElementById('reviews-pagination');
  if (!pagination) return;
  const totalPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);
  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'flex';
  let html = `<button class="pagination-btn" ${currentReviewsPage === 1 ? 'disabled' : ''} data-page="${currentReviewsPage - 1}">‹ Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn${i === currentReviewsPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="pagination-btn" ${currentReviewsPage === totalPages ? 'disabled' : ''} data-page="${currentReviewsPage + 1}">Next ›</button>`;
  pagination.innerHTML = html;

  pagination.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentReviewsPage) {
        currentReviewsPage = page;
        renderReviewsGrid(getCurrentPageReviews());
        renderPagination();
        document.getElementById('reviews-grid')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function renderReviewsGrid(reviews) {
  const grid = document.getElementById('reviews-grid');
  if (!grid) return;

  grid.innerHTML = reviews.map(r => `
    <article class="review-card">
      <div class="review-card__header">
        <div class="review-card__author">
          <img src="${esc(r.avatar)}" alt="${esc(r.name)}" class="review-card__avatar" loading="lazy" width="56" height="56">
          <div class="review-card__author-info">
            <div class="review-card__name">${esc(r.name)}</div>
            <div class="review-card__location">${esc(r.location)}</div>
          </div>
        </div>
        <div class="review-card__stars" aria-label="${r.rating} stars">${stars(r.rating)}</div>
      </div>
      <p class="review-card__quote">"${esc(r.text)}"</p>
      ${r.tour ? `<p class="review-card__tour">Tour: ${esc(r.tour)}</p>` : ''}
      <div class="review-card__date">${esc(r.date)}</div>
    </article>`).join('');
}

function renderReviewForm() {
  const mount = document.getElementById('review-form-mount');
  const sec = document.getElementById('reviews-page');
  const target = mount || (sec ? sec.querySelector('.container') : null);
  if (!target || document.getElementById('write-review')) return;

  const formWrapper = document.createElement('div');
  formWrapper.className = 'reviews-form__wrapper';
  formWrapper.id = 'write-review';
  formWrapper.innerHTML = `
    <form id="new-review-form" class="reviews-form" novalidate>
      <div class="reviews-form__header">
        <span class="section-eyebrow">Write a Review</span>
        <h3>Share Your Experience</h3>
        <p>Your feedback helps fellow travellers discover the best of Kashmir</p>
      </div>
      <div class="reviews-form__group">
        <label for="reviewName" class="reviews-form__label">Your Name <span class="required">*</span></label>
        <input type="text" id="reviewName" name="name" class="reviews-form__input" placeholder="Your full name" required>
        <span class="reviews-form__error" id="reviewNameError" style="display:none;"></span>
      </div>
      <div class="reviews-form__group">
        <label for="reviewEmail" class="reviews-form__label">Email Address</label>
        <input type="email" id="reviewEmail" name="email" class="reviews-form__input" placeholder="you@email.com">
        <span class="reviews-form__error" id="reviewEmailError" style="display:none;"></span>
      </div>
      <div class="reviews-form__group">
        <label for="reviewLocation" class="reviews-form__label">City / State</label>
        <input type="text" id="reviewLocation" name="location" class="reviews-form__input" placeholder="e.g. Mumbai, Maharashtra">
      </div>
      <div class="reviews-form__group">
        <label class="reviews-form__label" for="reviewAvatarGender">Avatar / Profile Photo <span class="required">*</span></label>
        <div class="rating-select-wrapper">
          <select id="reviewAvatarGender" name="avatarGender" class="rating-select" required aria-label="Select avatar gender">
            <option value="" disabled selected>Select profile avatar (Male / Female)</option>
            <option value="male">👨 Male Traveler</option>
            <option value="female">👩 Female Traveler</option>
          </select>
          <span class="rating-select__arrow" aria-hidden="true"></span>
        </div>
        <span class="reviews-form__error" id="reviewAvatarGenderError" style="display:none;"></span>
      </div>
      <div class="reviews-form__group">
        <label class="reviews-form__label" for="reviewRating">Rating <span class="required">*</span></label>
        <div class="rating-select-wrapper">
          <select id="reviewRating" name="rating" class="rating-select" required aria-label="Select rating">
            <option value="" disabled selected>Select rating</option>
            <option value="5">★★★★★ Excellent (5/5)</option>
            <option value="4">★★★★☆ Very Good (4/5)</option>
            <option value="3">★★★☆☆ Good (3/5)</option>
            <option value="2">★★☆☆☆ Fair (2/5)</option>
            <option value="1">★☆☆☆☆ Poor (1/5)</option>
          </select>
          <span class="rating-select__arrow" aria-hidden="true"></span>
        </div>
        <span class="reviews-form__error" id="reviewRatingError" style="display:none;"></span>
      </div>
      <div class="reviews-form__group">
        <label for="reviewText" class="reviews-form__label">Your Review <span class="required">*</span></label>
        <textarea id="reviewText" name="reviewText" class="reviews-form__textarea" rows="4" placeholder="Share your Kashmir experience with us..." required></textarea>
        <span class="reviews-form__error" id="reviewTextError" style="display:none;"></span>
      </div>
      <button type="submit" class="reviews-form__submit"><span>Submit Review</span></button>
    </form>`;

  target.appendChild(formWrapper);

  const form = document.getElementById('new-review-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const location = form.location.value.trim();
    const avatarGender = form.avatarGender.value;
    const rating = form.rating.value;
    const text = form.reviewText.value.trim();

    form.querySelectorAll('.reviews-form__error').forEach(el => el.style.display = 'none');
    form.querySelectorAll('.reviews-form__input, .reviews-form__textarea, .rating-select').forEach(el => el.classList.remove('error'));

    let hasError = false;
    if (!name) {
      document.getElementById('reviewNameError').textContent = 'Please enter your name';
      document.getElementById('reviewNameError').style.display = 'block';
      hasError = true;
    }
    if (!avatarGender) {
      document.getElementById('reviewAvatarGenderError').textContent = 'Please select an avatar (Male / Female)';
      document.getElementById('reviewAvatarGenderError').style.display = 'block';
      hasError = true;
    }
    if (!rating) {
      document.getElementById('reviewRatingError').textContent = 'Please select a rating';
      document.getElementById('reviewRatingError').style.display = 'block';
      hasError = true;
    }
    if (!text) {
      document.getElementById('reviewTextError').textContent = 'Please write your review';
      document.getElementById('reviewTextError').style.display = 'block';
      hasError = true;
    }
    if (hasError) return;

    let avatarUrl = '';
    if (avatarGender === 'female') {
      avatarUrl = FEMALE_AVATARS[Math.floor(Math.random() * FEMALE_AVATARS.length)];
    } else {
      avatarUrl = MALE_AVATARS[Math.floor(Math.random() * MALE_AVATARS.length)];
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
      if (REVIEWS_API_URL && !REVIEWS_API_URL.includes('YOUR_APPS_SCRIPT_ID')) {
        await fetch(REVIEWS_API_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, email, location, rating: parseInt(rating),
            avatar: avatarUrl, gender: avatarGender, text
          })
        });
      }
      form.innerHTML = `
        <div class="reviews-form__success" style="padding:2rem;text-align:center;">
          <h3 style="color:var(--gold);font-family:var(--font-serif);font-size:1.75rem;margin-bottom:0.5rem;">Thank You!</h3>
          <p>Your review has been submitted and will appear once approved by our team.</p>
        </div>`;
    } catch (_) {
      form.innerHTML = `
        <div class="reviews-form__success" style="padding:2rem;text-align:center;">
          <h3 style="color:var(--gold);font-family:var(--font-serif);font-size:1.75rem;margin-bottom:0.5rem;">Thank You!</h3>
          <p>Your review has been submitted and will appear once approved by our team.</p>
        </div>`;
    }
  };
}

function getFallbackReviews() {
  return [
    {
      id: 1,
      name: "Rahul & Priya Sharma",
      location: "Delhi, India",
      tour: "Kashmir Honeymoon Special",
      rating: 5,
      text: "Abalfazl Travels arranged our entire Kashmir honeymoon — from the Dal Lake houseboat to Gulmarg. Everything was perfect, the guides were local and knew every hidden gem. Highly recommend!",
      date: "15 Jan 2025",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Fatima Khan",
      location: "Mumbai, India",
      tour: "Kashmir Classic Package",
      rating: 5,
      text: "Best travel agency in Srinagar! They got us Gulmarg Gondola tickets in advance so we skipped all the queues. The Innova cab was comfortable and the driver was excellent.",
      date: "20 Feb 2025",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face"
    },
    {
      id: 3,
      name: "Vikram Nair",
      location: "Bangalore, India",
      tour: "Kashmir Adventure & Trekking",
      rating: 5,
      text: "We did the adventure trekking package with Abalfazl Travels. Thajiwas Glacier and Gurez Valley were absolutely breathtaking. The team handled everything including permits. 10/10!",
      date: "10 Mar 2025",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face"
    },
    {
      id: 4,
      name: "Ananya Sengupta",
      location: "Kolkata, India",
      tour: "Pahalgam & Betaab Valley",
      rating: 5,
      text: "Such a warm, honest and professional team! Our stay in Pahalgam and Srinagar was blissful. The driver was very polite and acted like a family elder. Truly memorable experience.",
      date: "28 Mar 2025",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face"
    },
    {
      id: 5,
      name: "Rajesh Patel",
      location: "Ahmedabad, India",
      tour: "Gulmarg Snow & Gondola",
      rating: 5,
      text: "Seamless booking from start to finish. Gulmarg Phase 2 gondola tickets were handed to us on day 1 with zero queues. Delicious Kashmiri Kahwa and warm houseboats on Dal Lake!",
      date: "05 Apr 2025",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"
    },
    {
      id: 6,
      name: "Sneha Kulkarni",
      location: "Pune, India",
      tour: "Kashmir Family Holiday",
      rating: 5,
      text: "Travelled with my elderly parents and kids. Abalfazl Travels took exceptional care of every small comfort. Smooth car rides, clean hotels, and authentic Kashmiri hospitality.",
      date: "14 Apr 2025",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face"
    },
    {
      id: 7,
      name: "Amit & Neha Verma",
      location: "Chandigarh, India",
      tour: "Dal Lake & Houseboat Stay",
      rating: 5,
      text: "The wooden carvings on the houseboat and the sunrise shikara ride across the floating market were out of this world. Best vacation of our lives thanks to Abalfazl Travels!",
      date: "02 May 2025",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face"
    },
    {
      id: 8,
      name: "Dr. Zoya Qureshi",
      location: "Hyderabad, India",
      tour: "Sonamarg & Thajiwas Glacier",
      rating: 5,
      text: "Super responsive team on WhatsApp. Even when our flight got delayed by 3 hours, their driver was patiently waiting at Srinagar Airport with a warm smile. Top notch service!",
      date: "19 May 2025",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face"
    }
  ];
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC: BOOKING PAGE (booking.html)
═══════════════════════════════════════════════════════ */
function renderBookingPage(d) {
  const sec = document.getElementById('booking-page');
  if (!sec) return;
  const b = d.booking;
  const br = d.brand;
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') || '';
  const itemName = params.get('name') || '';
  const price = params.get('price') || '';
  const duration = params.get('duration') || '';
  const group = params.get('group') || '';
  const vehicle = params.get('vehicle') || '';
  const itemId = params.get('id') || '';
  const hasItem = Boolean(itemName);

  const typeLabels = { tour: 'Tour Package', rental: 'Vehicle Rental', destination: 'Destination Tour' };
  const typeIcons = { tour: '🏔️', rental: '🚗', destination: '📍' };
  const typeLabel = typeLabels[type] || 'Selected Trip';
  const typeIcon = typeIcons[type] || '✈️';

  const waLink = `https://wa.me/${br.whatsapp}?text=${encodeURIComponent(`Hi! I'd like to book ${itemName || 'a Kashmir trip'} with Abalfazl Travels.`)}`;
  const callLink = `tel:${br.phone}`;
  const mailLink = `mailto:${br.email}?subject=${encodeURIComponent(`Booking Enquiry — ${itemName || 'General Enquiry'}`)}`;

  const selectedCard = hasItem ? `
    <div class="bk-selected-item" data-aos="fade-up">
      <div class="bk-selected-item__icon">${typeIcon}</div>
      <div>
        <div class="bk-selected-item__type">${esc(typeLabel)}</div>
        <div class="bk-selected-item__name">${esc(itemName)}</div>
        <div class="bk-selected-item__meta">
          ${price ? `<span>💰 ${esc(price)}</span>` : ''}
          ${duration ? `<span style="margin-left:.75rem">🗓 ${esc(duration)}</span>` : ''}
          ${vehicle ? `<span style="margin-left:.75rem">🚗 ${esc(vehicle)}</span>` : ''}
          ${group ? `<span style="margin-left:.75rem">👥 ${esc(group)}</span>` : ''}
        </div>
      </div>
    </div>` : '';

  sec.innerHTML = `
    <div class="container bk-container">
      ${selectedCard}
      <div class="bk-heading-wrap" data-aos="fade-up">
        <span class="section-eyebrow">${hasItem ? 'Confirm Your Booking' : 'Get In Touch'}</span>
        <h2 class="section-title" style="font-size:clamp(1.6rem,4vw,2.4rem);margin-bottom:.5rem;">
          ${hasItem ? 'Choose How to Book' : 'Book Your Dream Trip'}
        </h2>
        <p style="color:var(--text-mid);font-size:1rem;max-width:500px;margin:0 auto;">
          ${hasItem ? 'Pick the fastest way — we reply instantly.' : "Choose how you'd like to get in touch — we reply instantly."}
        </p>
      </div>

      <div class="bk-contact-btns" data-aos="fade-up">
        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="bk-btn bk-btn--wa" aria-label="WhatsApp us">
          <span class="bk-btn__icon">💬</span>
          <span class="bk-btn__title">WhatsApp</span>
          <span class="bk-btn__label">Instant Reply</span>
        </a>
        <a href="${callLink}" class="bk-btn bk-btn--call" aria-label="Call us">
          <span class="bk-btn__icon">📞</span>
          <span class="bk-btn__title">Call Now</span>
          <span class="bk-btn__label">${esc(br.phone)}</span>
        </a>
        <a href="${mailLink}" class="bk-btn bk-btn--email" aria-label="Email us">
          <span class="bk-btn__icon">✉️</span>
          <span class="bk-btn__title">Send Email</span>
          <span class="bk-btn__label">Pre-filled for you</span>
        </a>
      </div>

      <div class="bk-divider" data-aos="fade-up"><span>OR fill the form below</span></div>

      <div class="booking-page__grid">
        <aside class="booking-page__aside" data-aos="fade-up">
          <h2 class="booking-page__aside-title">${esc(b.title)}</h2>
          <p class="booking-page__aside-body">${esc(b.subtitle)}</p>
          <div class="booking-contact-cards">
            ${b.contactMethods.map(m => `
              <a href="${esc(m.href)}" class="booking-contact-card" target="_blank" rel="noopener noreferrer">
                <span class="booking-contact-card__icon">${m.icon}</span>
                <div>
                  <div class="booking-contact-card__label">${esc(m.label)}</div>
                  <div class="booking-contact-card__value">${esc(m.value)}</div>
                </div>
              </a>`).join('')}
          </div>
          <div style="margin-top:2rem;padding:1.5rem;background:var(--cream-dark);border-radius:var(--radius-md);">
            <h4 style="font-size:1rem;margin-bottom:.5rem;">📋 What Happens Next?</h4>
            <ol style="font-size:.875rem;color:var(--text-mid);line-height:2.2;padding-left:1.5rem;">
              <li>Fill in your details and send inquiry</li>
              <li>Our Kashmir expert calls within 2 hours</li>
              <li>We craft a personalised itinerary</li>
              <li>Review, adjust and confirm</li>
              <li>Your adventure begins! 🎉</li>
            </ol>
          </div>
        </aside>

        <div class="booking-form-card" data-aos="fade-up" data-aos-delay="150">
          <h2>Send Your Inquiry</h2>
          <p class="form-subtitle" style="font-size:.9rem;color:var(--text-light);margin-bottom:2rem;">Mon–Sat · 9AM–8PM IST · Reply within 2 hours</p>
          <form id="booking-page-form" novalidate>
            <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
            <input type="hidden" name="selected_package" value="${esc(itemName)}">
            <div class="form-row">
              <div class="form-group">
                <label for="bk-name" class="form-label">Full Name <span class="form-req">*</span></label>
                <input type="text" id="bk-name" name="name" class="form-input" placeholder="Your full name" required>
              </div>
              <div class="form-group">
                <label for="bk-phone" class="form-label">Phone / WhatsApp <span class="form-req">*</span></label>
                <input type="tel" id="bk-phone" name="phone" class="form-input" placeholder="+91 XXXXX XXXXX" required>
              </div>
            </div>
            <div class="form-row form-row--full">
              <div class="form-group">
                <label for="bk-email" class="form-label">Email Address</label>
                <input type="email" id="bk-email" name="email" class="form-input" placeholder="your@email.com">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="bk-destination" class="form-label">Destination</label>
                <select id="bk-destination" name="destination" class="form-select">
                  <option value="">Select destination</option>
                  <option value="All Kashmir (Classic Tour)">All Kashmir (Classic Tour)</option>
                  <option value="Srinagar & Dal Lake">Srinagar &amp; Dal Lake</option>
                  <option value="Gulmarg Gondola & Snow">Gulmarg Gondola &amp; Snow</option>
                  <option value="Pahalgam Valleys">Pahalgam Valleys</option>
                  <option value="Sonamarg Glacier">Sonamarg Glacier</option>
                  <option value="Doodhpathri & Yusmarg">Doodhpathri &amp; Yusmarg</option>
                  <option value="Gurez Valley Offbeat">Gurez Valley Offbeat</option>
                </select>
              </div>
              <div class="form-group">
                <label for="bk-service" class="form-label">Service Type <span class="form-req">*</span></label>
                <select id="bk-service" name="service" class="form-select" required>
                  <option value="">Select service</option>
                  <option value="Tour Package" ${type === 'tour' ? 'selected' : ''}>Tour Package</option>
                  <option value="Cab / Vehicle Rental" ${type === 'rental' ? 'selected' : ''}>Cab / Vehicle Rental</option>
                  <option value="Air Ticket">Air Ticket</option>
                  <option value="Train Ticket">Train Ticket</option>
                  <option value="Gondola Ticket">Gondola Ticket</option>
                  <option value="Hotel Booking">Hotel Booking</option>
                  <option value="Honeymoon Package">Honeymoon Package</option>
                  <option value="Adventure Trek">Adventure Trek</option>
                  <option value="B2B Services">B2B Services</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="bk-travellers" class="form-label">No. of Travellers</label>
                <select id="bk-travellers" name="travellers" class="form-select">
                  <option value="">Select group size</option>
                  <option value="1">1 Person</option>
                  <option value="2">2 Persons (Couple)</option>
                  <option value="3–5">3–5 Persons (Family)</option>
                  <option value="6–10">6–10 Persons (Group)</option>
                  <option value="11+">11+ Persons (Large Group)</option>
                </select>
              </div>
              <div class="form-group">
                <label for="bk-dates" class="form-label">Travel Dates</label>
                <input type="text" id="bk-dates" name="dates" class="form-input" placeholder="e.g. 15 Dec – 20 Dec">
              </div>
            </div>
            <div class="form-row form-row--full">
              <div class="form-group">
                <label for="bk-message" class="form-label">Message / Special Requests</label>
                <textarea id="bk-message" name="message" class="form-textarea" rows="3" placeholder="Tell us about your trip — budget, vehicle preferences...">${itemName ? `Inquiry for ${itemName}` : ''}</textarea>
              </div>
            </div>
            <button type="submit" class="form-submit">Send Inquiry →</button>
            <p class="form-privacy">We respect your privacy. Your details are never shared with third parties.</p>
            <div class="form-success" id="booking-page-form-success" style="display:none;">
              <h3>✈️ Inquiry Sent!</h3>
              <p>Our travel experts will contact you within 2 hours.</p>
            </div>
          </form>
        </div>
      </div>
    </div>`;

  initForm('booking-page-form', '', 'booking-page');
}

/* ═══════════════════════════════════════════════════════
   FORM SUBMISSION (WhatsApp & Validation)
═══════════════════════════════════════════════════════ */
function initForm(formId, endpoint, formType = 'contact') {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach(el => {
      el.style.borderColor = '';
      if (!el.value.trim()) {
        el.style.borderColor = '#e74c3c';
        valid = false;
      }
    });

    if (!valid) {
      form.querySelector('[required]')?.focus();
      return;
    }

    const btn = form.querySelector('.form-submit') || form.querySelector('button[type="submit"]');
    if (btn) {
      btn.textContent = 'Opening WhatsApp…';
      btn.disabled = true;
    }

    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      if (key !== '_gotcha') data[key] = value;
    }

    try {
      const waUrl = buildWhatsAppUrl(formType, data);
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      form.querySelectorAll('input,select,textarea,button,.form-privacy').forEach(el => el.style.display = 'none');
      const suc = document.getElementById(formId + '-success');
      if (suc) suc.style.display = 'block';
    } catch (_) {
      const wa = `https://wa.me/${window.SITE_CONTENT?.brand?.whatsapp || '918825083535'}?text=${encodeURIComponent('Hi! I sent an inquiry from your website.')}`;
      if (btn) {
        btn.innerHTML = `<a href="${wa}" target="_blank" style="color:inherit;text-decoration:none;">📱 Continue on WhatsApp</a>`;
        btn.disabled = false;
      }
    }
  });
}

/* ═══════════════════════════════════════════════════════
   FAQ ACCORDION (contact.html)
═══════════════════════════════════════════════════════ */
function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(q => {
    const toggle = () => {
      const item = q.closest('.faq-item');
      if (!item) return;
      const open = !item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (open) item.classList.add('open');
      q.setAttribute('aria-expanded', open);
    };
    q.addEventListener('click', toggle);
    q.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════
   LIGHTWEIGHT ANIMATIONS (AOS — Animate On Scroll)
═══════════════════════════════════════════════════════ */
function initAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 650,
      easing: 'ease-out-cubic',
      once: true,
      offset: 40
    });
  }
}

function refreshAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.refresh();
  }
}

/* ═══════════════════════════════════════════════════════
   COUNT-UP ANIMATIONS (Stats)
═══════════════════════════════════════════════════════ */
function initCountUp() {
  const nums = document.querySelectorAll('.stat__number[data-target]');
  if (!nums.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      const display = el.dataset.display || '';
      const isDecimal = String(target).includes('.');
      const duration = 1400;
      const start = performance.now();

      const step = now => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const val = target * ease;
        if (isDecimal) el.textContent = val.toFixed(1) + (display.includes('/') ? '/5' : '');
        else el.textContent = Math.floor(val) + (display.includes('+') ? '+' : '');
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = display;
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.3 });

  nums.forEach(n => io.observe(n));
}

/* ═══════════════════════════════════════════════════════
   SCROLL TO TOP
═══════════════════════════════════════════════════════ */
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ═══════════════════════════════════════════════════════
   APPLICATION BOOTSTRAP (Fast & Synchronous)
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const content = window.SITE_CONTENT;
    const page = document.body?.dataset?.page || document.body?.getAttribute?.('data-page') || 'home';

    // Interactive global handlers
    initNav();
    initCountUp();
    initScrollTop();

    // Attach newsletter form handler across all pages
    initForm('newsletter-form', '', 'newsletter');

    // Page-specific dynamic modules
    if (content) {
      switch (page) {
        case 'home':
          renderDestinationsHome(content);
          renderToursHome(content);
          renderRentalsHome(content);
          renderTestimonials(content);
          initForm('booking-home-form', '', 'booking-home');
          break;

        case 'destinations':
          renderDestinationsPage(content);
          break;

        case 'tours':
          renderToursPage(content);
          break;

        case 'rentals':
          renderRentalsPage(content);
          break;

        case 'booking':
          renderBookingPage(content);
          break;

        case 'contact':
          initFAQ();
          initForm('contact-form', '', 'contact');
          break;

        case 'reviews':
          renderReviewsPage();
          break;
      }
    }

    // Initialize lightweight AOS animations & refresh after DOM injection
    initAOS();
    refreshAOS();

  } catch (e) {
    console.error('Site init error:', e);
  }
});
