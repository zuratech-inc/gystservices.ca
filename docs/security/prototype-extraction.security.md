# Security Review: Extract Base Styles and Reusable Components from Prototype Pages

## Plan Reviewed
- Task: Extract base styles and reusable components from 5 HTML prototype pages into an Eleventy 3.x static site
- Files Reviewed:
  - `prototype/home.html`
  - `prototype/blog.html`
  - `prototype/blog-detail.html`
  - `prototype/events.html`
  - `prototype/event-detail.html`
  - `src/_includes/base.njk`
  - `src/_includes/page.njk`
  - `src/_includes/post.njk`
  - `src/_includes/event.njk`
  - `src/admin/index.html`
  - `src/admin/config.yml`
  - `eleventy.config.js`
  - `netlify.toml`
  - `package.json`
  - `.gitignore`
- Date: 2026-03-08

## Verdict: APPROVED WITH CONDITIONS

The static architecture is sound and the dependency surface is minimal (zero vulnerabilities found via `yarn audit`). However, seven findings must be addressed. Three are critical and block implementation of specific sub-features; the remaining four are warnings that must be addressed during implementation, not after.

---

## Findings

### Critical (must fix before implementation)

---

**[SEC-001]: No CSP policy exists anywhere in the project**

- **Risk:** Without a Content Security Policy, any XSS payload that reaches the rendered page (via a template bug, a compromised CDN resource, or injected Markdown content) executes without restriction. This is the foundational protection for everything else in this review.
- **Location:** `src/_includes/base.njk` — no `<meta http-equiv="Content-Security-Policy">` tag; `netlify.toml` — no `[[headers]]` block with CSP.
- **Fix:** Add a `[[headers]]` block to `netlify.toml` (preferred over a meta tag, because HTTP headers apply before the parser runs and cannot be removed by injected HTML). See the CSP Policy Recommendation section below for the exact directive. A meta tag fallback should also be added to `base.njk` as defence-in-depth.

---

**[SEC-002]: Sveltia CMS admin page loads from unpkg CDN without Subresource Integrity**

- **Risk:** `https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js` is fetched at runtime with no `integrity` attribute. If unpkg is compromised, or if the URL resolves to a different version than expected (unpkg does not pin to a digest by default), an attacker can serve arbitrary JavaScript into the CMS session. The CMS session holds git credentials via Netlify Identity tokens. A compromised CMS script could exfiltrate those tokens or commit malicious content.
- **Location:** `src/admin/index.html`, line 9.
- **Fix:** Pin to a specific version with a known SHA-384 hash. Replace the current `<script>` tag with:
  ```html
  <script
    src="https://unpkg.com/@sveltia/cms@0.x.x/dist/sveltia-cms.js"
    integrity="sha384-[HASH]"
    crossorigin="anonymous">
  </script>
  ```
  The developer must: (1) choose an explicit version, (2) download that exact artifact, (3) compute `openssl dgst -sha384 -binary sveltia-cms.js | openssl base64 -A` to derive the hash. The version must be recorded in `package.json` comments or a `docs/third-party.md` manifest so it is audited at each release.

---

**[SEC-003]: No authentication protection on the admin route**

- **Risk:** `src/admin/index.html` is copied verbatim to `_site/admin/` (confirmed in the build output). The page is publicly accessible. There is no Netlify Identity widget, no redirect-to-login, and no authentication gate in `netlify.toml`. Anyone who finds `/admin/` can attempt to interact with the CMS. While the git-gateway backend will reject unauthenticated git operations, the CMS UI itself is fully exposed, which increases the attack surface and violates the CLAUDE.md security baseline explicitly.
- **Location:** `src/admin/index.html`; `netlify.toml` (no access control rules); `src/admin/config.yml` (backend configured but no identity widget loaded).
- **Fix:** Add the Netlify Identity widget script to `src/admin/index.html` before the Sveltia CMS script. The identity widget must also have an SRI hash (same process as SEC-002). Additionally, add a `[[redirects]]` rule to `netlify.toml` to gate the `/admin/` path behind Netlify Identity role-based access if the Netlify plan supports it. At minimum the widget must be present so the CMS can enforce the authentication handshake.

