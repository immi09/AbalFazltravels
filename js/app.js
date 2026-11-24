/**
 * Abalfazl Travels — app.js
 * ===========================
 * Reads from window.SITE_CONTENT & window.SITE_SEO (data/data.js)
 * Works with file://, http://, and any CDN — no server required.
 */
'use strict';

/* ═══════════════════════════════════════════════════════
   CONFIGURATION — REPLACE THESE WITH YOUR ACTUAL VALUES
═══════════════════════════════════════════════════════ */
// Google Apps Script Web App URL (from deployment)
// 1. Open Google Sheets → Extensions → Apps Script
// 2. Paste the code from google-apps-script/reviews-api.gs
// 3. Replace SHEET_ID with your Google Sheet ID
// 4. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone
// 5. Copy the Web App URL and paste below
const REVIEWS_API_URL = 'https://script.google.com/macros/s/AKfycbzpnTA9y1-4tL1IuTW2ECuK5gpX5wCopg4wpRXJip-ZzbVjPv1dPj5py6yJHElNjZWL/exec';

// WhatsApp Integration — All non-review forms now open WhatsApp with pre-filled messages
// The WhatsApp number is sourced from SITE_CONTENT.brand.whatsapp (default: 918825083535)
function buildWhatsAppUrl(formType, formData) {
  const brand = window.SITE_CONTENT?.brand || {};
  const waNumber = brand.whatsapp || '918825083535';

  let message = '';

  switch (formType) {
    case 'contact':
      message = `📬 *New Contact Enquiry — Abalfazl Travels*\n\n`;
      message += `👤 *Name:* ${formData.name || 'Not provided'}\n`;
      message += `📧 *Email:* ${formData.email || 'Not provided'}\n`;
      message += `📱 *Phone:* ${formData.phone || 'Not provided'}\n`;
      message += `📋 *Subject:* ${formData.subject || 'General Enquiry'}\n`;
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

// Google Form Entry IDs — KEPT for review form fallback only
// Right-click each field in the live form → Inspect → Look for name="entry.XXXXXXXXX"
// For review form: create a form with fields: Name, Email, Location, Rating, Review Text
const FORM_ENTRIES = {
  review: {
    name: 'entry.XXXXXXXXX',
    email: 'entry.XXXXXXXXX',
    location: 'entry.XXXXXXXXX',
    rating: 'entry.XXXXXXXXX',
    text: 'entry.XXXXXXXXX',
    gender: 'entry.XXXXXXXXX'
  }
  // contact, booking, newsletter entries removed — now using WhatsApp
};

// Curated Unsplash profile avatars for male/female travelers
const MALE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face'
];

const FEMALE_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face'
];

// Pagination settings
const REVIEWS_PER_PAGE = 10;

/* ═══════════════════════════════════════════════════════
   SVG ICON LIBRARY
═══════════════════════════════════════════════════════ */
const SVG = {
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.024 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.097 24 18.1 24 12.073z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>`,
  twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zM17.08 19.77h1.833L7.084 4.126H5.117z"/></svg>`,
  wa: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`
};

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function esc(s) { const d = document.createElement('div'); d.textContent = String(s ?? ''); return d.innerHTML; }

function stars(n) {
  const full = Math.floor(n), half = Math.ceil(n) > full ? 1 : 0, empty = 5 - full - half;
  return `<span class="stars" aria-label="${n} out of 5">${'★'.repeat(full)}${half ? '½' : ''}${'☆'.repeat(empty)}</span>`;
}

/* ═══════════════════════════════════════════════════════
   SEO INJECTION
═══════════════════════════════════════════════════════ */
function injectSEO(seo, page) {
  const g = seo.global, p = (seo.pages || {})[page] || {};
  const setMeta = (name, val, attr = 'name') => {
    if (!val) return;
    let m = document.querySelector(`meta[${attr}="${name}"]`);
    if (!m) { m = document.createElement('meta'); m.setAttribute(attr, name); document.head.appendChild(m); }
    m.setAttribute('content', val);
  };
  const setLink = (rel, href) => {
    if (!href) return;
    let l = document.querySelector(`link[rel="${rel}"]`);
    if (!l) { l = document.createElement('link'); l.rel = rel; document.head.appendChild(l); }
    l.href = href;
  };
  if (p.title) document.title = p.title;
  setMeta('description', p.description);
  setMeta('keywords', p.keywords);
  setMeta('robots', g.robots);
  setLink('canonical', p.canonical);
  const og = p.og || {};
  setMeta('og:site_name', g.siteName, 'property');
  setMeta('og:locale', g.locale, 'property');
  setMeta('og:title', og.title, 'property');
  setMeta('og:description', og.description, 'property');
  setMeta('og:image', og.image, 'property');
  setMeta('og:type', og.type || 'website', 'property');
  setMeta('og:url', p.canonical || g.siteUrl, 'property');
  const tw = p.twitter || {};
  setMeta('twitter:card', tw.card || 'summary_large_image');
  setMeta('twitter:site', g.twitterHandle || '');
  setMeta('twitter:title', tw.title || og.title);
  setMeta('twitter:description', tw.description || og.description);
  setMeta('twitter:image', tw.image || og.image);
  if (p.schema) {
    let s = document.getElementById('json-ld') || document.createElement('script');
    s.id = 'json-ld'; s.type = 'application/ld+json';
    s.textContent = JSON.stringify(p.schema, null, 2);
    document.head.appendChild(s);
  }
}

/* ═══════════════════════════════════════════════════════
   NAV RENDERER
═══════════════════════════════════════════════════════ */
function renderNav(d) {
  const nav = document.getElementById('site-nav');
  console.log('renderNav called, nav element:', nav);
  if (!nav) return;
  const page = document.body.dataset.page || 'home';

  const links = d.nav.links.map(l => {
    const active = l.href.split('#')[0].replace('.html', '') === page ||
      (page === 'home' && l.href === 'index.html') ? 'active' : '';
    return `<a href="${esc(l.href)}" class="${active}">${esc(l.text)}</a>`;
  }).join('');

  nav.innerHTML = `
    <a href="index.html" class="nav__logo" aria-label="${esc(d.brand.fullName)} Home">
      <img src="${esc(d.brand.logo)}" alt="${esc(d.brand.fullName)}" class="nav__logo-img">
      <span class="nav__logo-text">
        <span class="nav__logo-title">${esc(d.brand.name)}</span>
        <span class="nav__logo-sub">${esc(d.brand.tagline)}</span>
      </span>
    </a>
    <nav class="nav__links" aria-label="Primary navigation">${links}</nav>
    <a href="${esc(d.nav.cta.href)}" class="nav__cta">${esc(d.nav.cta.text)}</a>
    <button class="nav__hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>`;

  // Mobile nav
  let mob = document.getElementById('mobile-nav');
  if (!mob) { mob = document.createElement('div'); mob.id = 'mobile-nav'; mob.className = 'nav__mobile'; mob.setAttribute('role', 'navigation'); mob.setAttribute('aria-label', 'Mobile'); document.body.appendChild(mob); }
  mob.innerHTML = d.nav.links.map(l => `<a href="${esc(l.href)}">${esc(l.text)}</a>`).join('') +
    `<a href="${esc(d.nav.cta.href)}" class="btn btn--gold nav__mobile-cta">${esc(d.nav.cta.text)}</a>`;

  // Scroll shrink
  window.addEventListener('scroll', () => nav.classList.toggle('nav--scrolled', scrollY > 40), { passive: true });

  // Hamburger toggle
  document.getElementById('hamburger').addEventListener('click', function () {
    const open = !mob.classList.contains('open');
    mob.classList.toggle('open', open);
    this.classList.toggle('active', open);
    this.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mob.classList.remove('open');
    document.getElementById('hamburger').classList.remove('active');
    document.body.style.overflow = '';
  }));

  // Skip link
  const skip = Object.assign(document.createElement('a'), { href: '#main-content', textContent: 'Skip to content' });
  skip.className = 'skip-link';
  document.body.prepend(skip);
}

