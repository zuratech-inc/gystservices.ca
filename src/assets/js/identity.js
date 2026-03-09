/**
 * identity.js — Netlify Identity login redirect
 * After a user logs in via the Netlify Identity widget,
 * redirect them to the CMS admin page.
 */
if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init', function (user) {
    if (!user) {
      window.netlifyIdentity.on('login', function () {
        document.location.href = '/admin/';
      });
    }
  });
}
