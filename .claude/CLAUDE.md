# Project: Eleventy Static Site

## Purpose

This is a static site framework for modern, performant, low-cost static hosting. 
Every decision should prioritize: speed, accessibility, low hosting cost, maintainability, and clean separation of concerns.

## Tech Stack

| Layer | Technology                         | Version |
|-------|------------------------------------|---------|
| Static Site Generator | Eleventy (11ty)                    | 3.x |
| Templating Engine | Nunjucks                           | latest |
| Content Format | Markdown (.md) with YAML frontmatter | — |
| CMS | Sveltia CMS (Git-based) | latest |
| Styling | CSS (vanilla or with PostCSS)      | — |
| Hosting Targets | Netlify       | — |
| Package Manager | yarn                               | — |

## Project Structure

```
/
├── src/
│   ├── _data/              # Global data files (JSON, JS)
│   ├── _includes/
│   │   ├── layouts/        # Nunjucks base layouts
│   │   ├── partials/       # Reusable Nunjucks partials (header, footer, nav)
│   │   └── macros/         # Nunjucks macros for repeated patterns
│   ├── assets/
│   │   ├── css/            # Stylesheets
│   │   ├── js/             # Client-side JS (minimal, no frameworks)
│   │   ├── images/         # Source images (processed by 11ty Image)
│   │   └── fonts/          # Self-hosted web fonts
│   ├── content/              # Static pages (about, contact, etc.)
│   │   ├── pages/              # Static pages (about, contact, etc.)
│   │   ├── posts/              # Blog/news Markdown content
│   │   ├── events/              # Blog/news Markdown content
│   └── admin/              # Sveltia CMS config (config.yml + index.html)
├── _site/                  # Build output (gitignored)
├── .claude/
│   └── agents/             # Claude Code subagent definitions
├── .eleventy.js            # Eleventy config (or eleventy.config.js)
├── package.json
├── CLAUDE.md               # This file
└── README.md
```

## Common Commands

```bash
# Development
yarn dev                 # Start 11ty dev server with --serve
yarn build               # Production build to _site/

# Testing & Validation
yarn lint                # Run linters (HTML, CSS, a11y)
yarn test                # Run any automated tests
npx @11ty/eleventy --dryrun # Validate config without building

# Image Optimization
npx @11ty/eleventy-img <url-or-path>  # Process a single image
```

## Architecture Principles

1. **Zero JavaScript by default.** Pages ship no JS unless a feature explicitly requires it. Progressive enhancement only.
2. **Content-first architecture.** Every page type starts as Markdown with YAML frontmatter. Nunjucks layouts consume the frontmatter.
3. **Template hierarchy is strict.** `base.njk` → `page.njk` / `post.njk` → content. Never skip a level.
4. **Images are always optimized.** Use 11ty Image plugin. Always generate multiple formats (avif, webp, jpeg) and sizes. Always include width/height and alt text.
5. **No inline styles. No inline scripts.** All CSS goes in `/assets/css/`. All JS goes in `/assets/js/`. This is a hard requirement for CSP compliance.
6. **Semantic HTML only.** Use correct heading hierarchy. Use `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`. Every page passes axe-core a11y audit.
7. **Data cascade matters.** Understand 11ty's data cascade: Global data (`_data/`) → Directory data → Template frontmatter → Computed data. Never duplicate data across levels.
8. **CMS config mirrors content structure.** Every Sveltia CMS collection maps 1:1 to a content directory and its frontmatter schema.
9. **Modular Nunjucks.** Every UI pattern that appears more than once becomes a partial or macro. Partials for stateful blocks (header, footer), macros for parameterized patterns (buttons, cards, CTAs).
10. **Performance budget.** Target: Lighthouse 95+ across all categories. First Contentful Paint < 1.5s. Total page weight < 200KB (excluding images).

## Eleventy Configuration Conventions

- Use `eleventy.config.js` (ESM) unless the project requires CJS compatibility.
- Register all custom filters, shortcodes, and collections in the config file.
- Passthrough copy: `assets/fonts/`, `assets/images/`, `admin/`.
- Set input directory to `src/`, output to `_site/`.
- Always define a `slugify` filter for consistent URL generation.
- Enable 11ty Navigation Plugin for menus.

