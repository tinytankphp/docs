# Checking

Every page of your site is checked with [axe-core](https://github.com/dequelabs/axe-core), the
engine behind most accessibility tools, in the light and the dark theme, against **WCAG 2.2 AA**
and axe's best practices. It runs with the browser tests, so a problem **fails CI**: it can't reach
the live site unnoticed (and a site that publishes from CI isn't published).

## The four moments

From the fastest feedback to the safety net:

1. **While you design.** In Chrome's DevTools, the colour picker shows the contrast ratio of the
   text you inspect, with a line at 4.5:1; Firefox's accessibility panel does the same. The free
   [axe DevTools](https://www.deque.com/axe/devtools/) extension checks the page you're on in a
   second. That's the cheapest moment to catch contrast: before a colour spreads to every template.
2. **Before you commit**, after a template or CSS change:

   ```sh
   npm run build          # the checks run against a build, like the other browser tests
   npm run test:a11y      # about half a minute: every page, both themes
   ```

3. **Before you push, automatically** (optional): the skeleton has a Git hook that runs the same two
   commands and stops the push if something fails. Turn it on once per clone:

   ```sh
   git config core.hooksPath .githooks
   ```

   `git push --no-verify` skips it for one push. With DDEV, push from inside the container
   (`ddev ssh`), where the browser is, or set `CHROMIUM_PATH`.
4. **In CI**, always: `npm run test:e2e` includes the checks. A failure stops the job, and the
   publish job after it.

Coding agents get the same instruction in `AGENTS.md`: run `npm run test:a11y` after changing
templates or CSS.

## What a failure looks like

```
2 accessibility problem(s):

/blog: Elements must meet minimum color contrast ratio thresholds (color-contrast, serious)
    time[datetime="2026-09-27"]
    Fix any of the following: Element has insufficient color contrast of 4.12 (foreground color:
    #79716b, background color: #0c0a09, font size: 10.5pt (14px), font weight: normal). Expected
    contrast ratio of 4.5:1
    https://dequeuniversity.com/rules/axe/4.14/color-contrast
```

Each problem names the page, the rule, the element (a CSS selector) and what to change, with a link
to the rule's explanation. Which theme is in the test's name (`the dark theme › every page…`).

## The test

`tests/e2e/axe.spec.js` reads the pages from `/sitemap.xml`: every page and translation a search
engine would see. A page left out of the sitemap (an unlisted page) isn't checked; neither are the
states a page reaches after clicking (an open menu, a form with errors): check those with a test of
their own (`new AxeBuilder({ page }).include('#menu').analyze()` after opening it).

### Accepting a problem, visibly

Sometimes a problem can't be fixed today (a third-party widget, a design waiting for a decision). The
test has a list for that, which should stay empty:

```js
// [rule, part of the element's selector, why]
const EXCEPTIONS = [
    ['color-contrast', '.legacy-banner', 'replaced in the next release (issue #12)'],
];
```

The check passes, and the exception is in the code, where a review sees it, instead of a check
that's switched off.

## What the checks can't see

Automated checks find the measurable problems (contrast, names, labels, ARIA misuse, structure),
about a third to a half of what can go wrong. Before a launch, and after a big change, try the site
yourself:

- **Keyboard only**: Tab through a page. Can you reach everything, see where you are, and use it
  (menus, the theme switch, forms, video)? Does the focus go somewhere sensible after an action?
- **Zoom to 200%**, and a narrow window: nothing cut off or overlapping, no sideways scrolling for text.
- **A screen reader** for a few minutes: VoiceOver (macOS, iOS), NVDA (Windows, free), TalkBack
  (Android). Do headings, links and buttons say what they do? Is a form's result announced?
- **Reduced motion** on (your system's accessibility settings): nothing moves that the visitor
  didn't ask for.
- **Alt text** reads well out of context, and decorative images have none.
