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

// --- Lead Form Submit ---
function handleLeadSubmit(form) {
  const inputs = form.querySelectorAll('input');
  let valid = true;
  inputs.forEach(input => {
    if (!input.value) valid = false;
  });

  if (valid) {
    alert('Welcome to The LOTS Letter! Check your inbox for a confirmation.');
    inputs.forEach(input => input.value = '');
  }
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

// --- Contact Form Handler ---
function handleContactSubmit(form) {
  const inputs = form.querySelectorAll('input, select, textarea');
  let valid = true;
  inputs.forEach(input => {
    if (input.required && !input.value) valid = false;
  });

  if (valid) {
    alert('Thank you for reaching out! We\'ll be in touch within 24 hours.');
    inputs.forEach(input => {
      if (input.tagName === 'SELECT') {
        input.selectedIndex = 0;
      } else {
        input.value = '';
      }
    });
  }
}

// --- Home Valuation Handler ---
function handleValuationSubmit(form) {
  const inputs = form.querySelectorAll('input');
  let valid = true;
  inputs.forEach(input => {
    if (input.required && !input.value) valid = false;
  });

  if (valid) {
    alert('Your home valuation request has been received! Naudia will send your personalized report within 24 hours.');
    inputs.forEach(input => input.value = '');
  }
}

// --- Initialize on DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
  initCalculator();
  handleScroll(); // Check initial state
});