---

### Warning (should fix, not blocking)

---

**[SEC-004]: Google Fonts loaded from external CDN without Subresource Integrity in all five prototype pages**

- **Risk:** All prototype pages (`home.html`, `blog.html`, `blog-detail.html`, `events.html`, `event-detail.html`) load fonts from `fonts.googleapis.com` with no `integrity` or `crossorigin` attributes. When this pattern is extracted into `base.njk`, it will persist. Google Fonts CSS is not SRI-hashable in a stable way because Google dynamically varies the response by User-Agent to serve only the font formats the browser needs. The correct architectural fix is to self-host the fonts.
- **Fix:** Download Fraunces and Outfit font files (WOFF2 format) and place them in `src/assets/fonts/`. Declare them with `@font-face` in the main CSS file. Remove all `fonts.googleapis.com` and `fonts.gstatic.com` references entirely. This also removes a third-party data collection point (Google receives every visitor's IP via the font request). If self-hosting is rejected for any reason, the CSP must include `style-src 'self' https://fonts.googleapis.com` and `font-src 'self' https://fonts.gstatic.com`, and the trade-off must be explicitly documented.
- **Impact:** Blocks achieving a strict CSP without `unsafe-inline` (see SEC-005 below).

---

**[SEC-005]: Prototype pages are architecturally incompatible with CSP — inline styles and inline scripts are pervasive**

- **Risk:** Every prototype page contains: (a) a `<style>` block in `<head>` with all CSS inline, (b) multiple `style=""` attributes on individual elements (confirmed on `home.html` lines 1288, 1410, 1533; `events.html` line 229, 264, 353, 354; `blog.html` lines 486, 498, 499, 509, 510, 523; `event-detail.html` lines 273–316; `blog-detail.html` lines 128 and throughout), and (c) `<script>` blocks with inline JavaScript. This is the expected state for a prototype. It is flagged here as a warning because the entire point of this task is to extract and separate these concerns — but the developer must understand that direct copy-paste of any prototype HTML into Nunjucks templates is a CSP violation. Every `style=""` attribute must be replaced with a CSS class. Every `<style>` block must move to `src/assets/css/`. Every `<script>` block must move to `src/assets/js/`.
- **Specific instance requiring attention:** `events.html` line 367 contains an `onclick` attribute with inline JavaScript: `onclick="this.innerHTML='...';"`. This is an inline event handler, which is a CSP `script-src unsafe-inline` violation. It must be replaced with an external event listener in `src/assets/js/`.
- **Fix:** During extraction, the developer must perform a diff of every rendered element against the CSP policy. The lint step must catch any remaining inline styles or scripts before merge.

---

**[SEC-006]: `{{ content | safe }}` is used in all three layout templates without documented justification**

- **Risk:** `page.njk` line 5, `post.njk` line 11, and `event.njk` line 11 all use `{{ content | safe }}`. The `| safe` filter disables Nunjucks auto-escaping for that variable. For a static site where all content is authored in Markdown files committed to the repository, this is the standard and correct pattern — Eleventy's Markdown renderer produces sanitized HTML that is safe to pass through. However, this assumption breaks if: (a) the Sveltia CMS markdown widget is configured to allow raw HTML, (b) a future CMS user pastes HTML into the body field, or (c) migrated WordPress content contains encoded script payloads. The risk is not in the current templates but in the content pipeline.
- **Fix:** Two mitigations are required. First, add a comment directly above each `{{ content | safe }}` usage:
  ```njk
  {# SECURITY: | safe is intentional. Content is rendered from Markdown in the
     repository. Raw HTML in Markdown is disabled in eleventy.config.js via
     markdownIt options. CMS body widget must not enable raw HTML mode. #}
  ```
  Second, confirm that the Markdown renderer has raw HTML disabled. In `eleventy.config.js`, add an explicit markdownIt configuration:
  ```js
  const md = markdownIt({ html: false });
  eleventyConfig.setLibrary("md", md);
  ```
  With `html: false`, any HTML tags embedded in Markdown content are escaped rather than rendered, eliminating the XSS vector even if `| safe` is used downstream.

---

**[SEC-007]: No HTTP security headers are configured in `netlify.toml`**

- **Risk:** The current `netlify.toml` contains only `[build]` configuration. No `[[headers]]` block exists. Without these headers, browsers receive no instruction on framing policy (clickjacking), MIME type sniffing, referrer data, or permissions for browser APIs. This is a baseline requirement per CLAUDE.md.
- **Fix:** See the Security Headers Recommendation section below for the exact `netlify.toml` block to add.

---

### Informational

- **[INFO-001] Contact PII in prototype only, not yet in `_data/site.json`:** The phone number (368-996-6230) and email (info@gystservices.ca) appear only in `prototype/home.html` and are not yet in any data file. No `src/_data/` directory exists. The task plan should include creating `src/_data/site.json` to centralize this data before templating begins. This is not a security concern in itself but prevents PII from being scattered across multiple template files where a correction (e.g., phone number change) might be missed, leaving stale data in one template.

- **[INFO-002] `_site/` is in `.gitignore` but is currently committed (build artifact in repo):** The `_site/` directory exists on disk and appears to have been built. Confirm it is not tracked by git. If source maps are ever enabled in the build, `_site/` in version control would expose internal source structure.

- **[INFO-003] `media_folder` in `config.yml` points to `src/uploads`, not `src/assets/images/uploads/`:** Per CLAUDE.md, media uploads should go to `src/assets/images/uploads/`. The current path `src/uploads` would place uploaded images outside the assets pipeline, potentially outside the passthrough copy configuration. This is an architecture concern that has a security dimension: if the upload path is not validated at the hosting layer, uploads could land in unexpected locations.

- **[INFO-004] `yarn.lock` is present but `package-lock.json` is absent:** The project uses yarn. `npm audit` cannot run without a `package-lock.json`. The CLAUDE.md security baseline says "run `npm audit` before every release." This should be updated to read "run `yarn audit`" to match the actual toolchain, and the CI/CD pipeline (if any) should call `yarn audit --level high` as a build gate.

- **[INFO-005] No `docs/plans/` plan file was provided for review:** This security review was conducted against the stated task description and the current codebase state rather than a formal plan document. When the Software Architect produces a plan file, it should be re-submitted for a focused plan review before implementation begins.

---

## CSP Policy Recommendation

The following policy is appropriate for the main site pages once self-hosted fonts are implemented (SEC-004 fix applied) and all inline styles and scripts are extracted (SEC-005 fix applied).

Add to `netlify.toml` under a new `[[headers]]` block:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
```

If Google Fonts cannot be self-hosted (accepted trade-off with documented justification), the policy relaxes to:

```toml
Content-Security-Policy = "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
```

The admin page requires a separate, more permissive policy to accommodate the Sveltia CMS script and Netlify Identity:

```toml
[[headers]]
  for = "/admin/*"
  [headers.values]
    Content-Security-Policy = "default-src 'none'; script-src 'self' https://unpkg.com https://identity.netlify.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://api.netlify.com https://identity.netlify.com https://*.netlify.com; frame-src 'self'; frame-ancestors 'none'; base-uri 'self'"
```

Note: `unsafe-inline` for `style-src` on `/admin/*` is acceptable only for the admin page, not the public site. Sveltia CMS injects styles dynamically and requires this. It must not propagate to the `/*` policy.

---

## Security Headers Recommendation

Add the following complete `[[headers]]` configuration to `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    Content-Security-Policy = "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"

[[headers]]
  for = "/admin/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'none'; script-src 'self' https://unpkg.com https://identity.netlify.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://api.netlify.com https://identity.netlify.com https://*.netlify.com; frame-src 'self'; frame-ancestors 'none'; base-uri 'self'"
```

`X-Frame-Options: DENY` on `/*` prevents the public site from being framed in any context. `SAMEORIGIN` on `/admin/*` permits Netlify Identity's iframe-based authentication flow while still blocking external framing.
