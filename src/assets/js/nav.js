/**
 * nav.js — Mobile navigation toggle and scroll state
 *
 * Responsibilities:
 * 1. Add .js class to <html> for progressive enhancement
 * 2. Toggle mobile menu open/close with hamburger button
 * 3. Close menu on link click, Escape key, or outside click
 * 4. Trap focus inside open mobile menu
 * 5. Add .scrolled class to nav on scroll
 *
 * Budget: < 1.5KB minified.
 */
(function () {
  'use strict';

  // 1. Signal JS is available
  document.documentElement.classList.add('js');

  var nav = document.getElementById('nav');
  var toggle = document.getElementById('mobileToggle');
  var links = document.getElementById('navLinks');

  if (!nav || !toggle || !links) return;

  function isMenuOpen() {
    return links.classList.contains('open');
  }

  function openMenu() {
    links.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    // Focus the first link so screen readers land inside the menu
    var firstLink = links.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    links.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menu');
  }

  // 2. Mobile menu toggle
  toggle.addEventListener('click', function () {
    if (isMenuOpen()) {
      closeMenu();
      toggle.focus();
    } else {
      openMenu();
    }
  });

  // 3a. Close menu on link click
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      closeMenu();
    }
  });

  // 3b. Close menu on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isMenuOpen()) {
      closeMenu();
      toggle.focus();
    }
  });

  // 3c. Close menu on outside click
  document.addEventListener('click', function (e) {
    if (isMenuOpen() && !nav.contains(e.target)) {
      closeMenu();
    }
  });

  // 4. Trap focus inside mobile menu when open
  nav.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !isMenuOpen()) return;

    var focusable = nav.querySelectorAll(
      'a[href], button:not([disabled])'
    );
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // 5. Scroll state — frosted glass effect on scroll
  function onScroll() {
    if (window.scrollY > 10) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}());