/* ═══════════════════════════════════════════════════════
   HERO (Dribbble Split Layout)
═══════════════════════════════════════════════════════ */
function renderHero(d) {
  const sec = document.getElementById('hero');
  if (!sec) return;
  const h = d.hero || {};
  const br = d.brand || {};
  const waNum = br.whatsapp || '918825083535';

  const cards = h.cards || [
    {
      title: "Dal Lake Trip",
      subtitle: "Houseboat & Shikara",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=400&fit=crop",
      href: "destinations.html"
    },
    {
      title: "Gulmarg Trip",
      subtitle: "Gondola & Snow Peaks",
      image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=500&h=400&fit=crop",
      href: "tours.html"
    }
  ];

  sec.innerHTML = `
    <!-- Left Vertical Sidebar (Scroll indicator) -->
    <aside class="hero-split__sidebar" aria-hidden="true">
      <div class="hero-split__sidebar-track">
        <span class="hero-split__sidebar-arrow">←</span>
        <span class="hero-split__sidebar-label">SCROLL DOWN</span>
      </div>
    </aside>

    <!-- Main Hero Body Canvas -->
    <div class="hero-split__canvas">

      <!-- Left Column: Editorial Content -->
      <div class="hero-split__content-col">

        <!-- Eyebrow with dash -->
        <div class="hero-split__eyebrow reveal">
          <span class="hero-split__eyebrow-dash"></span>
          <span class="hero-split__eyebrow-text">${esc(h.eyebrow || 'Kashmir — Heaven on Earth')}</span>
        </div>

        <!-- Headline -->
        <h1 class="hero-split__headline reveal reveal-delay-1">
          ${esc(h.headlineLine1 || 'Where Ever You Go,')}<br>
          <span class="hero-split__headline-gold">${esc(h.headlineLine2 || 'Go With Your Heart')}</span>
        </h1>

        <!-- Editorial Paragraph -->
        <p class="hero-split__desc reveal reveal-delay-2">
          ${esc(h.subheadline || 'Enjoy Your Adventure In Paradise On Earth. Handcrafted Kashmir journeys across pine forests, alpine meadows, and serene lakes with trusted local guides.')}
        </p>

        <!-- Mini Feature Cards Grid -->
        <div class="hero-split__cards reveal reveal-delay-2">
          ${cards.map(c => `
            <a href="${esc(c.href)}" class="hero-split__card" aria-label="${esc(c.title)}">
              <img src="${esc(c.image)}" alt="${esc(c.imageAlt || c.title)}" class="hero-split__card-img" loading="eager">
              <div class="hero-split__card-overlay"></div>
              <div class="hero-split__card-footer">
                <span class="hero-split__card-title">${esc(c.title)}</span>
                <span class="hero-split__card-play" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </span>
              </div>
            </a>
          `).join('')}
        </div>

        <!-- Action Button Row -->
        <div class="hero-split__actions reveal reveal-delay-3">
          <a href="${esc(h.ctaHref || 'tours.html')}" class="hero-split__btn-explore">
            ${esc(h.ctaText || 'EXPLORE MORE')}
          </a>
          <a href="https://wa.me/${waNum}?text=${encodeURIComponent("Hi! I'd like to plan a Kashmir trip with Abalfazl Travels.")}" target="_blank" rel="noopener noreferrer" class="hero-split__btn-wa">
            <span class="hero-split__btn-wa-icon">${SVG.wa || '💬'}</span>
            <span>WhatsApp Us</span>
          </a>
        </div>

      </div>

      <!-- Right Column: Kashmir Tour & Travel Visual (Dal Lake & Snow Peaks) -->
      <div class="hero-split__visual-col">
        <div class="hero-split__travel-frame">
          <img src="${esc(h.travelImage || 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1200&h=1400&fit=crop')}" alt="${esc(h.travelAlt || 'Dal Lake Shikara Tour Kashmir')}" class="hero-split__travel-img" loading="eager">
          </div>
        </div>
      </div>

    </div>
  `;
}

