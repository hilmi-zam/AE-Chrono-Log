---
name: Æ Chrono Log — MVP
description: A warm, offline-first personal desk for one person's day; the frozen local MVP prototype.
colors:
  paper: "#fff8f3"
  surface: "#ffffff"
  surface-soft: "#faf2ec"
  surface-muted: "#f4ede6"
  ink: "#1e1b17"
  muted: "#6f625b"
  line: "#e8e1db"
  accent: "#9f3c16"
  accent-dark: "#822f12"
  sage: "#486645"
  slate-unused: "#4c5e6a"
  danger: "#9a3428"
  overdue: "#a33e32"
  success-wash: "#eaf1e8"
  success-ink: "#304e2f"
  warning-wash: "#fff4e5"
  warning-ink: "#70491e"
  category-clay: "#bd5b43"
  category-sage: "#567362"
  category-slate: "#537091"
  category-plum: "#8a6d9d"
  category-ochre: "#b28a38"
  category-cocoa: "#8b6651"
  category-steel: "#6f7d8c"
typography:
  display:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "clamp(30px, 3vw, 42px)"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "-0.035em"
  headline:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "clamp(24px, 3vw, 34px)"
    fontWeight: 400
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Segoe UI", Arial, sans-serif'
    fontSize: "13px"
    fontWeight: 650
  body:
    fontFamily: '"Segoe UI", Arial, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: '"Cascadia Code", Consolas, monospace'
    fontSize: "10px"
    fontWeight: 400
    letterSpacing: "0.09em"
  metric:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "29px"
    fontWeight: 500
    lineHeight: 1.55
rounded:
  xs: "3px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "20px"
  full: "50%"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "9px 15px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.accent-dark}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "9px 15px"
    height: "40px"
  button-small:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "5px 10px"
    height: "32px"
  nav-item-active:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "11px 12px"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: "9px 12px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "22px"
  stat-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent}"
    rounded: "9px"
    padding: "16px 19px"
  agenda-row:
    textColor: "{colors.ink}"
    padding: "13px 0 13px 10px"
  status-pill:
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "6px 9px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 11px"
---

# Design System: Æ Chrono Log — MVP

## Overview

**Creative North Star: "The Personal Desk"**

This is a single person's desk in a quiet, well-lit room: warm paper, a few objects placed with care, and nothing on the surface that does not help answer "what do I do today?" The interface is calm but not empty — it is arranged, the way a working desk is arranged. Warm ivory paper carries the whole product; white sheets hold the work; biscuit and oat tones mark the places where one sheet rests on another. Structure comes from hairlines, not boxes, so the surface stays light enough to scan in the morning and legible on a modest laptop.

The editorial voice is deliberate. Georgia gives page titles, greetings, and key numbers a printed-report gravity; Segoe UI keeps every control and label plain and quick; Cascadia Code turns eyebrows, counters, and metadata into margin annotations. Burnt terracotta is the single voice of action and attention, muted sage the voice of tasks and "all is well", and the seven earthy category colors belong only to the user's own data. Motion is minimal and functional: 150 ms state transitions, a 1 px press, and nothing that performs. Depth is tonal before it is shadowed; only dialogs and the mobile tab bar actually lift off the page.

The system is Indonesian by default, offline-first by requirement, and deliberately dependency-light: system fonts, text-glyph icons, and no imagery. It should feel like a tool someone made for their own mornings — precise, warm, and honest about what it does not yet do.

**Scope:** This system documents the existing MVP PWA in `mvp/`. The UI is frozen after the core flows (SRS OQ-20); future changes are limited to accessibility, responsiveness, consistency, or usability blockers. The v1.0 finance dashboard in `dashboard/`, its Cloudflare Worker, and its D1 data are out of scope and keep their own separate Swiss/red language.

