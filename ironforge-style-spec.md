# IronForge — Visual Style, Motion & Micro-Interaction Spec

A portable, copy-pasteable recipe set that reproduces the exact look and feel of the
IronForge gym site in any project. Every value below is extracted verbatim from the
source — Tailwind-style shorthands have been resolved to real values where relevant.

> **How to use:** The doc is split into **Layer A (brand tokens)**, **Layer B
> (typography)**, and **Layer C (motion & effects + per-element recipes)**. Layers are
> independent — paste only the ones you want. Layer C recipes assume Layer A's CSS
> variables and Layer B's font setup are present.

---

## 1. Stack summary

| Concern | How it's implemented |
| --- | --- |
| **Markup** | Hand-written static HTML (`index.html`, `login.html`, `register.html`). No framework, no JSX, no build step. |
| **Styling** | **Plain CSS**, two stylesheets: `frontend/style.css` (main site, 1329 lines) and `frontend/auth.css` (login/register). **No Tailwind, no CSS modules, no styled-components.** Source of truth = a `:root` block of CSS custom properties duplicated identically at the top of both files. |
| **Motion** | **Pure CSS** transitions + `@keyframes` for resting/hover/entrance animation, driven by vanilla JS for scroll-triggered reveals & counters. **No framer-motion / GSAP / AOS / react-spring.** |
| **JS** | Vanilla ES (no bundler). `frontend/script.js` (IntersectionObserver reveals, stat counters, sticky header, program filter, testimonial slider, toast). `frontend/register.js` + `frontend/login.js` (auth, password-strength meter, password eye-toggle). |
| **Fonts** | Google Fonts via `<link>`: **Oswald** (display/headings) + **Roboto** (body). |
| **Icons** | Font Awesome 6.4.0 via CDN `<link>`. |

**Files read for this spec:** `frontend/style.css`, `frontend/auth.css`, `frontend/script.js`,
`frontend/register.js`, `frontend/index.html`, `frontend/login.html`, `frontend/register.html`.

---

## 2. Dependencies to reproduce elsewhere

```html
<!-- Fonts: Oswald (headings) + Roboto (body) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Roboto:wght@300;400;500;700&display=swap"
  rel="stylesheet">

<!-- Icons: Font Awesome 6.4.0 (arrows, check/times, dumbbell, social glyphs, eye toggle) -->
<link rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

- **Oswald** weights used: `400, 500, 700`.
- **Roboto** weights used: `300, 400, 500, 700`.
- No JS package dependencies — all motion is hand-rolled CSS + vanilla JS (`IntersectionObserver`, `setInterval`, `requestAnimationFrame`).
- next/font equivalent: `Oswald({ weight: ['400','500','700'] })`, `Roboto({ weight: ['300','400','500','700'] })`.

---

# LAYER A — Brand tokens

## A.1 Ready-to-paste CSS `:root` block

This is the verbatim token set (from the top of both `style.css` and `auth.css`), plus
a handful of one-off colors that are used across the source but were never tokenized —
added here with semantic names so the palette is complete. **Provenance is noted per color:**
most status colors are CSS literals; the two password-meter ambers (`#f59e0b`, `#ffd166`)
exist **only in `register.js`**, not in any stylesheet.

```css
:root {
  /* ── Brand red (accent) ───────────────────────── */
  --primary:        #ff3b3b;   /* signature red — buttons, accents, icons, active states */
  --primary-dark:   #cc2e2e;   /* gradient end-stop for red fills */
  --primary-glow:   rgba(255, 59, 59, 0.3);  /* red drop-shadow / glow */

  /* ── Dark ramp (page → elevated) ──────────────── */
  --footer-bg:      #060606;   /* deepest black — footer only (literal in source) */
  --dark-bg:        #0a0a0a;   /* page background + contact input fields */
  --card-bg:        #111111;   /* card / panel surface + auth input fields */
  --secondary:      #1a1a1a;   /* elevated chips: table header, footer social, newsletter input */

  /* ── Borders ──────────────────────────────────── */
  --card-border:    #1e1e1e;   /* every hairline border + dividers */

  /* ── Text ramp ────────────────────────────────── */
  --light-text:     #f4f4f4;   /* primary text */
  --gray-text:      #9a9a9a;   /* secondary / muted body text */
  --muted:          #555;      /* placeholders, disabled rows, copyright (source uses 3-digit #555) */
  /* pure white #fff is used for emphasis headings & button labels */

  /* ── Status colors ────────────────────────────── */
  --success:        #06d6a0;   /* check green — CSS: toast success, form success; JS: password "strong/excellent" */
  --error:          #ef476f;   /* error pink  — CSS: toast error, validation, form error; JS: password "weak" */
  --star:           #f5a623;   /* CSS literal — testimonial star rating gold */
  --warn:           #f59e0b;   /* JS-ONLY (register.js) — password "good" amber */
  --warn-soft:      #ffd166;   /* JS-ONLY (register.js) — password "fair" yellow */

  /* ── Overlays ─────────────────────────────────── */
  --overlay:        rgba(0, 0, 0, 0.7);

  /* ── Motion ───────────────────────────────────── */
  --transition:     all 0.3s cubic-bezier(0.4, 0, 0.2, 1);  /* 300ms, Material standard easing */

  /* ── Type ─────────────────────────────────────── */
  --font-heading:   'Oswald', sans-serif;
  --font-body:      'Roboto', sans-serif;

  /* ── Layout ───────────────────────────────────── */
  --container-width: 1200px;
  --header-height:   80px;

  /* ── Radius scale ─────────────────────────────── */
  --radius-sm:      8px;    /* buttons, inputs */
  --radius:         12px;   /* cards, panels, icon tiles */
  /* pill = 20px / 30px (badges, filter chips) ; circle = 50% (avatars, dots, icon buttons) */
}
```

