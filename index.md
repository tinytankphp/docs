---
layout: home

hero:
  name: TinyTank
  text: Dynamic sites at static speed
  tagline: A tiny, database-free PHP micro framework, freely inspired by Craft CMS and Datastar. Twig, Datastar, a Markdown blog, translations and SEO, compiled ahead of time for Opcache.
  image:
    src: /logo.svg
    alt: TinyTank
  actions:
    - theme: brand
      text: Get started
      link: /1.x/getting-started/installation
    - theme: alt
      text: What is TinyTank?
      link: /1.x/

features:
  - title: No database, no admin panel
    details: Content lives in Markdown files, configuration in PHP and .env. Everything a request needs is compiled into var/cache and served from Opcache's shared memory.
  - title: Reactive without a JS framework
    details: Datastar drives the UI over server-sent events; Twig partials render on the server. A Craft-style Twig API makes it a one-liner.
  - title: Content, languages, SEO
    details: A blog with post folders, images, drafts and translated posts; /it/-style language URLs; Open Graph, JSON-LD, hreflang, sitemap and Atom feeds.
  - title: Proven parts, little glue
    details: Symfony components, Twig, CommonMark and Vite do the heavy lifting. TinyTank is the small layer that ties them together, and stays readable.
  - title: A skeleton and a package
    details: Start a site from the skeleton; the framework is a Composer package you update, never edit. Commands, services, Twig extensions and deploy steps plug in from the app.
  - title: Tested and analysed
    details: Hundreds of tests across the framework and the app, browser tests, PHPStan level 8, and CI from day one.
  - title: Ready for coding agents
    details: Every new site comes with an AGENTS.md for coding agents, and these docs are available as llms.txt and llms-full.txt, with a Markdown version of every page.
    link: /1.x/getting-started/installation#next-steps
    linkText: How to use them
---
