/**
 * reveal.js — Scroll-triggered reveal animations
 *
 * Uses IntersectionObserver to add .visible to .reveal
 * elements when they enter the viewport. Only runs when:
 * - IntersectionObserver is supported
 * - User has not set prefers-reduced-motion: reduce
 *
 * The .js .reveal { opacity: 0 } rule in animations.css
 * hides elements initially (only if .js is on <html>).
 * nav.js adds .js before this script runs.
 *
 * Budget: < 0.5KB minified.
 */

(function () {
  // Bail out if reduced motion is preferred
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Bail out if IntersectionObserver is not supported
  if (!('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Unobserve after reveal — element stays visible
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal').forEach(function (el) {
    observer.observe(el);
  });
}());