## A.2 Radius scale

| Token / value | Used on |
| --- | --- |
| `2px` | underline bars, progress bars, hamburger bars |
| `--radius-sm` = **8px** | `.btn`, all inputs, newsletter button |
| `--radius` = **12px** | cards (program / trainer / pricing), icon tiles, contact panel, toast, about image |
| `20px` | `.section-tag` eyebrow, `.program-tag`, icon-tile alt |
| `30px` | `.hero-badge`, `.filter-btn` pills |
| `50%` | social icons, slider dots, prev/next buttons, toast icon |

## A.3 Box-shadow scale

| Purpose | Value |
| --- | --- |
| Red button hover / glow | `0 8px 30px rgba(255,59,59,0.3)` |
| Floating "11 / Years" badge glow | `0 10px 40px rgba(255,59,59,0.3)` |
| Card hover lift (program/trainer/pricing) | `0 20px 50px rgba(0,0,0,0.3)` |
| Sticky header (scrolled) | `0 4px 30px rgba(0,0,0,0.5)` |
| Toast | `0 20px 60px rgba(0,0,0,0.5)` |
| Input focus ring | `0 0 0 3px rgba(255,59,59,0.1)` |

## A.4 Spacing & rhythm

| Token | Value |
| --- | --- |
| Container | `width: 90%; max-width: 1200px; margin: 0 auto` |
| Section vertical padding | `100px 0` (desktop) → `60px 0` (≤576px) |
| Section header bottom margin | `60px` |
| Card padding | program `36px 28px` · pricing `40px 30px` · contact panel `40px` |
| Grid gaps | `12px` (gallery) · `24px` (programs) · `30px` (trainers/pricing/stats) · `40px` (footer) · `60px` (about/contact) |
| Header padding | `20px 0` → `10px 0` when scrolled |

## A.5 Dark layering ramp (darkest → lightest)

```
#060606  footer            ← deepest
#0a0a0a  page bg / contact inputs
#0e0e0e  testimonials gradient start
#111111  cards / auth inputs
#161616  testimonials gradient end
#1a1a1a  elevated chips (table header, footer social, newsletter input)
#1e1e1e  borders / dividers
```

## A.6 Optional Tailwind `theme.extend` (only if porting to Tailwind)

