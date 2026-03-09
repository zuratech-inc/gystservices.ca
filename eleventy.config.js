module.exports = function (eleventyConfig) {
  // ── Passthrough copies ──────────────────────────────────────────────────
  // Static assets are copied as-is to _site/. No processing by 11ty.
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/js");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/uploads");

  // ── Filters ─────────────────────────────────────────────────────────────

  /**
   * date(value, format) — Format a Date object or ISO string.
   * Supported formats:
   *   'yyyy-MM-dd'   → ISO date string (for datetime attributes)
   *   'LLLL d, yyyy' → Human-readable date (e.g. "March 8, 2026")
   */
  eleventyConfig.addFilter("date", function (value, format) {
    const d = new Date(value);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    if (format === "yyyy-MM-dd") {
      return d.toISOString().split("T")[0];
    }
    if (format === "LLLL d, yyyy") {
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    return d.toLocaleDateString();
  });

  /**
   * limit(arr, n) — Return the first n items of an array.
   * Nunjucks built-in slice() chunks arrays rather than slicing them,
   * so this custom filter provides Python/JS-style head slicing.
   */
  eleventyConfig.addFilter("limit", function (arr, n) {
    if (!Array.isArray(arr)) return arr;
    return arr.slice(0, n);
  });

  /**
   * monthShort(value) — Return 3-letter month abbreviation from a date.
   * Used in event cards to format the date badge (e.g. "Mar", "Apr").
   */
  eleventyConfig.addFilter("monthShort", function (value) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date(value);
    return months[d.getUTCMonth()];
  });

  /**
   * dayOfMonth(value) — Return the day number from a date.
   * Used in event cards to format the date badge (e.g. "15", "5").
   */
  eleventyConfig.addFilter("dayOfMonth", function (value) {
    const d = new Date(value);
    return d.getUTCDate();
  });

  /**
   * startsWith(str, prefix) — Check if a string starts with a prefix.
   * Used in partials/header.njk for nav active state:
   *   {% if page.url | startsWith(item.url) %}
   * Only matches non-anchor URLs (hash URLs are home page links).
   */
  eleventyConfig.addFilter("startsWith", function (str, prefix) {
    if (!str || !prefix) return false;
    // Anchor links (e.g. /#about) should never match as active pages
    if (prefix.startsWith("/#")) return false;
    // Root "/" would match everything — require exact match for home
    if (prefix === "/") return str === "/";
    return str.startsWith(prefix);
  });

  /**
   * slugify(str) — Convert a string to a URL-safe slug.
   * Used in templates for consistent URL generation.
   */
  eleventyConfig.addFilter("slugify", function (str) {
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  });

  // ── Markdown configuration ───────────────────────────────────────────────
  // html: false — prevents raw HTML in Markdown content (security baseline).
  // Authors should use 11ty shortcodes instead of inline HTML.
  const markdownIt = require("markdown-it");
  const md = markdownIt({
    html: false,
    linkify: true,
    typographer: true,
  });
  eleventyConfig.setLibrary("md", md);

  // ── Collections ─────────────────────────────────────────────────────────

  /**
   * post collection — all items tagged "post", sorted newest first.
   * Used by the blog listing page and blog preview on the homepage.
   */
  eleventyConfig.addCollection("post", (collectionApi) => {
    return collectionApi.getFilteredByTag("post")
      .sort((a, b) => b.date - a.date);
  });

  /**
   * event collection — all items tagged "event", sorted by eventDate.
   * Uses frontmatter eventDate (ISO string) when available, falling back
   * to Eleventy's file date.
   */
  eleventyConfig.addCollection("event", (collectionApi) => {
    return collectionApi.getFilteredByTag("event")
      .sort((a, b) => {
        const aDate = a.data.eventDate ? new Date(a.data.eventDate) : a.date;
        const bDate = b.data.eventDate ? new Date(b.data.eventDate) : b.date;
        return aDate - bDate;
      });
  });

  // ── Return config object ─────────────────────────────────────────────────
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