## Nunjucks Conventions

- Template inheritance: `{% extends "layouts/base.njk" %}` with named blocks: `content`, `head`, `scripts`.
- Partials: `{% include "partials/header.njk" %}` — never embed HTML directly in layouts when a partial exists.
- Macros: `{% from "macros/components.njk" import card, button %}` — always import, never inline.
- Filters: prefer Eleventy-registered filters over Nunjucks built-ins when both exist.
- Never use raw HTML in Markdown files unless absolutely necessary. Use shortcodes instead.

## Markdown Content Conventions

- Every Markdown file has YAML frontmatter with at minimum: `title`, `description`, `date`, `layout`.
- Use `tags` for taxonomy. Use 11ty collections generated from tags.
- Image references use the 11ty Image shortcode, never raw `<img>` tags.
- Internal links use relative paths or the `url` filter.

## Sveltia CMS Conventions

- Config lives in `src/admin/config.yml`.
- Backend: `git-gateway` (for Netlify) or `github` (for direct GitHub integration).
- Media: stored in `src/assets/images/uploads/` with `public_folder` set accordingly.
- Each collection's `fields` must exactly match the Markdown frontmatter schema for that content type.
- Widget types should enforce data integrity: use `select` over `string` when options are finite, `datetime` over `string` for dates, `image` for media.
- Preview templates are optional but recommended for complex layouts.

## CSS Conventions

- Mobile-first responsive design. Breakpoints: 480px, 768px, 1024px, 1280px.
- Use CSS custom properties for theming (colors, fonts, spacing scale).
- BEM-like naming: `.block__element--modifier` for component CSS.
- No CSS frameworks unless the client specifically requests one.
- Dark mode support via `prefers-color-scheme` media query.

## Security Baseline

- Every page includes a Content Security Policy meta tag or HTTP header.
- No inline scripts or styles (CSP compliance).
- All external resources loaded with `integrity` and `crossorigin` attributes.
- Forms use honeypot fields and rate limiting (via hosting provider or serverless function).
- Sveltia CMS admin page is protected by authentication (Netlify Identity, GitHub OAuth, or equivalent).
- No secrets in client-side code. Environment variables stay server-side (build-time only).
- Dependency audit: run `npm audit` before every release.

## Multi-Agent Workflow

This project uses four custom agents that coordinate on every task:

1. **project-manager** — Scoping, risk, planning
2. **architecture-reviewer** — Scalability, security, design patterns
3. **security-reviewer** — Review and Test Security and architecture decisions.
4. **qa-reviewer** — Test strategy, quality gates, acceptance criteria
5**coding-agent** — Implementation following all upstream plans

### How to trigger the pipeline

**Option A — Slash command (sequential pipeline):**
```
/task-orchestrator Add user authentication with OAuth2 support
```

**Option B — Agent teams (parallel, with inter-agent messaging):**
```
Create an agent team to work on: [task description].
Spawn five teammates: project-manager, architecture-reviewer, qa-reviewer, security-reviewer and coding-agent.
Have them coordinate through the shared task list.
```

**Option C — Manual chaining:**
```
Use the project-manager subagent to review this task: [description].
Then pass results to architecture-reviewer, then qa-reviewer, then coding-agent.
```

### Agent coordination rules

- Every new task MUST start with the project-manager agent
- The architecture-reviewer should receive the project manager's output before reviewing
- The security-reviewer should receive the architecture decisions for security vulnerabilities, blocks any critical/major issues.
- The qa-reviewer should receive both the PM plan and architecture review before designing tests
- The coding-agent should receive outputs from all three agents before implementing
- If any agent flags a critical blocker, implementation pauses until resolved

### Coding Standards

- Follow existing patterns in the codebase
- All public APIs must have documentation
- All new features must have tests
- Security-sensitive code must be reviewed by architecture-reviewer
- No hardcoded secrets, credentials, or API keys