This project is **not** Tailwind. If you re-implement it in Tailwind, this maps the tokens:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary:      { DEFAULT: '#ff3b3b', dark: '#cc2e2e' },
        ink:          { 900: '#060606', 850: '#0a0a0a', 800: '#111111', 700: '#1a1a1a', border: '#1e1e1e' },
        text:         { DEFAULT: '#f4f4f4', muted: '#9a9a9a', faint: '#555' },
        success: '#06d6a0', error: '#ef476f', warn: '#f59e0b', star: '#f5a623',
      },
      fontFamily: { heading: ['Oswald', 'sans-serif'], body: ['Roboto', 'sans-serif'] },
      borderRadius: { sm: '8px', DEFAULT: '12px', pill: '30px' },
      boxShadow: {
        glow:    '0 8px 30px rgba(255,59,59,0.3)',
        'glow-lg':'0 10px 40px rgba(255,59,59,0.3)',
        lift:    '0 20px 50px rgba(0,0,0,0.3)',
        header:  '0 4px 30px rgba(0,0,0,0.5)',
        ring:    '0 0 0 3px rgba(255,59,59,0.1)',
      },
      transitionTimingFunction: { brand: 'cubic-bezier(0.4,0,0.2,1)' },
      keyframes: {
        fadeInUp:   { from: { opacity: 0, transform: 'translateY(30px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scrollPulse:{ '0%,100%': { opacity: .3, transform: 'scaleY(.5)' }, '50%': { opacity: 1, transform: 'scaleY(1)' } },
      },
      animation: {
        fadeInUp:    'fadeInUp 1s ease',
        scrollPulse: 'scrollPulse 2s ease-in-out infinite',
      },
    },
  },
};
```

---

# LAYER B — Typography

## B.1 Families & global rules

```css
body {
  font-family: var(--font-body);     /* Roboto */
  color: var(--light-text);
  background-color: var(--dark-bg);
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

/* All headings: Oswald + a touch of tracking */
h1, h2, h3, h4 {
  font-family: var(--font-heading);  /* Oswald */
  letter-spacing: 1px;
}
```

- **Display font:** Oswald (a condensed grotesque) — weights 400 / 500 / **700**. Used for every heading, the logo, stat numbers, prices, and button labels.
- **Body font:** Roboto — weights 300 / 400 / 500 / 700. Default body `line-height: 1.7`.

## B.2 Type scale (sizes + line-heights)

| Role | Family / weight | Size | Line-height | Tracking |
| --- | --- | --- | --- | --- |
| **h1 — hero title** | Oswald 700 | `clamp(3rem, 7vw, 5.5rem)` (→ `2.5rem` ≤576px) | `1.05` | `1px` |
| **h2 — section title** | Oswald 700* | `clamp(2rem, 4vw, 3rem)` | inherits body `1.7` | `1px` |
| **h3 — card / sub-head** | Oswald | `1.3rem`–`1.6rem` | inherit | `1px` |
| **Body** | Roboto 400 | `1rem` | `1.7` | — |
| **Hero subtitle** | Roboto 400 | `1.15rem` | `1.8` | — |
| **Section desc** | Roboto 400 | `1.05rem` | `1.7` | — |
| **Eyebrow** | Roboto 600 | `0.75rem` | — | `3px` |
| **Button label** | Oswald 600 | `0.95rem` | — | `1.5px` |
| **Stat number** | Oswald 700 | `3.5rem` | `1` | — |
| **Price** | Oswald 700 | `3.5rem` | `1` | — |

\* `.section-title` inherits Oswald from the global `h2` rule; only weight 700 is loaded for Oswald bold.

## B.3 The bold-condensed UPPERCASE heading + two-tone pattern

Headings are written **UPPERCASE in the markup** (not via `text-transform`). The two-tone
effect = white base text + one word wrapped in `.text-accent` (red). Pattern seen on
`WHO WE ARE`, `OUR PROGRAMS`, `MEMBERSHIP PLANS`, `EXPERT TRAINERS`, etc.

```html
<h2 class="section-title">OUR <span class="text-accent">PROGRAMS</span></h2>
```
```css
.section-title {
  font-family: var(--font-heading);          /* Oswald (inherited from h2) */
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: 1px;
  position: relative;
  display: inline-block;
  margin-bottom: 12px;
}
.text-accent { color: var(--primary); }       /* the red word */
```

**Outlined hero word** (the hollow "STRONGEST"): white text with a red outline and
transparent fill —
```css
.text-stroke {
  -webkit-text-stroke: 2px var(--primary);
  color: transparent;
}
```
```html
<h1 class="hero-title">BUILD YOUR <span class="text-stroke">STRONGEST</span> BODY</h1>
```

## B.4 The eyebrow label (two variants)

**Filled chip** (`.section-tag` — "OUR STORY", "WHAT WE OFFER", "PRICING", "MEET THE TEAM", "REACH OUT"):
```css
.section-tag {
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--primary);
  background: rgba(255, 59, 59, 0.08);   /* faint red wash */
  padding: 4px 14px;
  border-radius: 20px;
  margin-bottom: 12px;
}
```

**Outlined pill** (`.hero-badge` — "EST. 2015 — GJAKOVË, KOSOVË"):
```css
.hero-badge {
  display: inline-block;
  font-family: var(--font-body);         /* Roboto */
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 3px;
  color: var(--primary);
  margin-bottom: 20px;
  padding: 6px 16px;
  border: 1px solid rgba(255, 59, 59, 0.3);
  border-radius: 30px;
  animation: fadeInUp 1s ease;           /* entrance — see Layer C */
}
```

---

# LAYER C — Motion & effects

## C.0 Global transition timing

> **One easing rules the whole site.** Almost every hover/focus/state change uses the
> `--transition` token: **`all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`** — i.e. **300ms** with
> Material's "standard" easing (fast-out, slow-in). Exceptions: trainer image zoom (`0.5s ease`),
> testimonial slides & strength bar (`0.4s–0.5s ease`), scroll-reveal (`0.6s ease-out`),
> toast slide (`0.4s` same cubic-bezier).

```css
*  { /* applied per-element, not globally */ }
a, .btn, .program-card, .trainer-card, .pricing-card, .feature-item,
input, textarea, .filter-btn, .social-links a /* …etc */ {
  transition: var(--transition);
}
```

## C.1 Keyframes / animations block (paste once)

```css
/* Entrance: fade + rise. Used by hero elements (staggered) and on filter re-show. */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Hero scroll-cue: vertical line breathing up/down. */
@keyframes scrollPulse {
  0%, 100% { opacity: 0.3; transform: scaleY(0.5); }
  50%      { opacity: 1;   transform: scaleY(1);   }
}

/* Spinner (button loaders also use Font Awesome's fa-spin). */
@keyframes spin { to { transform: rotate(360deg); } }
```

**Where each fires:**

| Animation | Trigger | Definition |
| --- | --- | --- |
| `fadeInUp` (hero) | On load, **staggered** | badge `1s ease`; title `1s ease 0.2s both`; subtitle `…0.4s both`; buttons `…0.6s both` |
| `fadeInUp` (filter) | JS sets `card.style.animation = 'fadeInUp 0.4s ease forwards'` when a program card re-appears after filtering | — |
| `scrollPulse` | Always-on, hero scroll line | `scrollPulse 2s ease-in-out infinite` |
| `.reveal → .visible` | IntersectionObserver (JS) | see C.2 |

## C.2 Scroll-reveal (JS-driven) + CSS-only fallback

**Resting → revealed** styles (pure CSS):
```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

**JS that adds `.reveal` then toggles `.visible`** (`script.js`):
```js
const revealElements = document.querySelectorAll(
  '.section-header, .program-card, .trainer-card, .pricing-card, .feature-item, ' +
  '.info-item, .about-content, .about-image, .contact-form-wrapper, ' +
  '.comparison-wrapper, .gallery-item'
);
revealElements.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), index * 80); // 80ms stagger
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(el => revealObserver.observe(el));
```
- **Stagger:** `index * 80ms` between siblings in the same observer batch.
- **Trigger point:** 10% of the element visible, fired 50px before the true bottom edge.
- **CSS-only fallback:** drop the JS and apply `animation: fadeInUp .6s ease-out both` to the same elements (loses scroll-gating & stagger, but matches the motion).

