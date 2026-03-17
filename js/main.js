/* ═══════════════════════════════════════════════════════════
   CRS — main.js
   Handles: Theme Toggle · Gallery · Stats Counter · Navbar · Hamburger
═══════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ────────────────────────────────────────────────────────
     1. THEME TOGGLE
  ─────────────────────────────────────────────────────── */
  const themeToggle = document.getElementById('themeToggle');
  const html        = document.documentElement;

  const savedTheme = localStorage.getItem('crs-theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);

  themeToggle && themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('crs-theme', next);
  });

  /* ────────────────────────────────────────────────────────
     2. NAVBAR — scroll class
  ─────────────────────────────────────────────────────── */
  const navbar = document.getElementById('navbar');

  function handleScroll() {
    if (!navbar) return;
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ────────────────────────────────────────────────────────
     3. HAMBURGER (mobile nav)
  ─────────────────────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger && hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
    const spans = hamburger.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  const mobileCSS = `
    @media (max-width: 768px) {
      .nav-links.open {
        display: flex !important;
        flex-direction: column;
        position: absolute;
        top: 70px; left: 0; right: 0;
        background: var(--bg-surface);
        border-bottom: 1px solid var(--border);
        padding: 1rem 1.5rem 1.5rem;
        gap: 0.25rem;
        animation: fadeInUp .25s ease;
        box-shadow: var(--shadow);
        z-index: 199;
      }
      .nav-link { padding: 0.75rem 1rem; }
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = mobileCSS;
  document.head.appendChild(styleEl);

  /* ────────────────────────────────────────────────────────
     4. GALLERY
  ─────────────────────────────────────────────────────── */
  const galleryImages = [
    { src: 'assets/images/accident.avif', title: 'Road Accident' },
    { src: 'assets/images/fire.jpg',      title: 'Fire Outbreak'  },
    { src: 'assets/images/flood.jpeg',    title: 'Flood / Disaster'},
    { src: 'assets/images/robbery.webp',  title: 'Crime / Robbery' },
    { src: 'assets/images/stealing.jpg',  title: 'Theft'           },
  ];

  let currentIdx = 0;

  const galleryImg   = document.getElementById('galleryImage');
  const imageTitle   = document.getElementById('imageTitle');
  const imageCounter = document.getElementById('imageCounter');
  const prevBtn      = document.getElementById('prevBtn');
  const nextBtn      = document.getElementById('nextBtn');
  const thumbs       = document.querySelectorAll('.gal-thumb');

  function switchImage(idx) {
    if (!galleryImg) return;
    currentIdx = ((idx % galleryImages.length) + galleryImages.length) % galleryImages.length;
    const item = galleryImages[currentIdx];

    galleryImg.classList.add('switching');

    setTimeout(() => {
      galleryImg.src = item.src;
      galleryImg.alt = item.title;
      if (imageTitle)   imageTitle.textContent   = item.title;
      if (imageCounter) imageCounter.textContent = `${currentIdx + 1} / ${galleryImages.length}`;
      galleryImg.classList.remove('switching');
    }, 200);

    thumbs.forEach((t, i) => {
      t.classList.toggle('active', i === currentIdx);
    });
  }

  prevBtn && prevBtn.addEventListener('click', () => switchImage(currentIdx - 1));
  nextBtn && nextBtn.addEventListener('click', () => switchImage(currentIdx + 1));

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => switchImage(i));
  });

  document.addEventListener('keydown', e => {
    if (document.activeElement === prevBtn || document.activeElement === nextBtn) return;
    if (e.key === 'ArrowLeft')  switchImage(currentIdx - 1);
    if (e.key === 'ArrowRight') switchImage(currentIdx + 1);
  });

  let autoAdvance = setInterval(() => switchImage(currentIdx + 1), 5000);
  const galleryFrame = document.querySelector('.gallery-frame');
  galleryFrame && galleryFrame.addEventListener('mouseenter', () => clearInterval(autoAdvance));
  galleryFrame && galleryFrame.addEventListener('mouseleave', () => {
    autoAdvance = setInterval(() => switchImage(currentIdx + 1), 5000);
  });

  /* ────────────────────────────────────────────────────────
     5. STATS COUNTER
  ─────────────────────────────────────────────────────── */
  const statCards = document.querySelectorAll('.stat-card');

  function animateCounter(el, target, suffix, duration = 1600) {
    const start  = performance.now();
    const update = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(2, -10 * progress);
      const value = Math.round(ease * target);
      el.textContent = value.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const card    = entry.target;
      const numEl   = card.querySelector('.stat-num');
      const count   = parseInt(card.dataset.count);
      const suffix  = card.dataset.suffix || '';
      const special = card.dataset.special;
      if (!numEl) return;
      if (special) { numEl.innerHTML = special; }
      else if (!isNaN(count)) { animateCounter(numEl, count, suffix); }
      statsObserver.unobserve(card);
    });
  }, { threshold: 0.3 });

  statCards.forEach(card => statsObserver.observe(card));

  /* ────────────────────────────────────────────────────────
     6. SCROLL-REVEAL (generic)
  ─────────────────────────────────────────────────────── */
  const revealEls = document.querySelectorAll(
    '.feature-card, .emergency-card, .gal-thumb, .stat-card'
  );

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(el => {
    el.style.animationPlayState = 'paused';
    revealObserver.observe(el);
  });

});