/* ═══════════════════════════════════════════════════════
   SERVICES SECTION
═══════════════════════════════════════════════════════ */
function renderServices(d) {
  const sec = document.getElementById('services');
  if (!sec) return;
  const sv = d.services;
  sec.innerHTML = `
    <div class="container">
      <div class="services__header reveal">
        <span class="section-eyebrow">${esc(sv.eyebrow)}</span>
        <h2 class="section-title">${esc(sv.title)}</h2>
        <p class="section-subtitle" style="margin:0 auto;">${esc(sv.subtitle)}</p>
      </div>
      <div class="services__grid">
        ${sv.items.map((s, i) => `
          <a href="${esc(s.href)}" class="service-card reveal" style="transition-delay:${.07 * i}s;--svc-color:${s.color}">
            <div class="service-card__icon-wrap">
              <span class="service-card__icon">${esc(s.icon)}</span>
            </div>
            <h3 class="service-card__title">${esc(s.title)}</h3>
            <p class="service-card__desc">${esc(s.desc)}</p>
            <span class="service-card__arrow">→</span>
          </a>`).join('')}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   ABOUT
═══════════════════════════════════════════════════════ */
function renderAbout(d) {
  const sec = document.getElementById('about-section');
  if (!sec) return;
  const a = d.about;
  sec.innerHTML = `
    <div class="container">
      <div class="about__text reveal">
        <span class="section-eyebrow">${esc(a.eyebrow)}</span>
        <h2 class="section-title">${esc(a.title)}</h2>
        <p class="about__body">${esc(a.body)}</p>
        <ul class="about__highlights">
          ${a.highlights.map(h => `
            <li class="about__highlight">
              <span class="about__highlight-icon">${esc(h.icon)}</span>
              ${esc(h.label)}
            </li>`).join('')}
        </ul>
      </div>
      <div class="about__visual reveal reveal-delay-2">
        <img src="${esc(a.image)}" alt="${esc(a.imageAlt)}" class="about__img" loading="lazy" width="800" height="600">
        <blockquote class="about__quote">${esc(a.pullQuote).replace('\n', '<br>')}</blockquote>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   ITINERARY
═══════════════════════════════════════════════════════ */
function renderItinerary(d) {
  const sec = document.getElementById('itinerary');
  if (!sec) return;
  const it = d.itinerary;
  sec.innerHTML = `
    <div class="container">
      <div class="itinerary__left reveal">
        <span class="section-eyebrow">${esc(it.eyebrow)}</span>
        <h2 class="section-title">${esc(it.title)}</h2>
        <p class="section-subtitle">${esc(it.subtitle)}</p>
        <p class="section-body">${esc(it.body)}</p>
        <a href="${esc(it.cta.href)}" class="btn btn--gold btn--sm">${esc(it.cta.text)}</a>
        <p class="itinerary__tagline">${esc(it.tagline)}</p>
      </div>
      <div class="itinerary__steps reveal reveal-delay-2">
        ${it.steps.map((s, i) => `
          <div class="itinerary__step reveal" style="transition-delay:${.1 * i}s">
            <span class="itinerary__step-days">${esc(s.days)}</span>
            <div class="itinerary__step-info">
              <div class="itinerary__step-location">${esc(s.location)}</div>
              <div class="itinerary__step-desc">${esc(s.desc)}</div>
            </div>
            <img src="${esc(s.image)}" alt="${esc(s.imageAlt)}" class="itinerary__step-img" loading="lazy" width="80" height="60">
          </div>`).join('')}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   INCLUDED
═══════════════════════════════════════════════════════ */
function renderIncluded(d) {
  const sec = document.getElementById('included');
  if (!sec) return;
  const inc = d.included;
  sec.innerHTML = `
    <div class="container">
      <div class="included__header reveal">
        <span class="section-eyebrow">${esc(inc.eyebrow)}</span>
        <h2 class="section-title">${esc(inc.title)}</h2>
        <p class="section-subtitle" style="margin:0 auto;">${esc(inc.subtitle)}</p>
      </div>
      <div class="included__grid">
        ${inc.items.map((item, i) => `
          <div class="included__card reveal" style="transition-delay:${.1 * i}s">
            <span class="included__icon" aria-hidden="true">${esc(item.icon)}</span>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.desc)}</p>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   DESTINATIONS HOME
═══════════════════════════════════════════════════════ */
function renderDestinationsHome(d) {
  const sec = document.getElementById('destinations-home');
  if (!sec) return;
  const ds = d.destinations;
  sec.innerHTML = `
    <div class="container">
      <div class="destinations__header reveal">
        <div>
          <span class="section-eyebrow">${esc(ds.sectionEyebrow)}</span>
          <h2 class="section-title">${esc(ds.sectionTitle)}</h2>
          <p class="section-subtitle">${esc(ds.sectionSubtitle)}</p>
        </div>
        <a href="destinations.html" class="btn btn--outline-gold btn--sm">View All</a>
      </div>
      <div class="destinations__grid">
        ${ds.items.slice(0, 8).map((item, i) => `
          <article class="dest-card reveal" style="transition-delay:${.07 * i}s">
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
   TOURS HOME
═══════════════════════════════════════════════════════ */
function renderToursHome(d) {
  const sec = document.getElementById('tours-home');
  if (!sec) return;
  const ts = d.tours;
  sec.innerHTML = `
    <div class="container">
      <div class="tours__header reveal">
        <span class="section-eyebrow">${esc(ts.sectionEyebrow)}</span>
        <h2 class="section-title">${esc(ts.sectionTitle)}</h2>
        <p class="section-subtitle">${esc(ts.sectionSubtitle)}</p>
      </div>
      <div class="tours__grid">
        ${ts.items.slice(0, 6).map((t, i) => tourCardHTML(t, i)).join('')}
      </div>
      <div style="text-align:center;margin-top:3rem" class="reveal">
        <a href="tours.html" class="btn btn--dark">View All Packages →</a>
      </div>
    </div>`;
}

function tourCardHTML(t, i = 0) {
  const bkUrl = `booking.html?type=tour&name=${encodeURIComponent(t.title)}&price=${encodeURIComponent(t.price)}&duration=${encodeURIComponent(t.duration)}&group=${encodeURIComponent(t.groupSize)}&id=${esc(t.id)}`;
  return `
    <article class="tour-card reveal" style="transition-delay:${.1 * i}s" id="${esc(t.id)}">
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
   RENTALS HOME
═══════════════════════════════════════════════════════ */
function renderRentalsHome(d) {
  const sec = document.getElementById('rentals-home');
  if (!sec) return;
  const rn = d.rentals;

  sec.innerHTML = `
    <div class="container">
      <div class="rentals__header reveal">
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
      <div style="text-align:center;margin-top:2.5rem" class="reveal">
        <a href="${esc(rn.cta.href)}" class="btn btn--dark">${esc(rn.cta.text)}</a>
      </div>
    </div>`;

  // Tab switching
  sec.querySelectorAll('.rentals__tab').forEach(btn => {
    btn.addEventListener('click', function () {
      sec.querySelectorAll('.rentals__tab').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      sec.querySelectorAll('.rentals__panel').forEach(p => p.classList.remove('active'));
      this.classList.add('active'); this.setAttribute('aria-selected', 'true');
      document.getElementById('tab-' + this.dataset.tab)?.classList.add('active');
    });
  });
}

function rentalCardHTML(item, i = 0) {
  return `
    <article class="rental-card reveal" style="transition-delay:${.1 * i}s">
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
   STATS
═══════════════════════════════════════════════════════ */
function renderStats(d) {
  const sec = document.getElementById('stats');
  if (!sec) return;
  sec.innerHTML = `
    <div class="container">
      <div class="stats__grid">
        ${d.stats.map((s, i) => `
          <div class="stat__item reveal" style="transition-delay:${.1 * i}s">
            <span class="stat__icon" aria-hidden="true">${esc(s.icon)}</span>
            <div class="stat__number" data-target="${s.number}" data-display="${esc(s.display)}">${esc(s.display)}</div>
            <div class="stat__label">${esc(s.label)}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   TESTIMONIALS (Homepage - Latest 3 Approved Reviews)
═══════════════════════════════════════════════════════ */
async function renderTestimonials(d) {
  const sec = document.getElementById('testimonials');
  if (!sec) return;

  // Show loading state
  sec.innerHTML = `
    <div class="container">
      <div class="testimonials__header reveal">
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
      <div style="text-align:center;margin-top:2.5rem;display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;" class="reveal">
        <a href="reviews.html" class="btn btn--dark">View All Guest Reviews →</a>
        <a href="reviews.html#write-review" class="btn btn--gold">★ Write a Review</a>
      </div>
    </div>`;

  try {
    // Fetch latest 3 approved reviews from API
    const reviews = await fetchTestimonials();
    renderTestimonialsCarousel(reviews);
  } catch (err) {
    console.error('Failed to load testimonials:', err);
    // Fallback to hardcoded testimonials
    renderTestimonialsCarousel(d.testimonials || []);
  }
}

// Fetch latest 3 approved reviews for homepage
async function fetchTestimonials() {
  if (!REVIEWS_API_URL || REVIEWS_API_URL.includes('YOUR_APPS_SCRIPT_ID')) {
    console.warn('REVIEWS_API_URL not configured, using fallback');
    return getFallbackReviews().slice(0, 3);
  }

  try {
    const response = await fetch(REVIEWS_API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    const reviews = Array.isArray(data) ? data : getFallbackReviews();
    // Return latest 3 (already sorted by date descending from API)
    return reviews.slice(0, 3);
  } catch (err) {
    console.warn('Could not fetch testimonials from API, using fallback:', err);
    return getFallbackReviews().slice(0, 3);
  }
}

function renderTestimonialsCarousel(items) {
  const track = document.getElementById('testi-track');
  const dots = document.getElementById('testi-dots');
  const prevBtn = document.getElementById('testi-prev');
  const nextBtn = document.getElementById('testi-next');
  if (!track || !dots || !prevBtn || !nextBtn) return;

  let idx = 0;
  let autoAdvanceTimer = null;

  const pv = () => window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
  const shouldSlide = () => items.length > pv();

  function renderCards() {
    track.innerHTML = items.map(t => `
      <article class="testi-card">
        <div class="testi-card__stars">${stars(t.rating)}</div>
        <p class="testi-card__quote">${esc(t.text)}</p>
        <div class="testi-card__author">
          <img src="${esc(t.avatar)}" alt="${esc(t.name)}" class="testi-card__avatar" loading="lazy" width="48" height="48">
          <div>
            <div class="testi-card__name">${esc(t.name)}</div>
            <div class="testi-card__location">${esc(t.location)}</div>
            ${t.tour ? `<div class="testi-card__tour">${esc(t.tour)}</div>` : ''}
          </div>
        </div>
      </article>`).join('');
  }

  function renderDots() {
    dots.innerHTML = items.map((_, i) => `<button class="testi-dot${i === 0 ? ' active' : ''}" data-i="${i}" aria-label="Review ${i + 1}"></button>`).join('');
  }

  function updateControls() {
    const maxIdx = Math.max(0, items.length - pv());
    prevBtn.disabled = idx === 0 || !shouldSlide();
    nextBtn.disabled = idx >= maxIdx || !shouldSlide();
    prevBtn.style.opacity = (idx === 0 || !shouldSlide()) ? '0.4' : '1';
    nextBtn.style.opacity = (idx >= maxIdx || !shouldSlide()) ? '0.4' : '1';
    prevBtn.style.pointerEvents = (idx === 0 || !shouldSlide()) ? 'none' : 'auto';
    nextBtn.style.pointerEvents = (idx >= maxIdx || !shouldSlide()) ? 'none' : 'auto';
    dots.querySelectorAll('.testi-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  function goTo(n) {
    if (!shouldSlide()) return;
    const max = Math.max(0, items.length - pv());
    idx = Math.max(0, Math.min(n, max));
    const card = track.children[0];
    if (!card) return;
    const w = card.offsetWidth + 24; // gap
    track.style.transform = `translateX(-${idx * w}px)`;
    updateControls();
  }

  function startAutoAdvance() {
    stopAutoAdvance();
    if (!shouldSlide()) return;
    autoAdvanceTimer = setInterval(() => {
      const max = Math.max(0, items.length - pv());
      if (idx < max) {
        goTo(idx + 1);
      } else {
        goTo(0);
      }
    }, 5500);
  }

  function stopAutoAdvance() {
    if (autoAdvanceTimer) {
      clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  // Initial render
  renderCards();
  renderDots();

  // Event listeners
  prevBtn.onclick = () => goTo(idx - 1);
  nextBtn.onclick = () => goTo(idx + 1);
  dots.onclick = e => { if (e.target.dataset.i !== undefined) goTo(+e.target.dataset.i); };

  // Touch/swipe support
  let sx = 0;
  track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; stopAutoAdvance(); }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) goTo(idx + (dx < 0 ? 1 : -1));
    startAutoAdvance();
  }, { passive: true });

  // Pause auto-advance on hover
  track.addEventListener('mouseenter', stopAutoAdvance);
  track.addEventListener('mouseleave', startAutoAdvance);
  dots.addEventListener('mouseenter', stopAutoAdvance);
  dots.addEventListener('mouseleave', startAutoAdvance);

  // Resize handler
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      idx = 0;
      goTo(0);
    }, 100);
  }, { passive: true });

  // Initialize
  updateControls();
  startAutoAdvance();
}

/* ═══════════════════════════════════════════════════════
   BOOKING CTA
═══════════════════════════════════════════════════════ */
function renderBookingCTA(d) {
  const sec = document.getElementById('booking-cta');
  if (!sec) return;
  const b = d.booking;
  sec.innerHTML = `
    <div class="container">
      <div class="booking-cta__left reveal">
        <span class="section-eyebrow">${esc(b.eyebrow)}</span>
        <h2 class="booking-cta__title">${esc(b.title)}</h2>
        <p class="booking-cta__subtitle">${esc(b.subtitle)}</p>
        <div class="booking-cta__methods">
          ${b.contactMethods.map(m => `
            <a href="${esc(m.href)}" class="booking-cta__method">
              <span class="booking-cta__method-icon">${m.icon}</span>
              <div>
                <div class="booking-cta__method-label">${esc(m.label)}</div>
                <div class="booking-cta__method-value">${esc(m.value)}</div>
              </div>
            </a>`).join('')}
        </div>
      </div>
      <div class="booking-cta__form-card reveal reveal-delay-2">
        <h3 class="booking-cta__form-title">Send Inquiry</h3>
        <p class="booking-cta__form-subtitle">We reply within 2 hours during business hours.</p>
        ${buildFormHTML(b, 'booking-home-form')}
      </div>
    </div>`;
  initForm('booking-home-form', b.formspreeEndpoint, 'booking');
}

/* ═══════════════════════════════════════════════════════
   REVIEWS PAGE
═══════════════════════════════════════════════════════ */
// Pagination state
let currentReviewsPage = 1;
let allReviews = [];

function renderReviewsPage() {
  const sec = document.getElementById('reviews-page');
  if (!sec) return;

  // Show loading state
  sec.innerHTML = `
    <div class="container">
      <div class="reviews-header">
        <span class="section-eyebrow">Guest Experiences</span>
        <h2 class="section-title">What Our Guests Say</h2>
      </div>
      <div class="reviews-grid" id="reviews-grid">
        <div class="reviews-loading">Loading reviews...</div>
      </div>
      <div class="reviews-pagination" id="reviews-pagination" style="display:none;"></div>
    </div>`;

  // Fetch reviews from Google Apps Script API
  fetchReviewsFromAPI().then(reviews => {
    allReviews = reviews;
    currentReviewsPage = 1;
    renderReviewsGrid(getCurrentPageReviews());
    renderPagination();
    renderReviewForm();
    initReviewCounter();
    formValidation();
  }).catch(err => {
    console.error('Failed to load reviews:', err);
    const grid = document.getElementById('reviews-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="reviews-empty">
          <h2>Unable to load reviews</h2>
          <p>Please try again later.</p>
        </div>`;
    }
    renderReviewForm();
    initReviewCounter();
    formValidation();
  });
}

// Fetch approved reviews from Google Apps Script Web App
async function fetchReviewsFromAPI() {
  if (!REVIEWS_API_URL || REVIEWS_API_URL.includes('YOUR_APPS_SCRIPT_ID')) {
    console.warn('REVIEWS_API_URL not configured, using fallback');
    return getFallbackReviews();
  }

  try {
    const response = await fetch(REVIEWS_API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // Handle error response from Apps Script
    if (data.error) throw new Error(data.error);

    // Ensure we have an array
    return Array.isArray(data) ? data : getFallbackReviews();
  } catch (err) {
    console.warn('Could not fetch from Apps Script API, using fallback:', err);
    return getFallbackReviews();
  }
}

// Get reviews for current page
function getCurrentPageReviews() {
  const start = (currentReviewsPage - 1) * REVIEWS_PER_PAGE;
  const end = start + REVIEWS_PER_PAGE;
  return allReviews.slice(start, end);
}

// Render pagination controls
function renderPagination() {
  const pagination = document.getElementById('reviews-pagination');
  if (!pagination) return;

  const totalPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);

  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'flex';

  let html = '';

  // Previous button
  html += `<button class="pagination-btn" ${currentReviewsPage === 1 ? 'disabled' : ''} data-page="${currentReviewsPage - 1}" aria-label="Previous page">‹ Prev</button>`;

  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentReviewsPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    html += `<button class="pagination-btn" data-page="1" aria-label="Page 1">1</button>`;
    if (startPage > 2) html += `<span class="pagination-ellipsis">…</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="pagination-btn${i === currentReviewsPage ? ' active' : ''}" data-page="${i}" aria-label="Page ${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="pagination-ellipsis">…</span>`;
    html += `<button class="pagination-btn" data-page="${totalPages}" aria-label="Page ${totalPages}">${totalPages}</button>`;
  }

  // Next button
  html += `<button class="pagination-btn" ${currentReviewsPage === totalPages ? 'disabled' : ''} data-page="${currentReviewsPage + 1}" aria-label="Next page">Next ›</button>`;

  pagination.innerHTML = html;

  // Add click handlers
  pagination.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      if (!isNaN(page) && page !== currentReviewsPage && page >= 1 && page <= totalPages) {
        currentReviewsPage = page;
        renderReviewsGrid(getCurrentPageReviews());
        renderPagination();
        // Scroll to top of reviews grid
        document.getElementById('reviews-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// Fallback reviews if Google Sheets unavailable
function getFallbackReviews() {
  return [
    {
      id: 1,
      name: "Rahul & Priya Sharma",
      email: "rahul.priya@example.com",
      location: "Delhi, India",
      tour: "Kashmir Honeymoon Special",
      rating: 5,
      text: "Abalfazl Travels arranged our entire Kashmir honeymoon — from the Dal Lake houseboat to Gulmarg. Everything was perfect, the guides were local and knew every hidden gem. Highly recommend!",
      date: "2024-01-15",
      approved: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=200&h=200&crop=face"
    },
    {
      id: 2,
      name: "Fatima Khan",
      email: "fatima@example.com",
      location: "Mumbai, India",
      tour: "Kashmir Classic Package",
      rating: 5,
      text: "Best travel agency in Srinagar! They got us Gulmarg Gondola tickets in advance so we skipped all the queues. The Innova cab was comfortable and the driver was excellent.",
      date: "2024-02-20",
      approved: true,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=200&h=200&crop=face"
    },
    {
      id: 3,
      name: "Vikram Nair",
      email: "vikram@example.com",
      location: "Bangalore, India",
      tour: "Kashmir Adventure & Trekking",
      rating: 5,
      text: "We did the adventure trekking package with Abalfazl Travels. Thajiwas Glacier and Gurez Valley were absolutely breathtaking. The team handled everything including permits. 10/10!",
      date: "2024-03-10",
      approved: true,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=200&h=200&crop=face"
    }
  ];
}

// Render the reviews grid
function renderReviewsGrid(reviews) {
  const grid = document.getElementById('reviews-grid');
  if (!grid) return;

  if (reviews.length === 0) {
    grid.innerHTML = `
      <div class="reviews-empty">
        <h2>Be the first to review</h2>
        <p>Submit your review below and it will appear once approved.</p>
      </div>`;
  } else {
    grid.innerHTML = `
      <div class="reviews-grid">
        ${reviews.map((r) => `
          <article class="review-card">
            <div class="review-card__header">
              <div class="review-card__stars">${stars(r.rating)}</div>
              <div class="review-card__author">
                <img src="${r.avatar}" alt="${r.name}" class="review-card__avatar" loading="lazy" width="60" height="60">
                <div>
                  <div class="review-card__name">${esc(r.name)}</div>
                  <div class="review-card__location">${esc(r.location)}</div>
                </div>
              </div>
            </div>
            <p class="review-card__quote">"${esc(r.text)}"</p>
            ${r.tour ? `<p class="review-card__tour">Tour: ${esc(r.tour)}</p>` : ''}
            <div class="review-card__date">${r.date}</div>
          </article>`).join('')}
      </div>`;
  }
}

// Render the review submission form
function renderReviewForm() {
  const sec = document.getElementById('reviews-page');
  if (!sec) return;

  const container = sec.querySelector('.container');
  if (!container) return;

  const formWrapper = document.createElement('div');
  formWrapper.className = 'reviews-form__wrapper';
  formWrapper.id = 'write-review';
  formWrapper.innerHTML = `
    <form id="new-review-form" class="reviews-form" novalidate>
      <div class="reviews-form__header">
        <span class="section-eyebrow">Write a Review</span>
        <h3>Share Your Experience</h3>
        <p>Your feedback helps us improve and guides fellow travellers</p>
      </div>
      <div class="reviews-form__group">
        <label for="reviewName" class="reviews-form__label">Your Name <span class="required">*</span></label>
        <input type="text" id="reviewName" name="name" class="reviews-form__input" placeholder="Your full name" required>
        <span class="reviews-form__error" id="reviewNameError" style="display:none;"></span>
      </div>
      <div class="reviews-form__group">
        <label for="reviewEmail" class="reviews-form__label">Email</label>
        <input type="email" id="reviewEmail" name="email" class="reviews-form__input" placeholder="you@email.com">
        <span class="reviews-form__error" id="reviewEmailError" style="display:none;"></span>
      </div>
      <div class="reviews-form__group">
        <label for="reviewLocation" class="reviews-form__label">Location</label>
        <input type="text" id="reviewLocation" name="location" class="reviews-form__input" placeholder="Your city, country">
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
        <label class="reviews-form__label">Rating <span class="required">*</span></label>
        <div class="rating-select-wrapper">
          <select id="reviewRating" name="rating" class="rating-select" required aria-label="Select rating">
            <option value="" disabled selected>Select your rating</option>
            <option value="5">★★★★★ Excellent</option>
            <option value="4">★★★★☆ Very Good</option>
            <option value="3">★★★☆☆ Good</option>
            <option value="2">★★☆☆☆ Fair</option>
            <option value="1">★☆☆☆☆ Poor</option>
          </select>
          <span class="rating-select__arrow" aria-hidden="true"></span>
        </div>
        <span class="reviews-form__error" id="reviewRatingError" style="display:none;"></span>
      </div>
      <div class="reviews-form__group">
        <label for="reviewText" class="reviews-form__label">Your Review <span class="required">*</span></label>
        <textarea id="reviewText" name="reviewText" class="reviews-form__textarea" rows="5" placeholder="Share your Kashmir experience..." required></textarea>
        <span class="reviews-form__error" id="reviewTextError" style="display:none;"></span>
      </div>
      <button type="submit" class="reviews-form__submit"><span>Submit Review</span></button>
    </form>`;

  container.appendChild(formWrapper);

  // Setup form submission to Google Apps Script Web App
  const newReviewForm = document.getElementById('new-review-form');
  newReviewForm.onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const location = form.location.value.trim();
    const avatarGender = form.avatarGender.value;
    const rating = form.rating.value;
    const text = form.reviewText.value.trim();

    // Clear previous errors
    const errorElements = form.querySelectorAll('.reviews-form__error');
    errorElements.forEach(el => el.style.display = 'none');
    form.querySelectorAll('.reviews-form__input, .reviews-form__textarea, .rating-select').forEach(el => el.classList.remove('error'));

    let hasError = false;

    if (!name) {
      document.getElementById('reviewNameError').textContent = 'Please enter your name';
      document.getElementById('reviewNameError').style.display = 'block';
      document.getElementById('reviewName').classList.add('error');
      hasError = true;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('reviewEmailError').textContent = 'Please enter a valid email address';
      document.getElementById('reviewEmailError').style.display = 'block';
      document.getElementById('reviewEmail').classList.add('error');
      hasError = true;
    }

    if (!avatarGender) {
      document.getElementById('reviewAvatarGenderError').textContent = 'Please select profile avatar (Male / Female)';
      document.getElementById('reviewAvatarGenderError').style.display = 'block';
      document.getElementById('reviewAvatarGender').classList.add('error');
      hasError = true;
    }

    if (!rating) {
      document.getElementById('reviewRatingError').textContent = 'Please select a rating';
      document.getElementById('reviewRatingError').style.display = 'block';
      document.getElementById('reviewRating').classList.add('error');
      hasError = true;
    }

    if (!text) {
      document.getElementById('reviewTextError').textContent = 'Please write your review';
      document.getElementById('reviewTextError').style.display = 'block';
      document.getElementById('reviewText').classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    // Pick avatar URL matching the selected gender
    let avatarUrl = '';
    if (avatarGender === 'female') {
      avatarUrl = FEMALE_AVATARS[Math.floor(Math.random() * FEMALE_AVATARS.length)];
    } else {
      avatarUrl = MALE_AVATARS[Math.floor(Math.random() * MALE_AVATARS.length)];
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('span');
    btnText.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
      // Submit via Google Apps Script Web App (doPost)
      // Use no-cors mode because Apps Script doesn't return CORS headers by default
      if (REVIEWS_API_URL && !REVIEWS_API_URL.includes('YOUR_APPS_SCRIPT_ID')) {
        await fetch(REVIEWS_API_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            location,
            rating: parseInt(rating),
            avatar: avatarUrl,
            gender: avatarGender,
            text,
          })
        });
        // With no-cors, we can't read the response, but the request still goes through
        // Assume success if no network error
      } else {
        // Fallback to Google Forms if Apps Script not configured
        const formUrl = 'https://docs.google.com/forms/d/e/YOUR_GOOGLE_FORM_ID/formResponse';
        const formData = new FormData();
        formData.append(FORM_ENTRIES.review.name, name);
        formData.append(FORM_ENTRIES.review.email, email);
        formData.append(FORM_ENTRIES.review.location, location);
        formData.append(FORM_ENTRIES.review.rating, rating);
        if (FORM_ENTRIES.review.gender) formData.append(FORM_ENTRIES.review.gender, avatarGender);
        formData.append(FORM_ENTRIES.review.text, text);

        await fetch(formUrl, { method: 'POST', mode: 'no-cors', body: formData });
      }

      // Success
      form.innerHTML = `
        <div class="reviews-form__success">
          <h3>Thank you for your review!</h3>
          <p>Your review has been submitted and will appear once approved by our team.</p>
        </div>`;
    } catch (err) {
      console.error('Form submission error:', err);
      // Even if fetch fails, Google Forms often still receives the data in no-cors mode
      form.innerHTML = `
        <div class="reviews-form__success">
          <h3>Thank you for your review!</h3>
          <p>Your review has been submitted and will appear once approved by our team.</p>
        </div>`;
    }
  };
}

/* ═══════════════════════════════════════════════════════
   UTILITIES: Reviews
═══════════════════════════════════════════════════════ */
function loadReviews() {
  const stored = localStorage.getItem('abalfazl_reviews');
  return stored ? JSON.parse(stored) : [
    {
      id: 1,
      name: "Rahul & Priya Sharma",
      email: "rahul.priya@example.com",
      location: "Delhi, India",
      tour: "Kashmir Honeymoon Special",
      rating: 5,
      text: "Abalfazl Travels arranged our entire Kashmir honeymoon — from the Dal Lake houseboat to Gulmarg. Everything was perfect, the guides were local and knew every hidden gem. Highly recommend!",
      date: "2024-01-15",
      approved: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=200&h=200&crop=face"
    },
    {
      id: 2,
      name: "Fatima Khan",
      email: "fatima@example.com",
      location: "Mumbai, India",
      tour: "Kashmir Classic Package",
      rating: 5,
      text: "Best travel agency in Srinagar! They got us Gulmarg Gondola tickets in advance so we skipped all the queues. The Innova cab was comfortable and the driver was excellent.",
      date: "2024-02-20",
      approved: true,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=200&h=200&crop=face"
    },
    {
      id: 3,
      name: "Vikram Nair",
      email: "vikram@example.com",
      location: "Bangalore, India",
      tour: "Kashmir Adventure & Trekking",
      rating: 5,
      text: "We did the adventure trekking package with Abalfazl Travels. Thajiwas Glacier and Gurez Valley were absolutely breathtaking. The team handled everything including permits. 10/10!",
      date: "2024-03-10",
      approved: true,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=200&h=200&crop=face"
    }
  ];
}

function saveReviews(reviews) {
  localStorage.setItem('abalfazl_reviews', JSON.stringify(reviews));
}

function initReviewCounter() {
  const reviews = loadReviews();
  const submitted = reviews.filter(r => !r.approved).length;
  const counter = document.querySelector('.reviews-form__counter');
  if (counter) counter.textContent = submitted;
}

function formValidation() {
  const form = document.getElementById('new-review-form');
  if (!form) return;

  form.querySelectorAll('input[required], textarea[required], select[required]').forEach(el => {
    el.addEventListener('blur', () => {
      if (!el.value.trim() && el.hasAttribute('required')) {
        el.classList.add('error');
      } else {
        el.classList.remove('error');
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════
   CSS: Reviews Page
═══════════════════════════════════════════════════════ */
function renderNewsletter(d) {
  const sec = document.getElementById('newsletter');
  if (!sec) return;
  const n = d.newsletter;
  sec.innerHTML = `
    <div class="container">
      <div class="newsletter__text reveal">
        <h2>${esc(n.title)}</h2>
        <p>${esc(n.subtitle)}</p>
      </div>
      <form class="newsletter__form reveal reveal-delay-2" id="newsletter-form" novalidate>
        <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
        <label class="sr-only" for="nl-email">Email</label>
        <input type="email" id="nl-email" name="email" class="newsletter__input" placeholder="${esc(n.placeholder)}" required autocomplete="email">
        <button type="submit" class="newsletter__btn">${esc(n.ctaText)}</button>
      </form>
    </div>`;
  // Use initForm for WhatsApp integration (same as contact/booking forms)
  initForm('newsletter-form', '', 'newsletter');
}

/* ═══════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════ */
function renderFooter(d) {
  const wrap = document.getElementById('site-footer');
  if (!wrap) return;
  const f = d.footer;
  const socials = f.social.map(s => `
    <a href="${esc(s.href)}" class="footer__social-link" aria-label="${esc(s.aria)}" target="_blank" rel="noopener noreferrer">
      ${SVG[s.svg] || '●'}
    </a>`).join('');
  const cols = Object.entries(f.links).map(([title, links]) => `
    <div class="footer__col">
      <h3 class="footer__col-title">${esc(title)}</h3>
      <ul class="footer__col-links">
        ${links.map(l => `<li><a href="${esc(l.href)}">${esc(l.text)}</a></li>`).join('')}
      </ul>
    </div>`).join('');
  wrap.innerHTML = `
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="index.html" class="nav__logo" style="margin-bottom:1.25rem;display:flex;" aria-label="${esc(d.brand.fullName)}">
            <img src="${esc(d.brand.logo)}" alt="${esc(d.brand.fullName)}" class="footer__logo-img">
            <span class="nav__logo-text">
              <span class="nav__logo-title" style="color:var(--white);">${esc(d.brand.name)}</span>
              <span class="nav__logo-sub">${esc(d.brand.tagline)}</span>
            </span>
          </a>
          <p class="footer__about">${esc(f.about)}</p>
          <div class="footer__social" aria-label="Social links">${socials}</div>
        </div>
        ${cols}
      </div>
      <div class="footer__bottom">
        <p>${esc(f.copyright)}</p>
        ${f.reviewCTA ? `
        <div class="footer__review-cta">
          <a href="${esc(f.reviewCTA.href)}" class="footer__review-cta-link" style="color:var(--gold);">
            ${esc(f.reviewCTA.title)}
          </a>
          <span class="footer__review-cta-desc">${esc(f.reviewCTA.description)}</span>
        </div>` : ''}
        <p>
          📞 <a href="${esc(d.brand.phoneHref)}" style="color:var(--gold);">${esc(d.brand.phone)}</a>
          &nbsp;|&nbsp;
          ✉ <a href="mailto:${esc(d.brand.email)}" style="color:var(--gold);">${esc(d.brand.email)}</a>
        </p>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   FORM BUILDER
═══════════════════════════════════════════════════════ */
function buildFormHTML(b, formId) {
  const fields = b.fields;
  let html = `<form id="${esc(formId)}" novalidate>
    <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">`;
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    if (f.half && i + 1 < fields.length && fields[i + 1].half) {
      html += `<div class="form-row">${fieldHTML(fields[i])}${fieldHTML(fields[i + 1])}</div>`; i += 2;
    } else {
      html += `<div class="form-row form-row--full">${fieldHTML(f)}</div>`; i++;
    }
  }
  html += `<button type="submit" class="form-submit">${esc(b.ctaText)}</button>
    <p class="form-privacy">${esc(b.privacyNote)}</p>
    <div class="form-success" id="${esc(formId)}-success" style="display:none;">
      <h3>✈️ Inquiry Sent!</h3>
      <p>Our travel experts will contact you within 2 hours.</p>
    </div>
  </form>`;
  return html;
}

function fieldHTML(f) {
  const req = f.required ? ' required' : '', ra = f.required ? ' aria-required="true"' : '';
  let input = '';
  if (f.type === 'select') {
    input = `<select id="${esc(f.id)}" name="${esc(f.id)}" class="form-select"${req}${ra}>
      <option value="">${esc(f.placeholder)}</option>
      ${(f.options || []).map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}
    </select>`;
  } else if (f.type === 'textarea') {
    input = `<textarea id="${esc(f.id)}" name="${esc(f.id)}" class="form-textarea" placeholder="${esc(f.placeholder)}"${req}${ra}></textarea>`;
  } else {
    input = `<input type="${esc(f.type)}" id="${esc(f.id)}" name="${esc(f.id)}" class="form-input" placeholder="${esc(f.placeholder)}"${req}${ra}>`;
  }
  return `<div class="form-group">
    <label class="form-label" for="${esc(f.id)}">${esc(f.label)}${f.required ? ` <span style="color:var(--gold)">*</span>` : ''}</label>
    ${input}
  </div>`;
}

// Submit form data to Google Forms or Apps Script
async function submitToGoogleForms(formData, formType) {
  // Try Apps Script Web App first if configured
  if (REVIEWS_API_URL && !REVIEWS_API_URL.includes('YOUR_APPS_SCRIPT_ID')) {
    // For contact/booking/newsletter, we'd need separate endpoints or a unified one
    // For now, fall through to Google Forms direct submission
  }

  // Direct Google Forms submission (no-cors)
  const formUrls = {
    contact: CONTACT_FORM_URL,
    booking: BOOKING_FORM_URL,
    newsletter: NEWSLETTER_FORM_URL,
    'booking-home': BOOKING_FORM_URL,
    'booking-page': BOOKING_FORM_URL,
  };

  const url = formUrls[formType];
  if (!url || url.includes('YOUR_FORM_ID')) {
    // No form URL configured - simulate success for demo
    console.log('Form submitted (demo mode):', Object.fromEntries(formData));
    return { success: true };
  }

  const entries = FORM_ENTRIES[formType] || {};
  const formDataToSend = new FormData();

  // Map form fields to Google Form entry IDs
  for (const [key, value] of formData.entries()) {
    if (entries[key]) {
      formDataToSend.append(entries[key], value);
    }
  }

  await fetch(url, { method: 'POST', mode: 'no-cors', body: formDataToSend });
  return { success: true };
}

function initForm(formId, endpoint, formType = 'contact') {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    // Validation
    let valid = true;
    form.querySelectorAll('[required]').forEach(el => {
      el.style.borderColor = '';
      if (!el.value.trim()) { el.style.borderColor = '#e74c3c'; valid = false; }
    });
    if (!valid) { form.querySelector('[required]')?.focus(); return; }

    const btn = form.querySelector('.form-submit') || form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Opening WhatsApp…'; btn.disabled = true;

    // Collect form data for WhatsApp message
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      if (key !== '_gotcha') data[key] = value;
    }

    try {
      // Build WhatsApp URL with pre-filled message
      const waUrl = buildWhatsAppUrl(formType, data);

      // Open WhatsApp in new tab
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      // Show success message
      form.querySelectorAll('input,select,textarea,button,.form-privacy').forEach(el => el.style.display = 'none');
      const suc = document.getElementById(formId + '-success');
      if (suc) suc.style.display = 'block';
    } catch (_) {
      // Fallback: show WhatsApp link
      const wa = `https://wa.me/${window.SITE_CONTENT?.brand?.whatsapp || '918825083535'}?text=${encodeURIComponent('Hi! I sent an inquiry from your website.')}`;
      btn.innerHTML = `<a href="${wa}" target="_blank" style="color:inherit;text-decoration:none;">📱 Continue on WhatsApp</a>`;
      btn.disabled = false;
    }
  });
}

/* ═══════════════════════════════════════════════════════
   PAGE: HOME
═══════════════════════════════════════════════════════ */
function renderHome(d) {
  renderHero(d);
  renderServices(d);
  renderAbout(d);
  renderItinerary(d);
  renderIncluded(d);
  renderDestinationsHome(d);
  renderToursHome(d);
  renderRentalsHome(d);
  renderStats(d);
  renderTestimonials(d);
  renderBookingCTA(d);
}

/* ═══════════════════════════════════════════════════════
   PAGE: DESTINATIONS
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
          <article class="dest-full-card reveal" style="transition-delay:${.08 * i}s" data-category="${esc(item.category)}">
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
   PAGE: TOURS
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
   PAGE: RENTALS
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
    </div>
    <section style="background:var(--white);padding:var(--section-py) 0;">
      <div class="container">
        <div style="text-align:center;margin-bottom:3rem;">
          <span class="section-eyebrow">Why Choose Us</span>
          <h2 class="section-title">The Abalfazl Rental Advantage</h2>
        </div>
        <div class="rentals-page__why-grid">
          ${[
      { icon: '✅', title: 'Verified Vehicles', desc: 'All vehicles regularly serviced and inspected. GPS tracking available on request.' },
      { icon: '🔑', title: 'Instant Confirmation', desc: 'Book online and receive confirmation within 15 minutes via call or WhatsApp.' },
      { icon: '🛡️', title: 'Full Insurance', desc: 'Comprehensive insurance coverage on all rentals. Travel completely worry-free.' },
      { icon: '📞', title: '24/7 Support', desc: 'Round-the-clock roadside assistance and customer support wherever you go.' }
    ].map(w => `
            <div class="why-card reveal">
              <div class="why-card__icon">${w.icon}</div>
              <h3>${esc(w.title)}</h3>
              <p>${esc(w.desc)}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>`;
}

/* ═══════════════════════════════════════════════════════
   PAGE: BOOKING
═══════════════════════════════════════════════════════ */
function renderBookingPage(d) {
  const sec = document.getElementById('booking-page');
  if (!sec) return;
  const b = d.booking;
  const br = d.brand;
  const params = new URLSearchParams(location.search);

  // Parse URL params
  const type = params.get('type') || (params.get('service') ? 'service' : (params.get('dest') ? 'destination' : ''));
  const itemId = params.get('id') || '';
  const urlDest = params.get('dest') || '';
  const urlService = params.get('service') || '';
  const rawItemName = params.get('name') || '';
  const itemName = rawItemName || (urlDest || urlService ? `${urlDest ? urlDest + ' ' : ''}${urlService || 'Trip'}`.trim() : '');
  const price = params.get('price') || '';
  const duration = params.get('duration') || '';
  const vehicle = params.get('vehicle') || '';
  const group = params.get('group') || '';
  const hasItem = !!itemName;

  // Look up full tour/destination data for itinerary
  let tourData = null, destData = null;
  if (type === 'tour' && itemId) {
    tourData = (d.tours?.items || []).find(t => t.id === itemId) || null;
  }
  if (type === 'destination' && itemId) {
    destData = (d.destinations?.items || []).find(t => t.id === itemId) || null;
  }

  // Build pre-filled messages
  const typeLabels = { tour: 'Tour Package', rental: 'Rental / Cab', destination: 'Destination', service: 'Service' };
  const typeIcons = { tour: '🗺️', rental: '🚗', destination: '📍', service: '✈️' };
  const typeLabel = typeLabels[type] || 'Enquiry';
  const typeIcon = typeIcons[type] || '📋';

  let waMsg = `Hi Abalfazl Travels! I'd like to book:\n*${itemName}*`;
  if (price) waMsg += `\nPrice: ${price}`;
  if (duration) waMsg += `\nDuration: ${duration}`;
  if (group) waMsg += `\nGroup: ${group}`;
  if (vehicle) waMsg += `\nVehicle: ${vehicle}`;
  waMsg += `\n\nPlease share availability and next steps. Thank you! 🙏`;

  let emailSubject = `Booking Enquiry — ${itemName || 'General Enquiry'}`;
  let emailBody = `Hello Abalfazl Travels Team,\n\nI would like to book the following:\n\n`;
  if (itemName) emailBody += `Package : ${itemName}\n`;
  if (price) emailBody += `Price   : ${price}\n`;
  if (duration) emailBody += `Duration: ${duration}\n`;
  if (group) emailBody += `Group   : ${group}\n`;
  if (vehicle) emailBody += `Vehicle : ${vehicle}\n`;
  emailBody += `\nPlease get in touch with availability and payment details.\n\nThank you,\n[Your Name]`;

  const waLink = `https://wa.me/${br.whatsapp}?text=${encodeURIComponent(waMsg)}`;
  const callLink = br.phoneHref;
  const mailLink = `mailto:${br.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  // Selected item card HTML
  const selectedCard = hasItem ? `
    <div class="bk-selected-item reveal">
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

  // Build itinerary HTML for tours
  let itineraryHTML = '';
  if (tourData && tourData.itinerary && tourData.itinerary.length) {
    itineraryHTML = `
      <div class="bk-itinerary reveal">
        <div class="bk-itinerary__header">
          <span class="section-eyebrow">Day-by-Day Plan</span>
          <h3 class="bk-itinerary__title">Your Itinerary</h3>
        </div>
        <div class="bk-itin-timeline">
          ${tourData.itinerary.map((step, i) => `
            <div class="bk-itin-step reveal" style="transition-delay:${.08 * i}s">
              <div class="bk-itin-step__marker">
                <div class="bk-itin-step__dot"></div>
                ${i < tourData.itinerary.length - 1 ? '<div class="bk-itin-step__line"></div>' : ''}
              </div>
              <div class="bk-itin-step__body">
                <div class="bk-itin-step__day">${esc(step.day)}</div>
                <div class="bk-itin-step__place">${esc(step.place)}</div>
                <div class="bk-itin-step__desc">${esc(step.desc)}</div>
              </div>
            </div>`).join('')}
        </div>
        <div class="bk-itin__includes">
          <div class="bk-itin__includes-label">✅ What's Included</div>
          <div class="bk-itin__includes-tags">
            ${(tourData.includes || []).map(x => `<span class="bk-itin__tag">✓ ${esc(x)}</span>`).join('')}
          </div>
        </div>
      </div>`;
  }

  // Build highlights HTML for destinations
  if (destData && !itineraryHTML) {
    const highlights = destData.highlights || [];
    itineraryHTML = `
      <div class="bk-itinerary reveal">
        <div class="bk-itinerary__header">
          <span class="section-eyebrow">Top Experiences</span>
          <h3 class="bk-itinerary__title">Highlights at ${esc(destData.name)}</h3>
        </div>
        <div class="bk-dest-highlights">
          ${highlights.map((h, i) => `
            <div class="bk-dest-highlight reveal" style="transition-delay:${.08 * i}s">
              <div class="bk-dest-highlight__num">${String(i + 1).padStart(2, '0')}</div>
              <div class="bk-dest-highlight__text">${esc(h)}</div>
            </div>`).join('')}
        </div>
        ${destData.duration ? `<p class="bk-dest-meta">🗓 Recommended stay: <strong>${esc(destData.duration)}</strong></p>` : ''}
      </div>`;
  }

  sec.innerHTML = `
    <div class="container bk-container">

      ${selectedCard}

      <div class="bk-heading-wrap reveal">
        <span class="section-eyebrow">${hasItem ? 'Confirm Your Booking' : 'Get In Touch'}</span>
        <h2 class="section-title" style="font-size:clamp(1.6rem,4vw,2.4rem);margin-bottom:.5rem;">
          ${hasItem ? 'Choose How to Book' : 'Book Your Dream Trip'}
        </h2>
        <p style="color:var(--text-mid);font-size:1rem;max-width:500px;margin:0 auto;">
          ${hasItem ? 'Pick the fastest way — we reply instantly.' : 'Choose how you\'d like to get in touch — we reply instantly.'}
        </p>
      </div>

      <div class="bk-contact-btns reveal">
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

      <div class="bk-divider reveal"><span>OR fill the form below</span></div>

      ${itineraryHTML}

      <div class="booking-page__grid">
        <aside class="booking-page__aside reveal">
          <h2 class="booking-page__aside-title">${esc(b.title)}</h2>
          <p class="booking-page__aside-body">${esc(b.subtitle)}</p>
          <div class="booking-contact-cards">
            ${b.contactMethods.map(m => `
              <a href="${esc(m.href)}" class="booking-contact-card">
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
              <li>Our expert calls within 2 hours</li>
              <li>We craft a personalised itinerary</li>
              <li>Review, adjust and confirm</li>
              <li>Your adventure begins! 🎉</li>
            </ol>
          </div>
        </aside>
        <div class="booking-form-card reveal reveal-delay-2">
          <h2>Send Your Inquiry</h2>
          <p class="form-subtitle" style="font-size:.9rem;color:var(--text-light);margin-bottom:2rem;">Mon–Sat · 9AM–8PM IST · Reply within 2 hours</p>
          ${buildFormHTML(b, 'booking-page-form')}
        </div>
      </div>
    </div>`;

  // Pre-fill hidden package field if present
  const pkgInput = document.createElement('input');
  pkgInput.type = 'hidden'; pkgInput.name = 'selected_package'; pkgInput.value = itemName || '';
  document.getElementById('booking-page-form')?.prepend(pkgInput);

  // Pre-select service/destination dropdown from URL
  const pre = params.get('service') || params.get('tour') || params.get('dest') || itemName || '';
  if (pre) {
    ['service', 'destination'].forEach(id => {
      const sel = document.querySelector(`#booking-page-form #${id}`);
      if (sel) Array.from(sel.options).forEach(o => { if (o.value.toLowerCase().includes(pre.toLowerCase().replace(/-/g, ' '))) sel.value = o.value; });
    });
  }
  initForm('booking-page-form', b.formspreeEndpoint, 'booking');
}

/* ═══════════════════════════════════════════════════════
   PAGE: ABOUT
═══════════════════════════════════════════════════════ */
function renderAboutPage(d) {
  const sec = document.getElementById('about-page');
  if (!sec) return;
  const ap = d.aboutPage;
  sec.innerHTML = `
    <div class="container about-page">
      <div class="about-story">
        <div class="reveal">
          <span class="section-eyebrow">Our Story</span>
          <h2 class="section-title">12 Years of Crafting Dreams</h2>
          ${ap.story.paragraphs.map(p => `<p style="font-size:1.0625rem;color:var(--text-mid);line-height:1.8;margin-bottom:1.25rem;">${esc(p)}</p>`).join('')}
        </div>
        <div class="reveal reveal-delay-2">
          <img src="https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=800&h=1000&fit=crop" alt="Abalfazl Travels team" class="about-story__img" loading="lazy" width="800" height="1000">
        </div>
      </div>

      <div style="margin-bottom:5rem;">
        <div style="text-align:center;margin-bottom:2rem;" class="reveal">
          <span class="section-eyebrow">What We Stand For</span>
          <h2 class="section-title">Our Values</h2>
        </div>
        <div class="about-values-grid">
          ${ap.values.map((v, i) => `
            <div class="value-card reveal" style="transition-delay:${.1 * i}s">
              <div class="value-card__icon">${v.icon}</div>
              <h3>${esc(v.title)}</h3>
              <p>${esc(v.description)}</p>
            </div>`).join('')}
        </div>
      </div>

      <div style="margin-bottom:5rem;" id="team">
        <div style="text-align:center;margin-bottom:2rem;" class="reveal">
          <span class="section-eyebrow">Meet the Team</span>
          <h2 class="section-title">The People Behind Your Journey</h2>
        </div>
        <div class="team-grid">
          ${ap.team.map((m, i) => `
            <div class="team-card reveal" style="transition-delay:${.1 * i}s">
              <img src="${esc(m.image)}" alt="${esc(m.imageAlt)}" loading="lazy" width="400" height="400">
              <div class="team-card__body">
                <h3>${esc(m.name)}</h3>
                <div class="team-card__title">${esc(m.title)}</div>
                <p>${esc(m.bio)}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div id="awards" class="reveal">
        <div style="text-align:center;margin-bottom:2rem;">
          <span class="section-eyebrow">Recognition</span>
          <h2 class="section-title">Awards & Accolades</h2>
        </div>
        <div class="awards-grid">
          ${ap.awards.map(a => `
            <div class="award-card reveal">
              <div class="award-year">${esc(a.year)}</div>
              <div class="award-title">${esc(a.title)}</div>
              <div class="award-body">${esc(a.body)}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════
   PAGE: CONTACT
═══════════════════════════════════════════════════════ */
function renderContactPage(d) {
  const sec = document.getElementById('contact-page');
  if (!sec) return;
  const cp = d.contactPage;
  const b = d.booking;
  sec.innerHTML = `
    <div class="container" style="padding-top:3rem;padding-bottom:var(--section-py);">
      <div class="contact-grid">
        <div class="reveal">
          <h2 class="section-title" style="margin-bottom:2rem;">Get in Touch</h2>
          ${[
      { icon: '📞', label: 'Phone', val: `<a href="${esc(d.brand.phoneHref)}">${esc(d.brand.phone)}</a>` },
      { icon: '✉️', label: 'Email', val: `<a href="mailto:${esc(d.brand.email)}">${esc(d.brand.email)}</a>` },
      { icon: '💬', label: 'WhatsApp', val: `<a href="https://wa.me/${esc(d.brand.whatsapp)}">Chat with us on WhatsApp</a>` },
      { icon: '📍', label: 'Address', val: esc(d.brand.address) },
      { icon: '⏰', label: 'Hours', val: 'Monday – Saturday: 9:00 AM – 8:00 PM IST' }
    ].map(item => `
            <div class="contact-info__item">
              <div class="contact-info__icon">${item.icon}</div>
              <div>
                <div class="contact-info__label">${esc(item.label)}</div>
                <div class="contact-info__value">${item.val}</div>
              </div>
            </div>`).join('')}
        </div>
        <div class="contact-form-card reveal reveal-delay-2">
          <h2 style="font-family:var(--font-serif);font-size:1.75rem;margin-bottom:.4rem;">Send a Message</h2>
          <p style="font-size:.9rem;color:var(--text-light);margin-bottom:2rem;">We typically respond within 2 hours.</p>
          ${buildFormHTML(b, 'contact-form')}
        </div>
      </div>

      <div class="faq-section reveal" id="faq" style="margin-top:5rem;">
        <div style="text-align:center;margin-bottom:2rem;">
          <span class="section-eyebrow">Common Questions</span>
          <h2 class="section-title">Frequently Asked Questions</h2>
        </div>
        ${cp.faq.map((q, i) => `
          <div class="faq-item reveal" style="transition-delay:${.08 * i}s">
            <div class="faq-q" tabindex="0" role="button" aria-expanded="false">
              ${esc(q.question)}<span class="faq-icon" aria-hidden="true">+</span>
            </div>
            <div class="faq-a">${esc(q.answer)}</div>
          </div>`).join('')}
      </div>
    </div>`;

  // FAQ accordion
  sec.querySelectorAll('.faq-q').forEach(q => {
    const toggle = () => {
      const item = q.closest('.faq-item');
      const open = !item.classList.contains('open');
      sec.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (open) item.classList.add('open');
      q.setAttribute('aria-expanded', open);
    };
    q.addEventListener('click', toggle);
    q.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
  initForm('contact-form', b.formspreeEndpoint, 'contact');
}

/* ═══════════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════════ */
function initScrollReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ═══════════════════════════════════════════════════════
   COUNT-UP
═══════════════════════════════════════════════════════ */
function initCountUp() {
  const nums = document.querySelectorAll('.stat__number[data-target]');
  if (!nums.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = parseFloat(el.dataset.target), display = el.dataset.display, dur = 1600, start = performance.now();
      const step = now => {
        const p = Math.min((now - start) / dur, 1), ease = 1 - Math.pow(1 - p, 3), val = target * ease;
        if (display.includes(',')) el.textContent = Math.floor(val).toLocaleString() + (display.includes('+') ? '+' : '');
        else if (display.includes('/')) el.textContent = val.toFixed(1) + '/5';
        else el.textContent = Math.floor(val) + (display.includes('+') ? '+' : '');
        if (p < 1) requestAnimationFrame(step); else el.textContent = display;
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: .5 });
  nums.forEach(n => io.observe(n));
}

/* ═══════════════════════════════════════════════════════
   SCROLL-TO-TOP
═══════════════════════════════════════════════════════ */
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ═══════════════════════════════════════════════════════
   WHATSAPP FLOAT
═══════════════════════════════════════════════════════ */
function initWhatsApp(d) {
  const wa = document.getElementById('whatsapp-float');
  if (!wa) return;
  const num = d.brand.whatsapp;
  const msg = encodeURIComponent(d.booking.whatsappMessage || 'Hi!');
  wa.href = `https://wa.me/${num}?text=${msg}`;
}

/* ═══════════════════════════════════════════════════════
   LOADER HIDE
═══════════════════════════════════════════════════════ */
function hideLoader() {
  const loader = document.getElementById('site-loader');
  if (!loader) return;
  loader.classList.add('hidden');
  setTimeout(() => loader.remove(), 700);
}

/* ═══════════════════════════════════════════════════════
   BOOTSTRAP — runs on DOMContentLoaded
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Data is already loaded synchronously from data/data.js
    const content = window.SITE_CONTENT;
    const seo = window.SITE_SEO;
    const page = document.body.dataset.page || 'home';

    if (!content) {
      document.body.innerHTML = `<div style="display:flex;min-height:100vh;align-items:center;justify-content:center;font-family:system-ui;text-align:center;padding:2rem;">
      <div><h1>⚠️ Data file not found</h1><p style="color:#666;margin-top:1rem;">Make sure <code>data/data.js</code> exists in the project folder.</p></div>
    </div>`;
      hideLoader();
      return;
    }

    // SEO
    if (seo) injectSEO(seo, page);

    // Global renders
    renderNav(content);
    renderFooter(content);
    renderNewsletter(content);
    renderStats(content);

    // Page-specific
    switch (page) {
      case 'home': renderHome(content); break;
      case 'destinations': renderDestinationsPage(content); break;
      case 'tours': renderToursPage(content); break;
      case 'rentals': renderRentalsPage(content); break;
      case 'booking': renderBookingPage(content); break;
      case 'about': renderAboutPage(content); break;
      case 'contact': renderContactPage(content); break;
      case 'reviews': renderReviewsPage(); break;
    }

    // Interactive
    initScrollReveal();
    initCountUp();
    initScrollTop();
    initWhatsApp(content);
  } catch (e) {
    console.error('Site init error:', e);
  } finally {
    hideLoader();
  }
});