## C.3 Stat counter (JS-driven)

Numbers count up from 0 when the stats bar scrolls into view. No CSS equivalent.
```js
function animateCounter(el, target) {
  let current = 0;
  const increment = target / 60;          // ~60 steps
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current);
  }, 25);                                  // 25ms tick → ~1.5s total
}
// Fires once when: statsBar.getBoundingClientRect().top < window.innerHeight * 0.8
```
Markup carries the target: `<div class="stat-number" data-target="500">0</div>`.

## C.4 Sticky/condensing header (JS toggles a class)

```js
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 50);
});
```
```css
header {                                  /* resting: transparent, roomy */
  position: fixed; inset: 0 0 auto 0; z-index: 1000;
  padding: 20px 0; background: transparent;
  transition: var(--transition);
}
header.scrolled {                         /* condensed glass bar */
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 10px 0;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}
```

---

# Recipes — signature elements (resting + hover)

Each recipe is self-contained given Layer A tokens. Snippets are grouped so you can lift
only what you need.

## R1. Primary red button — "JOIN NOW →" / "GET STARTED" / "SEND MESSAGE"

> Gradient-red fill, condensed uppercase label, lifts + red glow on hover. The "→" is a
> Font Awesome `<i class="fas fa-arrow-right">` separated by the flex `gap`, not animated.

```css
.btn {                                    /* shared button base */
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 32px;
  font-family: var(--font-heading);       /* Oswald */
  font-size: 0.95rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1.5px;
  border-radius: var(--radius-sm);        /* 8px */
  border: 2px solid transparent;
  cursor: pointer; position: relative; overflow: hidden;
  transition: var(--transition);
}
.btn-primary {                            /* resting */
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff;
  border-color: var(--primary);
}
.btn-primary:hover {                      /* lift + red glow */
  box-shadow: 0 8px 30px var(--primary-glow);
  transform: translateY(-2px);
}
/* size modifiers */
.btn-sm    { padding: 8px 20px;  font-size: 0.85rem; }
.btn-lg    { padding: 16px 40px; font-size: 1rem; }
.btn-block { width: 100%; justify-content: center; }
```
```html
<a href="#membership" class="btn btn-primary btn-lg">Join Now <i class="fas fa-arrow-right"></i></a>
```

## R2. Secondary outline button — "LOGIN" / "EXPLORE"

> Transparent with a faint white border; fills slightly and brightens its border on hover.

```css
.btn-outline {                            /* resting */
  background: transparent;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}
.btn-outline:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: #fff;
}
```
```html
<a href="#about" class="btn btn-outline btn-lg">Explore <i class="fas fa-chevron-down"></i></a>
```

## R3. Nav links — center-growing red underline

> Resting grey, brighten to white on hover while a 2px red underline grows from center to 60% width.

```css
.nav-links li a {                         /* resting */
  position: relative;
  padding: 10px 16px;
  font-family: var(--font-body);
  font-size: 0.9rem; font-weight: 500; letter-spacing: 0.5px;
  color: var(--gray-text);
}
.nav-links li a::after {                  /* the underline, collapsed */
  content: ''; position: absolute; bottom: 0; left: 50%;
  width: 0; height: 2px;
  transform: translateX(-50%);
  background: var(--primary); border-radius: 2px;
  transition: var(--transition);
}
.nav-links li a:hover { color: #fff; }
.nav-links li a:hover::after { width: 60%; }
```

## R4. Eyebrow pill badges

See **B.4** for both the filled `.section-tag` and outlined `.hero-badge` variants. They
are static (no hover) — `.hero-badge` additionally plays `fadeInUp 1s ease` on load.

## R5. Red underline bar under section headings

> A 50px red bar centered beneath two-tone section titles (left-aligned in the contact column).

```css
.section-title::after {
  content: ''; display: block;
  width: 50px; height: 3px;
  background: var(--primary);
  border-radius: 2px;
  margin: 12px auto 0;                     /* centered */
}
.contact-info .section-title::after { margin-left: 0; }  /* left-aligned variant */
```

## R6. Stat blocks — big red number + uppercase label

> Oswald 700 red numeral (`500+`, `11+`, `8`, `4`) with a smaller red "+" suffix and a
> spaced grey caption. Vertical hairline divider between items. Counts up on scroll (C.3).

```css
.stat-number {
  font-family: var(--font-heading);
  font-size: 3.5rem; font-weight: 700; line-height: 1;
  color: var(--primary); display: inline;
}
.stat-suffix {                            /* the "+" */
  font-family: var(--font-heading);
  font-size: 2rem; color: var(--primary);
  display: inline; vertical-align: top;
}
.stat-label {
  margin-top: 10px;
  font-size: 0.9rem; color: var(--gray-text);
  text-transform: uppercase; letter-spacing: 2px;
}
.stat-item::after {                        /* divider, hidden on last */
  content: ''; position: absolute; right: 0; top: 20%;
  width: 1px; height: 60%; background: var(--card-border);
}
.stat-item:last-child::after { display: none; }
```

## R7. Icon tiles — red-tinted rounded square + red glyph

