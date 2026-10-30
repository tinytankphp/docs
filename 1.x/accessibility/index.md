# Accessibility

A site should work for everyone who visits it: with a keyboard, a screen reader, voice control,
zoomed in, with less motion, in bright sunlight. TinyTank builds the basics in, and checks every page
of your site for the rest on every push.

This section covers:

- **What's built in** (below): what the framework and the skeleton already do, and what's yours.
- [Checking](./checking): the automated checks (axe, in both themes, blocking CI), how to run them
  before you push, and what they can't see.
- [Colour and contrast](./contrast): the most common problem, and how to fix it without
  redesigning.

## What's built in

**In the skeleton's layout and CSS** (your files: adapt them freely, `tests/e2e/accessibility.spec.js`
checks they keep working):

- **A skip link**, the first thing keyboard users reach: "Skip to content" slides in on focus and
  moves the focus past the navigation to `<main id="main">`.
- **Visible keyboard focus**: `:focus-visible` gets an outline in the theme's `primary` colour, on
  every element. Mouse clicks don't trigger it on links and buttons, so they stay clean.
- **Reduced motion**: visitors whose system asks for less motion get no movement: animations stop,
  transitions keep only colours and opacity (a hover still fades, nothing slides), and scrolling
  isn't smooth (`@media (prefers-reduced-motion: reduce)` in `resources/css/app.css`).
- **The page's language**, `<html lang="…">`, in every language, so screen readers pronounce it right.
- **The contact form**: each field has a label; a mistake is linked to its field
  (`aria-invalid`, `aria-describedby`), the form's own problems are an alert (`role="alert"`) and
  "sent" a status (`role="status"`); while it's being sent, the button is disabled and busy
  (`aria-busy`). On a static site too.

**In the framework**, for every site:

- **Images** keep the alt text you write in Markdown (`![A red bicycle](bike.jpg)`) in their responsive
  `<picture>`. Write one for every image that says something; `![](divider.png)` is for decoration.
- **Task lists** (`- [x] Done`): each checkbox is named after its item, so a screen reader says
  "Done, checkbox, checked".
- **Videos** (`::youtube`, `::vimeo`): the poster is a button named "Play video: the title", and a
  plain link to the video without JavaScript.
- **Datastar's ARIA states**: `data-attr` writes a boolean as a bare attribute or removes it, so ARIA
  states are written as strings: `data-attr:aria-expanded="String($open)"`.

## Movement you add

A card that lifts or a row that slides on hover goes behind Tailwind's `motion-safe:`
(`motion-safe:hover:-translate-y-1`): with less motion it simply doesn't happen, instead of jumping.
An effect a visitor switches on knowingly (an animated background they enabled) can keep moving with
the class `motion-allowed`.

## Interactive components

Dialogs, toasts and sliders aren't part of TinyTank: native HTML (`<dialog>`, `<input type="range">`)
already handles the keyboard and screen readers, and Datastar wires it, styled your way. Prefer a
native element to a `<div>` with ARIA roles: it does the right thing without extra work.
