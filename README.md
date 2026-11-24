# WanderLuxe Tours — Static Travel Website

A production-grade, fully responsive static travel website for **WanderLuxe Tours**. All visible content and SEO metadata are loaded from JSON files, allowing non-technical clients to update the site without touching HTML, CSS, or JavaScript.

---

## 🚀 Quick Start

This site uses `fetch()` to load JSON data at runtime. **You need a local web server** to run it properly.

### Option 1: npx serve (recommended — no install needed)
```bash
cd "c:\Users\kali3\OneDrive\Desktop\tanweb"
npx serve .
```
Then open **http://localhost:3000** in your browser.

### Option 2: VS Code Live Server
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**

### Option 3: Python
```bash
# Python 3
python -m http.server 8080
# Then open http://localhost:8080
```

### Option 4: File:// fallback (limited)
Open `index.html` directly in a browser. The site will use the **inline JSON fallback** embedded in each HTML file's `<script type="application/json">` tags. All features work, but fetch() is bypassed.

> **Note:** When opened as `file://`, some browsers block fetch() for security reasons. Use a local server for the best experience.

---

## 📁 File Structure

```
tanweb/
├── index.html              ← Home page
├── destinations.html       ← Destinations listing
├── tours.html              ← Tour packages
├── about.html              ← About us
├── contact.html            ← Contact form + FAQ
├── sitemap.xml             ← SEO sitemap
├── robots.txt              ← Search engine directives
├── README.md               ← This file
│
├── data/
│   ├── content.json        ← ALL visible text, images, links ✏️ EDIT HERE
│   └── seo.json            ← ALL SEO meta tags, structured data ✏️ EDIT HERE
│
├── css/
│   └── styles.css          ← Complete stylesheet (BEM, CSS custom properties)
│
├── js/
│   └── app.js              ← Vanilla JS — renders all content from JSON
│
└── assets/
    └── (Unsplash URLs used for all images — no local images needed)
```

---

## ✏️ How to Edit Content

**Everything a client needs to change lives in two files:**

### `data/content.json`
- Site navigation labels and links
- Hero headline, subheadline, and CTA buttons
- Booking form fields and options
- Activity cards (icons, titles, descriptions)
- Accommodation cards
- Destination cards (images, prices, ratings)
- Featured tour packages (images, itineraries, prices)
- Weekly schedule
- Stats counter numbers
- Testimonials (name, photo, text, rating)
- Newsletter section text
- Footer content (about text, link columns, social links, contact info)
- All inner page content (destinations page, tours page, about page, contact page)

### `data/seo.json`
- Page titles (keep under 60 characters)
- Meta descriptions (150–160 characters)
- Keywords
- Canonical URLs
- Open Graph tags (for social sharing)
- Twitter Card tags
- JSON-LD structured data schemas

> ⚠️ **Important:** After editing JSON files, also update the matching `<script type="application/json" id="inline-content">` and `<script type="application/json" id="inline-seo">` blocks inside each HTML file. These are the fallback data sources used when the site is opened without a server.

---

## 🎨 Customizing the Design

All design tokens are CSS custom properties in `css/styles.css` at the top of the file:

```css
:root {
  --color-forest:  #1a3a2a;  /* Dark forest green — primary brand */
  --color-gold:    #d4a017;  /* Warm gold/amber — accent */
  --color-cream:   #f9f5ed;  /* Cream/off-white — backgrounds */
  --color-brown:   #8b6914;  /* Earthy brown */
  --font-heading:  'Playfair Display', serif;
  --font-body:     'Inter', sans-serif;
  /* ... and many more */
}
```

Change these values to instantly retheme the entire site.

---

## ⚙️ JavaScript Architecture

`js/app.js` is structured as a series of pure render functions:

| Function | What it does |
|---|---|
| `loadJSON(url, fallbackId)` | Fetches JSON or reads inline fallback |
| `injectSEO(page, seoData)` | Writes all meta tags + JSON-LD to `<head>` |
| `renderNav(data)` | Builds sticky navigation with mobile menu |
| `renderHero(data)` | Full-screen hero with animations |
| `renderBooking(data)` | Search bar with dynamic form fields |
| `renderActivities(data)` | Icon activity strip |
| `renderAccommodations(data)` | Accommodation card grid |
| `renderDestinations(data)` | Destination cards with star ratings |
| `renderTours(data)` | Featured tour package cards |
| `renderWeekly(data)` | Weekly schedule day cards |
| `renderStats(data)` | Stats with count-up animation |
| `renderTestimonials(data)` | Auto-playing testimonial slider |
| `renderNewsletter(data)` | Email capture section |
| `renderFooter(data)` | Multi-column footer |
| `renderDestinationsPage(data)` | Full destinations listing page |
| `renderToursPage(data)` | Full tours listing page |
| `renderAboutPage(data)` | About page with team + awards |
| `renderContactPage(data)` | Contact form + FAQ accordion |
| `initStickyNav()` | Scroll shadow + mobile hamburger |
| `initScrollAnimations()` | IntersectionObserver fade-ins |
| `initCountUp()` | Animated number counters |
| `initTestimonialsSlider()` | Slider with touch, keyboard, autoplay |
| `initFAQ()` | Accordion FAQ items |

---

## ♿ Accessibility

- Semantic HTML5 landmark elements (`header`, `main`, `nav`, `footer`, `section`, `article`)
- Skip-to-content link
- ARIA labels on all interactive elements
- Keyboard navigation for slider (← →), FAQ, and mobile menu (Escape to close)
- Touch/swipe support on testimonial slider
- Alt text on all images (from JSON)
- `aria-current="page"` on active nav link
- Focus styles preserved (`focus-visible`)
- Respects `prefers-reduced-motion`

---

## 📈 SEO Features

- Per-page title tags (< 60 chars)
- Meta descriptions (150–160 chars)
- Canonical URLs
- Open Graph tags (Facebook, LinkedIn)
- Twitter Card tags
- JSON-LD structured data:
  - `TravelAgency` schema on home page
  - `BreadcrumbList` on inner pages
- `robots` meta tag
- `lang="en"` on `<html>`
- `sitemap.xml` and `robots.txt` included
- Lazy loading on all images
- Google Fonts via preconnect for performance

---

## 🌐 Deployment

To deploy to a live domain:
1. Upload all files to your web host (or Netlify, Vercel, GitHub Pages)
2. Update `canonical` URLs in `data/seo.json` to your actual domain
3. Update the `Sitemap:` URL in `robots.txt`
4. Submit `sitemap.xml` to Google Search Console

---

## 🛠️ Tech Stack

- **HTML5** — Semantic, valid markup
- **CSS3** — Custom properties, Flexbox, Grid, animations
- **Vanilla JavaScript** — ES2020+, no frameworks, no jQuery
- **Google Fonts** — Playfair Display + Inter
- **Unsplash** — High-quality travel photography (no attribution required for hotlinking)

---

*Built for WanderLuxe Tours — crafting extraordinary journeys since 2012.*