> Used for mission features (`.feature-icon`) and contact info (`.info-icon`). 48×48 rounded
> square, 10%-red wash, red Font Awesome glyph. (Program-card icons are bare red glyphs, no tile.)

```css
.feature-icon, .info-icon {
  width: 48px; height: 48px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 59, 59, 0.1);
  border-radius: 12px;
  color: var(--primary);
  font-size: 1.2rem;                       /* .info-icon: 1.1rem */
}

/* Program-card glyph: no tile, just a large red icon */
.program-icon { font-size: 2.5rem; color: var(--primary); margin-bottom: 20px; }
```

`.feature-item` (the row wrapping the tile) has its own hover — slides right + red border:
```css
.feature-item {
  display: flex; align-items: center; gap: 16px; padding: 16px;
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: var(--radius-sm); transition: var(--transition);
}
.feature-item:hover {
  border-color: rgba(255, 59, 59, 0.3);
  transform: translateX(5px);
}
```

## R8. Program cards + filter pills

> Resting: flat `#111` card with hairline border and a hidden red top-glow bar. Hover:
> lifts 8px, border tints red, shadow drops, and the top glow bar fades in.

```css
.program-card {                           /* resting */
  position: relative; overflow: hidden; text-align: center;
  padding: 36px 28px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);           /* 12px */
  transition: var(--transition);
}
.program-card-glow {                      /* top accent bar, hidden at rest */
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 80%; height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  opacity: 0; transition: var(--transition);
}
.program-card:hover {
  transform: translateY(-8px);
  border-color: rgba(255, 59, 59, 0.2);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}
.program-card:hover .program-card-glow { opacity: 1; }

/* Bottom category pill (STRENGTH / CARDIO / …) */
.program-tag {
  display: inline-block; margin-top: 16px;
  font-size: 0.7rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1.5px;
  color: var(--primary);
  padding: 4px 12px;
  border: 1px solid rgba(255, 59, 59, 0.3);
  border-radius: 20px;
}

/* Filter-pill row + active "All" state */
.filter-btn {                             /* resting */
  padding: 8px 24px;
  background: transparent;
  border: 1px solid var(--card-border);
  color: var(--gray-text);
  font-family: var(--font-body); font-size: 0.85rem; font-weight: 500;
  border-radius: 30px; cursor: pointer;
  transition: var(--transition);
}
.filter-btn:hover,
.filter-btn.active {                      /* hover === active: solid red */
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
```
JS filtering toggles `.hidden` (`display:none`) and replays `fadeInUp 0.4s ease forwards` on re-shown cards.

## R9. Trainer cards — image + dark caption + hover zoom & socials

> Card lifts on hover; the background image scales to 1.05 (slow 0.5s); a dark
> bottom-up gradient overlay fades in revealing round social buttons.

```css
.trainer-card {                           /* resting */
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: var(--transition);
}
.trainer-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.trainer-img-wrapper { position: relative; height: 350px; overflow: hidden; }
.trainer-placeholder {                    /* the bg-image div */
  width: 100%; height: 100%;
  transition: transform 0.5s ease;        /* slower, dedicated easing */
}
.trainer-card:hover .trainer-placeholder { transform: scale(1.05); }

.trainer-overlay {                        /* dark caption panel, hidden at rest */
  position: absolute; inset: 0;
  background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 60%);
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: 20px;
  opacity: 0; transition: var(--transition);
}
.trainer-card:hover .trainer-overlay { opacity: 1; }

.trainer-socials a {                      /* frosted round buttons */
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: #fff; transition: var(--transition);
}
.trainer-socials a:hover { background: var(--primary); transform: translateY(-3px); }

/* Caption text under the image */
.trainer-info       { padding: 24px; text-align: center; }
.trainer-info span  { color: var(--primary); font-weight: 500; font-size: 0.9rem; display: block; }
```

## R10. Pricing cards — highlighted PRO card, ribbon, feature rows

> **⚠️ Accurate implementation note:** the highlighted PRO card uses **red border + a faint
> red-tinted gradient background + white heading** — there is **no `scale` and no persistent
> box-shadow glow** at rest (the only lift/shadow is the shared hover). The diagonal "MOST
> POPULAR" ribbon is a rotated absolutely-positioned strip.

```css
.pricing-card {                           /* resting (all cards) */
  position: relative; overflow: hidden; text-align: center;
  padding: 40px 30px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  transition: var(--transition);
}
.pricing-card:hover {                     /* shared hover lift */
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.pricing-card.popular {                   /* the PRO highlight */
  border-color: var(--primary);
  background: linear-gradient(180deg, rgba(255,59,59,0.05) 0%, var(--card-bg) 100%);
}
.pricing-card.popular h3 { color: #fff; } /* others: grey */

/* Diagonal "MOST POPULAR" ribbon (top-right corner) */
.pricing-card .badge {
  position: absolute; top: 16px; right: -30px;
  transform: rotate(45deg);
  background: var(--primary); color: #fff;
  padding: 4px 40px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 1px;
}

/* Price */
.price       { font-family: var(--font-heading); font-size: 3.5rem; font-weight: 700; line-height: 1; color: var(--primary); }
.price span  { font-size: 1rem; font-weight: 400; color: var(--gray-text); }   /* "/mo" */

/* Check / ✕ feature rows */
.features li            { padding: 10px 0; border-bottom: 1px solid var(--card-border);
                          font-size: 0.9rem; display: flex; align-items: center; gap: 12px; }
.features li i          { font-size: 0.8rem; color: var(--primary); }          /* fa-check */
.features li.disabled   { color: var(--muted); }                               /* greyed row */
.features li.disabled i { color: var(--muted); }                               /* fa-times */
```
```html
<div class="pricing-card popular">
  <div class="badge">MOST POPULAR</div>
  <div class="pricing-header"><h3>PRO</h3><div class="price">$59<span>/mo</span></div></div>
  <ul class="features">
    <li><i class="fas fa-check"></i> 24/7 Gym Access</li>
    <li class="disabled"><i class="fas fa-times"></i> Personal Trainer</li>
  </ul>
</div>
```