**Key Characteristics:**
- Warm paper field with white sheets and hairline edges.
- Three typographic voices: humanist sans for UI, Georgia serif for titles and numbers, mono for labels.
- Burnt terracotta for action and attention; sage for tasks and settled state.
- Flat-by-default surfaces; real elevation only for dialogs and the mobile tab bar.
- Text-glyph iconography (`◫ ▦ ✓ ▤ ↳ ◷ ⚙ ⌕ ×`) instead of an icon library.
- Responsive down to 320 px, with a translucent bottom tab bar on phones.

## Colors

A warm, low-chroma paper palette interrupted by one confident burnt terracotta — earthy rather than corporate, with no cool grays in chrome. Cool hues appear only in the dead `--blue` token and in user-selected data accents.

### Primary
- **Burnt Terracotta** (#9f3c16): The action and attention voice. Primary buttons, active navigation symbols, stat numbers, the focus ring, the "log" brand suffix, and the mobile `Æ` tile. Link text uses its darker half. It is the only action-colored accent in chrome, so it reads as a signal rather than decoration.
- **Deep Rust** (#822f12): The pressed and hovered half of terracotta. Used for primary-button hover, text-link hover, and small text actions.

### Secondary
- **Muted Sage** (#486645, `--green` in code): Reserved for task semantics and settled state — the local-storage dot, task-deadline times, the task select control, and the left rail of task events in the calendar. Never used for primary actions.

### Tertiary — Data Accents
User-selectable colors for agenda categories and courses. They never tint chrome; they appear only as the 3 px rail, the calendar chip edge, or the course color bar.
- **Clay** (#bd5b43): Default agenda category color; the warmest data accent.
- **Eucalyptus** (#567362): Second course/category option; green-gray, quieter than sage.
- **Dusk Slate** (#537091): Third option; the only cool hue in the set, used sparingly.
- **Dusty Plum** (#8a6d9d): Fourth option; muted violet, never neon.
- **Antique Ochre** (#b28a38): Fifth option; golden, low saturation.
- **Cocoa** (#8b6651): Agenda-only option; brown, grounded.
- **Harbor Steel** (#6f7d8c): Agenda-only option; blue-gray, the coolest data accent.

### Neutral
- **Warm Ivory Paper** (#fff8f3): The page field. Every screen sits on it; the page background and the theme-color declared in `index.html`.
- **Clean Sheet White** (#ffffff): Panels, cards, inputs, dialogs, and the search field — the sheets of paper on the desk.
- **Bisque Wash** (#faf2ec): The sidebar and welcome card; the first tonal step above paper.
- **Oat Linen** (#f4ede6): Hover and active navigation backgrounds; the second tonal step.
- **Soft Charcoal Ink** (#1e1b17): Primary text and the dark brand tile. Warm black, never `#000`.
- **Warm Taupe** (#6f625b): Secondary text, metadata, captions, and inactive navigation.
- **Hairline Sand** (#e8e1db): Every structural hairline — panel borders, dividers, input strokes, table rules.

### Semantic
- **Brick Red** (#9a3428): Form errors and destructive warnings. Deliberately redder and deeper than terracotta so a warning never reads as a call to action.
- **Overdue Clay** (#a33e32): The warmer red-brown reserved for the "Terlambat" label on overdue tasks.
- **Sage Wash** (#eaf1e8) / **Deep Pine** (#304e2f): Inline success notice background and text for saved or completed actions.
- **Amber Wash** (#fff4e5) / **Bronze Ink** (#70491e): The warning banner for preview-only notifications.
- **Reserved Slate** (#4c5e6a): Declared as `--blue` but used by no component; do not adopt it without a real role.

### Named Rules
**The Two-Voice Color Rule.** Terracotta means "act or look here"; sage means "task, done, or offline-ok". Do not use terracotta for success, and do not use sage for a primary action.

**The 3px Rail Rule.** Category identity enters a row only as a 3 px left rail (or a 3 px left border on a calendar chip). Never fill a whole card or row with a category color.

## Typography

**Display Font:** Georgia (with Times New Roman, serif)
**Body Font:** Segoe UI (with Arial, sans-serif)
**Label/Mono Font:** Cascadia Code (with Consolas, monospace)

**Character:** A printed report interface wrapped around a fast utility app. Georgia supplies warmth and authority at the top of the page; Segoe UI keeps the working surface neutral and familiar; Cascadia Code labels everything like a margin note. The pairing is deliberately all-system — no webfont request, no layout shift, no network dependency.

### Hierarchy
- **Display** (500, `clamp(30px, 3vw, 42px)`, 1.55 inherited; 1.2 on mobile, -0.035em): The single page title in the top bar. It is the largest object on every screen.
- **Headline** (400, `clamp(24px, 3vw, 34px)`, -0.025em): Greeting and welcome copy. Panel headings drop to 22px/500, dialog headings to 26px/500, and course-detail titles to 25px/500.
- **Title** (650, 13px): Record, task, inbox, and course names. Compact and scannable; descriptions stay below at 11–12px.
- **Body** (400, 14px, 1.55): Default UI copy. Long descriptions use 12px; empty-state copy caps at 310px.
- **Label** (400, 10px, 0.09em, uppercase in content): Eyebrows and stat labels, authored uppercase in markup, in Warm Taupe. Navigation item labels are sentence case: 14px on desktop, 10px in the mobile bar. Counters and calendar metadata may drop to 9px.
- **Metric** (500, 29px): Stat-card numbers, set in Georgia and colored terracotta. Times use tabular numerals.

### Named Rules
**The Three Voices Rule.** UI copy is Segoe UI; page titles, greetings, and hero numerals are Georgia; labels and metadata are Cascadia Code. Never set body copy in the serif, and never set prose in the mono.

**The System-Font Rule.** No webfonts. Georgia, Segoe UI, and Cascadia Code are the palette; fallbacks must stay metric-plausible so the layout does not shift offline.

## Layout

A fixed left sidebar frames a single scrolling work area. The sidebar is 248 px wide (205 px below 900 px), sits on Bisque Wash, and is separated by a 1 px hairline. The main column is capped at 1600 px with a left margin equal to the sidebar width and padding of `42px clamp(24px, 5vw, 72px) 72px`.

The dashboard uses a 2-column panel grid (16 px gap) with a full-width "Agenda mendatang" panel; three stat cards share a 3-column grid (14 px gap). Settings uses a 2-column panel grid with a 4-column count strip. Rows are dense: 12–13 px vertical padding, 13–14 px type, and 11 px metadata. Cards and panels are the primary grouping device; the only nested card-like surfaces are course cards and settings count tiles.

Spacing is not tokenised. Observed values cluster around a loose 4 px family: 4–9 px inside compact controls, 10–14 px between related items, 16–22 px inside panels, 24–32 px between major blocks, and 42 px page top padding. Panels use 22 px padding (17 px on mobile), rows use 13 px vertical padding, and controls use 9–11 px. Do not present this as a strict 4/8 grid; the implementation does not follow one.

Responsive behavior is explicit rather than fluid:
- **≤ 900 px:** sidebar narrows to 205 px, the top bar stacks, settings collapse to one column, and metadata rows reflow.
- **≤ 640 px:** the sidebar becomes a fixed bottom tab bar with seven equal columns, 54 px minimum item height, a translucent `#fffaf6f2` background with `backdrop-filter: blur(14px)`, a top hairline, and safe-area padding. Main content loses its left margin and gains 84 px bottom padding plus the safe area. The dashboard becomes one column; stat cards compress but stay three across.
- **320 px minimum:** no horizontal overflow. Calendar week/month grids are allowed to scroll horizontally inside their panel rather than squeeze below legibility.

Touch targets are 40 px for default buttons, 32 px for row-level small buttons, 30 px for icon buttons, and 54 px for mobile navigation items. The shell is designed for a 1366×768 laptop first, then a phone.

## Elevation & Depth

This system is flat by default and tonal by design. Four paper tones — Warm Ivory Paper, Bisque Wash, Oat Linen, Clean Sheet White — do most of the depth work, separated by 1 px hairlines. Panels carry only a breath of shadow (`0 1px 5px #29292208`); the effect is a sheet resting on a desk, not a floating card. Real lift is reserved for modal dialogs, which use a wide, soft shadow and a blurred scrim, and for the mobile tab bar, which uses backdrop blur. There are no gradients and no stacked shadows.

### Shadow Vocabulary
- **Sheet rest** (`box-shadow: 0 1px 5px #29292208`): Panels at rest. Barely perceptible; it keeps white sheets from merging with the ivory page.
- **Dialog lift** (`box-shadow: 0 18px 80px #29292233`): Modal dialogs only.
- **Scrim** (`background: #25251f80` + `backdrop-filter: blur(2px)`): Dialog backdrop. Darkens and softens the desk behind the active sheet.
- **Bar blur** (`background: #fffaf6f2` + `backdrop-filter: blur(14px)`): The fixed mobile navigation bar.

### Named Rules
**The Flat-by-Default Rule.** Surfaces are flat at rest. Depth is a response to state or modality — a dialog opening, a bar floating over content — never a decoration for a static card.

**The Hairline Rule.** Structure is drawn with 1 px Hairline Sand, not ink borders and not shadow stacks. If a boundary needs to be stronger, change the paper tone before thickening the line.

## Shapes

The form language is soft-edged paper: small radii on controls, medium radii on sheets, and fully round dots and pills. Controls sit at 8 px (buttons, navigation items, search, notices); inputs at 6 px; panels and the welcome card at 12 px; dialogs at 16 px; status pills at 20 px; calendar chips at 3 px. Stat cards use 9 px, course cards 7 px, and the desktop brand tile 10 px. Dots and date circles are 50%.

Borders are always 1 px, except two deliberate exceptions: the 2 px terracotta focus ring (offset 3 px) and the 3 px category rail. There are no clipped corners, no thick outlines, no ornamental dividers, and no gradients. The only glass-like surface is the mobile tab bar.

## Components

### Buttons
- **Shape:** Gently rounded controls (8 px radius), 40 px minimum height, 9×15 px padding, 1 px Hairline Sand stroke, 600 weight.
- **Primary:** Burnt Terracotta background with white text; hover shifts to Deep Rust. Used for the single most important action on a screen ("+ Tambah", "Ekspor backup").
- **Secondary:** Clean Sheet White with a Hairline Sand stroke and Soft Charcoal Ink text; hover raises the border to a warmer sand and fills with Bisque Wash. Press translates 1 px down.
- **Small:** 32 px minimum height, 5×10 px padding, 11 px type — for row-level actions such as "Edit" and "Ubah pertemuan".
- **Text:** Deep Rust, 12 px, 650, transparent; underline appears on hover. Used for "Lihat agenda →".
- **Icon:** 30 px transparent circle with a 21 px glyph in `#898a81`; hover fills with `#f3e7e2` and turns Deep Rust.

### Chips & Pills
- **Status pill:** 20 px radius, 6×9 px padding, 1 px Hairline Sand, Warm Taupe 11 px text, optional 7 px sage dot. Reads as a label, never as a button.
- **Selected filter:** Filter and calendar-view buttons invert to Soft Charcoal Ink with a Clean Sheet White label when selected.
- **Category chip:** Calendar events are 3 px-radius chips with a 3 px left border in the category color, a warm `#f6e8e2` fill for agenda, and a sage-edged `#e8efe9` fill for task deadlines.

### Cards / Containers
- **Corner Style:** 12 px panels; 9 px stat cards; 7 px course cards.
- **Background:** Clean Sheet White on the Warm Ivory Paper field; the welcome card is Bisque Wash.
- **Shadow Strategy:** Sheet-rest shadow only; see Elevation & Depth.
- **Border:** 1 px Hairline Sand on all four sides.
- **Internal Padding:** 22 px for panels, 16×19 px for stat cards, 14 px for course cards. Stat numbers are 29 px Georgia in terracotta.

### Inputs / Fields
- **Style:** 1 px Hairline Sand stroke, Clean Sheet White background, 6 px radius, 10×11 px padding, 14 px text. Labels are 12 px/650 with an optional muted parenthetical.
- **Focus:** A 2 px terracotta outline at 3 px offset. No glow, no border-color shift.
- **Error:** Errors use Brick Red text in a reserved 18 px line so the layout does not jump.
- **Checkbox / Color:** Checkboxes use terracotta `accent-color`; color pickers are 40 px tall with 4 px padding.

### Navigation
- **Desktop:** A 248 px Bisque Wash sidebar with a 36 px Soft Charcoal tile holding the ivory `Æ`, then "chrono" in 700 and "log" in terracotta 400. Items are 11×12 px, 8 px radius, 14 px text with a 17 px terracotta glyph. Hover and active use Oat Linen; active adds 650 weight.
- **Mobile:** The same seven destinations become a fixed bottom bar of equal columns, icon over 10 px label, with the active item tinted terracotta and a small terracotta count badge. The wordmark moves into the header as a 23 px terracotta circle with a white `Æ`.
- **Counts:** Muted 12 px on desktop, 9 px in a terracotta badge on mobile.

### Calendar
- **Style:** A hairline grid with no outer chrome beyond the panel. Week and month grids keep a minimum width (700 px / 630 px) and scroll horizontally rather than compressing.
- **Events:** 3 px-radius chips with a 3 px category rail; 9 px time and 10 px title, both truncated with ellipsis. Cancelled events strike through and mute.
- **Today:** A 25 px Soft Charcoal circle with a white numeral. Outside-month cells use `#faf9f5` and muted numerals.

### Dialog
- **Style:** 16 px radius, 1 px Hairline Sand, Clean Sheet White, 26 px Georgia heading, 26 px internal padding, and a single right-aligned action row. Width is `min(520px, calc(100vw - 28px))`.
- **Backdrop:** `#25251f80` with a 2 px blur.
- **Mobile:** The action row becomes sticky at the bottom of the scrolling form.

### Empty States
- **Style:** Centered in a 135 px minimum area; a 24 px `○` in `#c6c3b9`, a 13 px/650 title, and 11 px Warm Taupe copy capped at 310 px. Empty states explain the next action, never scold.

### Interaction & Feedback
- **Navigation:** page changes are held in memory. There is no router, no URL update, and browser Back does not return to the previous MVP page.
- **Search:** the global field debounces for 120 ms, switches to the Search page when non-empty, restores the previous page when cleared, and preserves focus and caret position.
- **Dialogs:** native `<dialog>` opened with `showModal()`; the first input receives focus, submit errors appear in the reserved error line, and destructive actions use the browser's native `confirm()`.
- **Inline edits:** the task-status `<select>` saves on change and refreshes the list; task filters and calendar-view buttons apply immediately.
- **Feedback:** transient status messages use an `aria-live="polite"` region and auto-dismiss after 4.5 s; browser online/offline events post explanatory messages.
- **Loading:** there are no skeletons or spinners; IndexedDB reads render synchronously after the initial load.
- **Motion:** hover and press transitions run at 150 ms; `prefers-reduced-motion` collapses durations to 0.01 ms.

### Signature: Typographic Glyphs
The app uses text characters as its icon system: `◫` today, `▦` agenda, `✓` tasks, `▤` courses, `↳` inbox, `◷` notifications, `⚙` settings, `⌕` search, `×` delete, `→` navigation, `○` empty. They are set in the UI font, colored by role, and sized 17–24 px in content (13–19 px in brand marks). This is a deliberate identity choice, not a placeholder.

## Do's and Don'ts

### Do:
- **Do** keep exactly one page title per screen, in Georgia at `clamp(30px, 3vw, 42px)`, weight 500, with tighter tracking.
- **Do** separate surfaces with paper tones first and hairlines second; save shadow for dialogs and the floating mobile bar.
- **Do** keep category and course color on the 3 px rail, chip edge, or color bar only.
- **Do** pair terracotta with white text at 600 weight and a minimum 40 px height.
- **Do** use the established text glyphs for icons so the product stays dependency-free.
- **Do** write interface copy in Indonesian and keep the `Æ` ligature in the product name.
- **Do** preserve the 2 px terracotta focus ring with 3 px offset, and verify 320 px with no horizontal overflow.
- **Do** test the morning dashboard offline before adding anything decorative.

### Don't:
- **Don't** apply these tokens to the v1.0 dashboard in `dashboard/`; that surface, its Cloudflare Worker, and its D1 data are governed separately and must not be modified.
- **Don't** introduce webfonts, icon fonts, or SVG icon packs; the system-font and glyph approach is a product constraint.
- **Don't** use pure black, cool grays, or blue/purple chrome. Cool hues exist only in the unused `--blue` token and inside user-selected data accents.
- **Don't** fill a card, row, or panel with a category color; the 3 px rail is the whole allowance.
- **Don't** add gradients, glassmorphism, or stacked shadows. The only blur is the dialog scrim and the mobile tab bar.
- **Don't** set body copy in Georgia or Cascadia Code; those voices are reserved for titles/numerals and labels/meta.
- **Don't** use terracotta for success or completed states; sage owns that meaning.
- **Don't** add badges, counts, or accent color without a functional reason.

### Known Inconsistencies (documented, not fixed)

These are current facts in `mvp/`. They are recorded so future work does not mistake drift for a rule; none of them is authorised for cleanup by this document.

- **Dead blue token.** `--blue: #4c5e6a` is declared in `:root` (`mvp/src/style.css:17`) but no rule or script references it.
- **Three source backgrounds.** The web manifest uses `#f5f3ed` for both `theme_color` and `background_color` (`mvp/public/manifest.webmanifest:9-10`), `index.html` declares `theme-color` `#fff8f3` (`mvp/index.html:6`), and the page background is `--paper` `#fff8f3` (`mvp/src/style.css:7`). The manifest value exists nowhere in the stylesheet.
- **Literal colors beside variables.** Many rules bypass the custom properties: nav text `#5f6058`, row dividers `#efeee9` (a different warm gray from `--line` `#e8e1db`), secondary-button hover border `#c9b9ae`, agenda event wash `#f6e8e2`, task event wash `#e8efe9`, course-card hover `#fbfaf6`, and icon-button hover `#f3e7e2`. The welcome-date divider `#dec0b7` and prototype-note border `#ead7cb` are also one-offs.
- **Two near-reds.** Dialog errors use `#9a3428` while overdue/cancelled labels use `#a33e32`; the difference is visible but not semantically named in code.
- **Radius drift without tokens.** Cards use 7 px (course), 9 px (stat), and 12 px (panel/welcome); form inputs use 5 px or 6 px depending on context. These are literals, not variables.
- **Accent versus data color.** The default category color `#bd5b43` is a softer clay than the brand accent `#9f3c16`; the default agenda rail therefore does not match the primary button.
- **Sage is overloaded.** `--green` marks the local-storage dot, task-deadline times, and the inline task-status control; the success notice uses a separate one-off green wash (`#eaf1e8` / `#304e2f`) rather than the token.
- **Selected states differ.** Sidebar active items use a tonal Oat Linen background, while selected task filters and calendar views invert to a Soft Charcoal fill. Both are current; neither is the single selected pattern.
- **No declared type scale.** Sizes run from 8 px (mobile stat labels) through 9, 10, 11, 12, 13, and 14 px with no scale token; the 8 px labels are the floor.
- **Double horizontal-scroll declaration.** `.calendar-panel` sets `overflow-x: auto`, and the week/month grids inside it also declare `overflow-x: auto` (`mvp/src/style.css:80,114`).
- **No URL routing.** Page state is held in memory, so deep links and browser history do not represent MVP pages.
- **Manifest icon coverage.** Only an SVG `sizes: any` icon is supplied; there are no 192 px or 512 px PNG entries.
