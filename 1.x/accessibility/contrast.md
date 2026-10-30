# Colour and contrast

Low contrast is the most common accessibility problem on the web, and the easiest to fix: text has
to stand out from what's behind it, for people with low vision, on a phone in the sun, on a cheap
screen.

## The numbers (WCAG 2.2 AA)

| Text | Minimum contrast |
|---|---|
| Body text (below 24px, or 18.66px bold) | **4.5:1** |
| Large text (24px and up, or 18.66px bold and up) | 3:1 |
| Icons and borders that carry meaning (a field's outline, a chart's line) | 3:1 |
| Logos, disabled controls, pure decoration | none |

Text hidden from screen readers (`aria-hidden`) still counts: it's still read by eyes.

## Both themes

A palette tuned for one theme often fails in the other: an accent that glows on black is too light
on cream, a grey that's quiet on white disappears on dark grey. The checks run every page in both, and
the test's name says which failed.

## Fixing a colour without redesigning

Work on the **token**, not on each element: the colour in `resources/css/app.css` (`--color-subtle`,
or your own), so every use changes at once.

1. Find the failing pair in the report: `foreground color: #d4146e, background color: #f3ebe1`,
   and the contrast it has (4.31) against what it needs (4.5).
2. **Darken (on a light background) or lighten (on a dark one) the same hue** until it reaches 4.5:1
   on *every* background it's used on: the page, cards, code blocks. A few percent of lightness is
   usually enough, and the colour still reads as the same colour. DevTools' colour picker shows the
   ratio as you drag.
3. If the colour is a brand colour that must stay exact, keep it for large text, borders and
   backgrounds, and use a darker shade for small text.
4. Text on a coloured background (a button, the current page in a pager) can switch to the other
   ink: dark text on a bright colour is often easier than a darker colour.

Two things that look fine and fail:

- **Opacity**: `opacity-75` on text lowers its contrast against the background; give it a colour that
  passes instead.
- **Text over images**: it passes or fails depending on the picture. Put it on a solid or darkened
  band, not straight on the photo.