## R11. Floating "11 / YEARS OF EXCELLENCE" badge — red glow

> Solid-red card overlapping the about image's bottom-right corner, casting a soft red glow
> (the glow = a `primary-glow` box-shadow, not a blur element).

```css
.about-experience-badge {
  position: absolute; bottom: -20px; right: -20px;
  background: var(--primary); color: #fff;
  padding: 24px; border-radius: var(--radius); text-align: center;
  box-shadow: 0 10px 40px var(--primary-glow);   /* the red glow */
}
.badge-number { display: block; font-family: var(--font-heading); font-size: 3rem; font-weight: 700; line-height: 1; }
.badge-text   { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; }
```

## R12. Hero — image + dark gradient overlay (legibility)

> Full-viewport cover image; a triple-stop diagonal black gradient overlay keeps left-aligned
> text legible. Content sits above on `z-index: 2`.

```css
.hero {
  position: relative;
  height: 100vh; min-height: 700px;
  display: flex; align-items: center;
  background: url('…/hero.jpg') center/cover no-repeat;
}
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(135deg,
    rgba(0,0,0,0.85) 0%,     /* darkest at top-left, under the headline */
    rgba(10,10,10,0.6) 50%,
    rgba(0,0,0,0.8) 100%);
}
.hero-content { position: relative; z-index: 2; max-width: 700px; }

/* Scroll cue: fading red line that pulses */
.scroll-line {
  width: 2px; height: 40px;
  background: linear-gradient(180deg, var(--primary), transparent);
  animation: scrollPulse 2s ease-in-out infinite;
}
```

## R13. Section backgrounds — near-black layering + gradients

```css
body          { background-color: #0a0a0a; }                                  /* page */
.stats-bar    { background: linear-gradient(135deg, #111 0%, #1a1a1a 100%);
                border-top: 1px solid var(--card-border);
                border-bottom: 1px solid var(--card-border); }
.testimonials { background: linear-gradient(135deg, #0e0e0e, #161616); }
.footer       { background: #060606; }
/* Cards/panels sit on #111 with #1e1e1e hairline borders over the #0a0a0a page. */
```
The look is a tight near-black ramp (see A.5) — neighboring surfaces differ by only a few
RGB points, so depth reads through subtle gradients + hairline borders rather than contrast.

## R14. Form inputs, focus ring, password eye, password meter, auth split layout

> Dark fields, **red focus border + soft red ring**, grey placeholder. Two field
> backgrounds exist: **contact** inputs sit on `#0a0a0a`; **auth** inputs sit on `#111`.

**Contact inputs:**
```css
.contact-form input, .contact-form textarea {
  width: 100%; padding: 14px 16px;
  background: var(--dark-bg);             /* #0a0a0a */
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  color: var(--light-text);
  font-family: var(--font-body); font-size: 0.95rem;
  outline: none; transition: var(--transition);
}
.contact-form input:focus, .contact-form textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(255, 59, 59, 0.1);   /* red ring */
}
.contact-form input::placeholder { color: var(--muted); }
```

**Auth inputs** (icon-prefixed, `#111` field) + **eye toggle**:
```css
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-wrapper input {
  width: 100%; padding: 14px 16px 14px 44px;   /* 44px left = room for the icon */
  background: var(--card-bg);                   /* #111 (differs from contact) */
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  color: var(--light-text); font-size: 0.95rem;
  outline: none; transition: var(--transition);
}
.input-wrapper input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(255,59,59,0.1); }
.input-icon { position: absolute; left: 16px; color: var(--muted); font-size: 0.9rem; pointer-events: none; transition: var(--transition); }
.input-wrapper input:focus ~ .input-icon,
.input-wrapper input:focus + .input-icon { color: var(--primary); }   /* icon lights up red on focus */

.toggle-password { position: absolute; right: 14px; background: none; border: none;
                   color: var(--muted); cursor: pointer; padding: 4px; font-size: 0.9rem;
                   transition: var(--transition); }
.toggle-password:hover { color: var(--light-text); }
```
**Eye-toggle JS** (swaps input type + Font Awesome glyph):
```js
togglePassword.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  togglePassword.querySelector('i').className =
    type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
});
```

**Password-strength meter** — CSS track + JS-driven fill (width & color animate `0.4s`):
```css
.strength-bar  { flex: 1; height: 4px; background: var(--card-border); border-radius: 2px; overflow: hidden; }
.strength-fill { height: 100%; width: 0%; border-radius: 2px;
                 transition: width 0.4s ease, background 0.4s ease; }
.strength-text { font-size: 0.75rem; color: var(--muted); min-width: 50px; text-align: right; }
```
```js
// score 0–5: +1 each for len≥8, len≥12, has A–Z, has 0–9, has symbol
const levels = [
  { text: '',          color: 'transparent', width: '0%'   },
  { text: 'Weak',      color: '#ef476f',     width: '20%'  },
  { text: 'Fair',      color: '#ffd166',     width: '40%'  },
  { text: 'Good',      color: '#f59e0b',     width: '60%'  },
  { text: 'Strong',    color: '#06d6a0',     width: '80%'  },
  { text: 'Excellent', color: '#06d6a0',     width: '100%' },
];
```

