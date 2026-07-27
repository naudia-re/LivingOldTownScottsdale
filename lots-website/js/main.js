/* ============================================
   LIVING OLD TOWN SCOTTSDALE - Main JavaScript
   ============================================ */

// --- Navigation Scroll Effect ---
const nav = document.getElementById('mainNav');
const leadBar = document.getElementById('leadBar');
let leadBarVisible = false;
let leadBarClosed = false;

function handleScroll() {
  const scrollY = window.scrollY;

  // Nav background on scroll
  if (scrollY > 80) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }

  // Lead bar appears after scrolling past hero
  if (scrollY > window.innerHeight * 0.6 && !leadBarClosed) {
    leadBar.classList.add('visible');
    nav.classList.add('has-lead-bar');
    leadBarVisible = true;
  } else if (scrollY <= window.innerHeight * 0.3) {
    leadBar.classList.remove('visible');
    nav.classList.remove('has-lead-bar');
    leadBarVisible = false;
  }

  // Slide-up form appears after scrolling 60% of page
  const slideUpForm = document.getElementById('slideUpForm');
  if (slideUpForm) {
    const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollY / pageHeight;
    if (scrollPercent > 0.5 && !slideUpForm.dataset.closed) {
      slideUpForm.classList.add('visible');
    }
  }
}

window.addEventListener('scroll', handleScroll, { passive: true });

// --- Lead Bar Close ---
function closeLeadBar() {
  leadBar.classList.remove('visible');
  nav.classList.remove('has-lead-bar');
  leadBarClosed = true;
}

// --- Slide-up Form ---
function closeSlideUp() {
  const slideUpForm = document.getElementById('slideUpForm');
  slideUpForm.classList.remove('visible');
  slideUpForm.dataset.closed = 'true';
}

function handleSlideUpSubmit() {
  const input = document.querySelector('.slide-up-form input');
  if (input && input.value) {
    alert('Thank you! Check your inbox for the Old Town Market Report.');
    closeSlideUp();
  }
}

// --- Mobile Navigation ---
function toggleMobileNav() {
  const navLinks = document.getElementById('navLinks');
  const toggle = document.getElementById('mobileToggle');
  navLinks.classList.toggle('open');
  toggle.classList.toggle('active');
}

