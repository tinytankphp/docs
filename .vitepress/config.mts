import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';

// Published on GitHub Pages at the custom domain https://docs.tinytank.dev/ (the root). Without the
// domain, Pages would serve it under /docs/: build with DOCS_BASE=/docs/ then.
const base = process.env.DOCS_BASE ?? '/';
const repo = 'https://github.com/tinytankphp/docs';

// Each TinyTank version gets its own folder (1.x/, later 2.x/…), so links never break.
const v1 = '/1.x';

export default defineConfig({
    base,
    lang: 'en-US',
    title: 'TinyTank',
    description: 'A tiny, database-free PHP micro framework for static-like dynamic sites.',
    cleanUrls: true,
    markdown: {
        // Pages are compiled as Vue templates, so Twig's {{ … }} in inline code would be read as a
        // Vue expression. Code blocks are already v-pre; do the same for inline code.
        config(md) {
            const render = md.renderer.rules.code_inline!;
            md.renderer.rules.code_inline = (...args) => render(...args).replace(/^<code/, '<code v-pre');
        },
    },
    lastUpdated: true,
    // For LLMs and coding agents: /llms.txt (an index of every page), /llms-full.txt (all the docs in
    // one file) and a .md version of each page (https://llmstxt.org).
    vite: {
        plugins: [
            llmstxt({
                domain: 'https://docs.tinytank.dev',
                description: 'A tiny, database-free PHP micro framework for static-like dynamic sites: Twig, Datastar, Markdown content, translations and SEO, compiled ahead of time for Opcache.',
                details: 'Start a site with `composer create-project tinytank/tinytank my-site`, then read the Starting a site checklist. TinyTank has no database, no sessions and no admin panel; interactivity uses Datastar actions; a strict Content Security Policy blocks inline scripts and other hosts.',
                ignoreFiles: ['README.md', 'index.md'],
            }),
        ],
    },
    head: [
        // The tank on a square canvas; favicon.ico (16, 32, 48 px) for browsers without SVG favicons.
        ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
        ['link', { rel: 'icon', href: `${base}favicon.ico`, sizes: '48x48' }],
        ['link', { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` }],
    ],

    themeConfig: {
        logo: '/logo.svg',
        nav: [
            { text: 'Guide', link: `${v1}/`, activeMatch: `^${v1}/(?!reference)` },
            { text: 'Reference', link: `${v1}/reference/config`, activeMatch: `^${v1}/reference/` },
            { text: '1.x · 0.x beta', items: [{ text: '1.x (0.x beta, current)', link: `${v1}/` }] },
        ],
        sidebar: {
            [`${v1}/`]: [
                {
                    text: 'Introduction',
                    items: [
                        { text: 'What is TinyTank?', link: `${v1}/` },
                        { text: 'Philosophy', link: `${v1}/philosophy` },
                    ],
                },
                {
                    text: 'Getting started',
                    items: [
                        { text: 'Installation', link: `${v1}/getting-started/installation` },
                        { text: 'Starting a site', link: `${v1}/getting-started/checklist` },
                        { text: 'Project structure', link: `${v1}/getting-started/structure` },
                        { text: 'Your first page', link: `${v1}/getting-started/first-page` },
                    ],
                },
                {
                    text: 'The basics',
                    items: [
                        { text: 'Configuration', link: `${v1}/basics/configuration` },
                        { text: 'Routing', link: `${v1}/basics/routing` },
                        { text: 'Controllers', link: `${v1}/basics/controllers` },
                        { text: 'Templates', link: `${v1}/basics/templates` },
                        { text: 'Querying content', link: `${v1}/basics/querying` },
                        { text: 'Datastar', link: `${v1}/basics/datastar` },
                    ],
                },
                {
                    text: 'Content',
                    items: [
                        { text: 'The blog', link: `${v1}/content/blog` },
                        { text: 'Writing posts', link: `${v1}/content/posts` },
                        { text: 'Translating posts', link: `${v1}/content/translations` },
                        { text: 'Content pages', link: `${v1}/content/pages` },
                        { text: 'Content components', link: `${v1}/content/components` },
                        { text: 'Data collections', link: `${v1}/content/collections` },
                    ],
                },
                {
                    text: 'Features',
                    items: [
                        { text: 'Languages', link: `${v1}/features/languages` },
                        { text: 'SEO', link: `${v1}/features/seo` },
                        { text: 'Frontend & Vite', link: `${v1}/features/frontend` },
                        { text: 'JavaScript & Datastar', link: `${v1}/features/javascript` },
                        { text: 'Dark & light theme', link: `${v1}/features/theme` },
                        { text: 'Fonts & icons', link: `${v1}/features/fonts-icons` },
                        { text: 'Images', link: `${v1}/features/images` },
                        { text: 'Forms', link: `${v1}/features/forms` },
                        { text: 'Logging', link: `${v1}/features/logging` },
                    ],
                },
                {
                    text: 'Extending',
                    items: [
                        { text: 'Building a site on TinyTank', link: `${v1}/extending/` },
                        { text: 'Services & bootstrap', link: `${v1}/extending/bootstrap` },
                        { text: 'Console commands', link: `${v1}/extending/commands` },
                        { text: 'Deploy steps', link: `${v1}/extending/deploy-steps` },
                        { text: 'Writing a package', link: `${v1}/extending/packages` },
                        { text: 'Updating TinyTank', link: `${v1}/extending/updating` },
                    ],
                },
                {
                    text: 'Accessibility',
                    items: [
                        { text: 'Overview', link: `${v1}/accessibility/` },
                        { text: 'Checking', link: `${v1}/accessibility/checking` },
                        { text: 'Colour and contrast', link: `${v1}/accessibility/contrast` },
                    ],
                },
                {
                    text: 'Static Site Generator',
                    items: [
                        { text: 'Overview', link: `${v1}/static-site-generator/` },
                        { text: 'How it works', link: `${v1}/static-site-generator/how-it-works` },
                        { text: 'Configuration', link: `${v1}/static-site-generator/configuration` },
                        { text: 'What needs the server', link: `${v1}/static-site-generator/what-needs-the-server` },
                        { text: 'Search', link: `${v1}/static-site-generator/search` },
                        { text: 'Forms', link: `${v1}/static-site-generator/forms` },
                        { text: 'Hosts', link: `${v1}/static-site-generator/hosts` },
                        { text: 'Preview', link: `${v1}/static-site-generator/preview` },
                        { text: 'Publishing', link: `${v1}/static-site-generator/publishing` },
                        { text: 'Troubleshooting', link: `${v1}/static-site-generator/troubleshooting` },
                    ],
                },
                {
                    text: 'Going live',
                    items: [
                        { text: 'Deploying', link: `${v1}/deployment/` },
                        { text: 'Servers & Opcache', link: `${v1}/deployment/servers` },
                        { text: 'CDN caching', link: `${v1}/deployment/cdn` },
                        { text: 'Testing', link: `${v1}/testing` },
                        { text: 'Security', link: `${v1}/security` },
                        { text: 'Contributing', link: `${v1}/contributing` },
                    ],
                },
                {
                    text: 'Reference',
                    items: [
                        { text: 'Configuration', link: `${v1}/reference/config` },
                        { text: 'Environment variables', link: `${v1}/reference/environment` },
                        { text: 'Console commands', link: `${v1}/reference/console` },
                        { text: 'Twig', link: `${v1}/reference/twig` },
                        { text: 'PHP API', link: `${v1}/reference/php` },
                    ],
                },
            ],
        },
        search: { provider: 'local' },
        outline: { level: [2, 3] },
        editLink: { pattern: `${repo}/edit/main/:path`, text: 'Edit this page on GitHub' },
        socialLinks: [{ icon: 'github', link: 'https://github.com/tinytankphp/tinytank' }],
        footer: { message: 'TinyTank documentation' },
    },
});