**Auth split layout** (image panel + form panel):
```css
.auth-page { display: flex; min-height: 100vh; }
.auth-side {                              /* left 42%: photo under a dark gradient */
  width: 42%; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center; padding: 60px 40px;
  background:
    linear-gradient(135deg, rgba(0,0,0,0.85), rgba(10,10,10,0.7)),
    url('…/gym.jpg') center/cover no-repeat;
}
.auth-side::after {                       /* red accent line along the bottom */
  content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 4px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
}
.auth-main { flex: 1; display: flex; align-items: center; justify-content: center;
             padding: 40px; background: var(--dark-bg); }
.auth-container { width: 100%; max-width: 420px; }

@media (max-width: 900px) { .auth-side { display: none; } }  /* form-only on mobile */
```
The full-width auth submit button (`.btn-auth`) reuses `.btn-primary`'s **look** (135° red
gradient, 2px red border, Oswald 600 uppercase, hover `translateY(-2px)` + red glow) but is a
**separate class with its own box metrics** — not the shared `.btn`:
`width: 100%; padding: 15px; font-size: 1rem; letter-spacing: 2px;` (vs `.btn`'s `14px 32px`).
It also has a disabled state: `opacity: 0.6; cursor: not-allowed;`.

## R15. Footer — 4-column grid, dividers, link hovers

> Deepest-black footer; brand + tagline + socials, two link columns, newsletter. Hairline
> top borders divide footer from page and bottom bar. Links slide right + turn red on hover.

```css
.footer { background: #060606; padding-top: 80px; border-top: 1px solid var(--card-border); }
.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;   /* brand · Quick Links · Programs · Newsletter */
  gap: 40px; padding-bottom: 60px;
}

/* Column headings */
.footer-links h4, .footer-newsletter h4 {
  font-family: var(--font-heading); font-size: 1rem; letter-spacing: 2px;
  color: #fff; margin-bottom: 20px;
}

/* Links: grey → red + nudge right on hover */
.footer-links a        { color: var(--gray-text); font-size: 0.9rem; transition: var(--transition); }
.footer-links a:hover  { color: var(--primary); padding-left: 5px; }

/* Social round buttons: grey chip → red on hover, lifts */
.social-links a {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--secondary); border: 1px solid var(--card-border);
  color: var(--gray-text); transition: var(--transition);
}
.social-links a:hover { background: var(--primary); border-color: var(--primary); color: #fff; transform: translateY(-3px); }

/* Newsletter input + bottom bar */
.newsletter-form input        { flex: 1; padding: 12px 16px; background: var(--secondary);
                                border: 1px solid var(--card-border); border-radius: var(--radius-sm);
                                color: var(--light-text); outline: none; transition: var(--transition); }
.newsletter-form input:focus  { border-color: var(--primary); }
.footer-bottom { text-align: center; padding: 20px 0; border-top: 1px solid var(--card-border); }
.footer-bottom p { color: var(--muted); font-size: 0.85rem; }
```
Responsive: `.footer-content` collapses `2fr 1fr 1fr 2fr` → `1fr 1fr` (≤992px) → `1fr` (≤576px).

## R16. Mobile nav — hamburger → X morph + full-screen blurred overlay

> Below 992px the desktop nav + auth buttons hide and a 3-bar hamburger appears. Tapping it
> morphs the bars into an X (using the global 300ms easing) and reveals a full-viewport
> blurred overlay with large centered links.

```css
/* Hamburger button (only shown ≤992px) */
.hamburger { display: none; cursor: pointer; z-index: 1001; }
.bar {
  display: block; width: 25px; height: 3px; margin: 5px auto;
  background-color: #fff; border-radius: 2px;
  transition: var(--transition);
}
/* Active → the three bars become an X */
.hamburger.active .bar:nth-child(1) { transform: translateY(8px)  rotate(45deg);  }
.hamburger.active .bar:nth-child(2) { opacity: 0; }
.hamburger.active .bar:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

@media (max-width: 992px) {
  .nav-links, .nav-auth { display: none; }
  .hamburger { display: block; }

  /* Full-screen blurred overlay menu */
  .nav-links.active {
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
    background: rgba(10, 10, 10, 0.98);
    backdrop-filter: blur(20px);
    justify-content: center; align-items: center; gap: 10px;
    z-index: 999;
  }
  .nav-links.active li a { font-size: 1.4rem; color: #fff; padding: 16px; }
}
```
**JS-driven:** click toggles `.active` on **both** `.hamburger` and `.nav-links`; tapping any
link removes `.active` from both (auto-close).

## R17. Photo gallery — asymmetric "bento" grid + brightness hover

> A 4×2 grid where the first tile spans 2 columns × 2 rows (a large hero tile) and the rest
> fill around it. Each tile carries a `center/cover` background image and brightens on hover —
> the only `filter`-based hover on the site (still uses the global 300ms easing).

```css
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 200px);
  gap: 12px;
  border-radius: var(--radius); overflow: hidden;
}
.gallery-item {
  position: relative; overflow: hidden; cursor: pointer;
  /* each item sets its own: background: url('…') center/cover; */
  transition: var(--transition);
}
.gallery-item:hover { filter: brightness(1.2); }              /* signature hover */
.gallery-item.item-1 { grid-column: 1 / 3; grid-row: 1 / 3; } /* 2×2 hero tile */

/* Mobile: 2-col, hero tile spans both, rows auto-flow */
@media (max-width: 576px) {
  .gallery-grid { grid-template-columns: 1fr 1fr; grid-template-rows: repeat(3, 160px); }
  .gallery-item.item-1 { grid-column: 1 / 3; grid-row: auto; }
}
```

---

## Bonus — Toast, testimonial slider & comparison table (mostly JS-driven, for completeness)

**Toast** (slides in from right, auto-dismiss progress bar):
```css
.toast { position: fixed; top: 100px; right: 30px; max-width: 400px; width: 90%;
         background: var(--card-bg); border: 1px solid var(--card-border);
         border-radius: var(--radius); box-shadow: 0 20px 60px rgba(0,0,0,0.5);
         transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); overflow: hidden; }
.toast.show { transform: translateX(0); }
.toast-icon.success { background: rgba(6,214,160,0.15); color: #06d6a0; }
.toast-icon.error   { background: rgba(239,71,111,0.15); color: #ef476f; }
.toast-progress     { height: 3px; background: var(--primary); width: 100%; transition: width linear; }
```
JS animates `.toast-progress` width from 100%→0% over the toast duration (`requestAnimationFrame`).

**Testimonial slider** (cross-fade + rise, 5s autoplay, dots + circular controls):
```css
/* Faded red quote glyph anchoring each slide */
.quote-icon { font-size: 2rem; color: var(--primary); margin-bottom: 20px; opacity: 0.5; }

/* Slides cross-fade + rise */
.testimonial-slide        { position: absolute; inset: 0 auto auto 0; width: 100%;
                            opacity: 0; transform: translateY(20px);
                            transition: opacity 0.5s ease, transform 0.5s ease; }
.testimonial-slide.active { opacity: 1; transform: translateY(0); }

/* Dots: muted → red + grow when active */
.slider-dot        { width: 10px; height: 10px; border-radius: 50%; border: none;
                     background: var(--muted); cursor: pointer; transition: var(--transition); }
.slider-dot.active { background: var(--primary); transform: scale(1.3); }

/* Circular prev/next controls: outline → red on hover */
.prev-btn, .next-btn {
  width: 48px; height: 48px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--card-bg); border: 1px solid var(--card-border); color: #fff;
  cursor: pointer; transition: var(--transition);
}
.prev-btn:hover, .next-btn:hover { border-color: var(--primary); color: var(--primary); }
```
The 5-star rating glyphs use the gold `--star` (`#f5a623`); slides auto-advance every 5s
(`setInterval`), resetting on manual prev/next.

**Membership comparison table** (red-highlighted "Pro" column + subtle row hover):
```css
.comparison-table-scroll { overflow-x: auto; border: 1px solid var(--card-border); border-radius: var(--radius); }
.comparison-table        { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.comparison-table th, .comparison-table td { padding: 16px 24px; text-align: center;
                                             border-bottom: 1px solid var(--card-border); }
.comparison-table th     { background: var(--secondary); font-family: var(--font-heading);
                           font-size: 1rem; letter-spacing: 2px; color: var(--gray-text); }
.comparison-table td:first-child, .comparison-table th:first-child { text-align: left; font-weight: 500; }

.comparison-table .highlight     { background: rgba(255, 59, 59, 0.05); }  /* the "Pro" column tint */
.comparison-table th.highlight   { color: var(--primary); }               /* "Pro" header in red */
.comparison-table tbody tr:hover { background: rgba(255, 255, 255, 0.02); }/* faint row hover */
```
Cells use Font Awesome `fa-check` in red (`.text-accent`) for included features and `fa-times`
in `--muted` (`.text-muted`) for excluded ones.

---

### Fidelity notes / deviations from a "typical" gym template

1. **PRO pricing card does *not* scale or carry a glow shadow** at rest — only a red border, a faint red gradient tint, and a white heading. Scale/shadow appear only via the shared `:hover`.
2. **Two input field shades:** contact inputs use `#0a0a0a` (`--dark-bg`); auth inputs use `#111` (`--card-bg`).
3. **Headings are uppercased in markup**, not via `text-transform` (so copy must be typed uppercase).
4. **`@keyframes spin` is defined but largely unused** — button spinners rely on Font Awesome's `fa-spin`.
5. One global easing — `cubic-bezier(0.4, 0, 0.2, 1)` @ 300ms — carries ~95% of all interactions; only image-zoom, slides, reveals, and the strength meter use longer dedicated durations.
6. **Dead element:** `index.html` contains an empty `<div class="hero-particles" id="heroParticles">` with **no CSS or JS** — there is no particle effect to reproduce; ignore it.
7. **Weight 600 is requested but not loaded:** `.btn` (Oswald 600) and `.section-tag` (Roboto 600) ask for a weight not in the Google Fonts `<link>` (Oswald 400/500/700, Roboto 300/400/500/700) — the browser synth-bolds 500. Reproduced faithfully; add the 600 weights if you want crisp rendering.