// --- Nav Dropdown (click to open, and stays open) ---
function initNavDropdowns() {
  const dropdowns = document.querySelectorAll('.ap-nav-dd');
  dropdowns.forEach(dd => {
    const trigger = dd.querySelector('.ap-nav-dd-trigger');
    if (!trigger) return;
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = dd.classList.toggle('open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      // Close any other open dropdowns
      dropdowns.forEach(other => {
        if (other !== dd) {
          other.classList.remove('open');
          const t = other.querySelector('.ap-nav-dd-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });
  // Click outside closes all
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.ap-nav-dd')) {
      dropdowns.forEach(dd => {
        dd.classList.remove('open');
        const t = dd.querySelector('.ap-nav-dd-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
  });
  // Escape closes all
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdowns.forEach(dd => {
        dd.classList.remove('open');
        const t = dd.querySelector('.ap-nav-dd-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

/* ============================================
   FORM HANDLING
   Lead-capture forms       -> Formspree (emails team@sellingsonoran.com)
   LOTS Letter / newsletter -> Flodesk

   SETUP — replace the two placeholder endpoints below:
   1. FORMSPREE: create a form at https://formspree.io set to email
      team@sellingsonoran.com, then paste its endpoint (e.g.
      https://formspree.io/f/abcdwxyz) into FORMSPREE_ENDPOINT.
   2. FLODESK: create a Flodesk signup form, publish it, and paste its
      form-action URL into FLODESK_ENDPOINT.
   Until real endpoints are set, forms show a friendly confirmation so the
   site is fully usable in demos.
   ============================================ */
const LOTS_FORM_CONFIG = {
  FORMSPREE_ENDPOINT: 'https://formspree.io/f/REPLACE_WITH_FORM_ID',
  FLODESK_ENDPOINT: 'https://form.flodesk.com/forms/REPLACE_WITH_FLODESK_ID/submit'
};

function lotsEndpointReady(url) {
  return url && url.indexOf('REPLACE_WITH') === -1;
}

function lotsSubmit(form, endpoint, successMessage) {
  const inputs = form.querySelectorAll('input, select, textarea');
  let valid = true;
  inputs.forEach(input => { if (input.required && !input.value) valid = false; });
  if (!valid) return;

  const reset = () => inputs.forEach(input => {
    if (input.tagName === 'SELECT') input.selectedIndex = 0; else input.value = '';
  });

  if (!lotsEndpointReady(endpoint)) {
    // No backend configured yet — confirm locally so the demo works.
    alert(successMessage);
    reset();
    return;
  }

  fetch(endpoint, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' }
  }).then(res => {
    if (res.ok) { alert(successMessage); reset(); }
    else { alert('Something went wrong — please email team@sellingsonoran.com and we\'ll take care of you.'); }
  }).catch(() => alert('Something went wrong — please email team@sellingsonoran.com and we\'ll take care of you.'));
}

// --- LOTS Letter / newsletter signup -> Flodesk ---
function handleLeadSubmit(form) {
  lotsSubmit(form, LOTS_FORM_CONFIG.FLODESK_ENDPOINT, 'Welcome to The LOTS Letter! Check your inbox for a confirmation.');
}

// --- "Notify me of homes" / STR exclusive list -> team inbox via Formspree ---
function handleHomesSignup(form) {
  lotsSubmit(form, LOTS_FORM_CONFIG.FORMSPREE_ENDPOINT, 'You\'re on the list! We\'ll be in touch as matching homes come to market.');
}

// --- Scroll Animation Observer ---
const animateElements = document.querySelectorAll('.animate-in');

if (animateElements.length > 0) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  animateElements.forEach(el => observer.observe(el));
}

// --- Smooth Scroll for Anchor Links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;

    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const offset = nav ? nav.offsetHeight + 20 : 100;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      // Close mobile nav if open
      const navLinks = document.getElementById('navLinks');
      if (navLinks) navLinks.classList.remove('open');
    }
  });
});

// --- ROI Calculator (STR Hub Page) ---
function initCalculator() {
  const purchaseSlider = document.getElementById('purchasePrice');
  const nightlySlider = document.getElementById('nightlyRate');
  const occupancySlider = document.getElementById('occupancyRate');

  if (!purchaseSlider) return;

  function updateCalculator() {
    const purchase = parseInt(purchaseSlider.value);
    const nightly = parseInt(nightlySlider.value);
    const occupancy = parseInt(occupancySlider.value);

    // Update display values
    document.getElementById('purchaseDisplay').textContent = '$' + purchase.toLocaleString();
    document.getElementById('nightlyDisplay').textContent = '$' + nightly;
    document.getElementById('occupancyDisplay').textContent = occupancy + '%';

    // Calculate annual revenue
    const annualRevenue = nightly * 365 * (occupancy / 100);
    const expenses = annualRevenue * 0.35; // ~35% operating expenses
    const netIncome = annualRevenue - expenses;
    const roi = ((netIncome / purchase) * 100).toFixed(1);

    document.getElementById('annualRevenue').textContent = '$' + Math.round(annualRevenue).toLocaleString();
    document.getElementById('netIncome').textContent = '$' + Math.round(netIncome).toLocaleString();
    document.getElementById('roiResult').textContent = roi + '%';
  }

  purchaseSlider.addEventListener('input', updateCalculator);
  nightlySlider.addEventListener('input', updateCalculator);
  occupancySlider.addEventListener('input', updateCalculator);

  updateCalculator();
}

// --- Contact Form Handler -> team inbox via Formspree ---
function handleContactSubmit(form) {
  lotsSubmit(form, LOTS_FORM_CONFIG.FORMSPREE_ENDPOINT, 'Thank you for reaching out! We\'ll be in touch within 24 hours.');
}

// --- Home Valuation Handler -> team inbox via Formspree ---
function handleValuationSubmit(form) {
  lotsSubmit(form, LOTS_FORM_CONFIG.FORMSPREE_ENDPOINT, 'Your home valuation request has been received! Naudia will send your personalized report within 24 hours.');
}

// --- Initialize on DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
  initCalculator();
  initNavDropdowns();
  handleScroll(); // Check initial state
});
