# Implementation Plan: Desktop Responsive Layout

## Overview

Add responsive CSS media queries to `styles.css` for tablet (≥768px) and desktop (≥1024px) breakpoints. The implementation progressively enhances the existing mobile-first layout with wider max-widths, larger typography, increased spacing, and a floating card treatment at desktop. All changes are CSS-only — no HTML or JavaScript modifications needed.

## Tasks

- [ ] 1. Add tablet breakpoint styles (≥768px)
  - [ ] 1.1 Add the tablet media query with app shell and vertical centering rules
    - Append `@media (min-width: 768px)` block after the existing `@media (max-width: 400px)` block in `styles.css`
    - Set `.app` to `max-width: 600px`, `padding: 24px 32px 48px`, `display: flex`, `flex-direction: column`, `justify-content: center`
    - Add `.screen { flex-shrink: 0; }` to prevent content from collapsing under flexbox centering
    - _Requirements: Design Component 1 (App Shell), Function 3 (Vertical Centering)_

  - [ ] 1.2 Add tablet landing screen and game screen scaling rules
    - Inside the 768px media query, add:
      - `.landing-tagline { font-size: 34px; }`
      - `.hero-silhouette { width: 200px; height: 200px; }`
      - `.silhouette-box { min-height: 320px; padding: 40px; }`
      - `.mode-card { padding: 22px 20px; }`
      - `.mode-title { font-size: 18px; }`
      - `.choice-btn { padding: 18px 14px; font-size: 16px; }`
      - `.score-pill { font-size: 20px; }`
    - _Requirements: Design Component 2 (Landing Screen), Component 3 (Game Screen)_

  - [ ] 1.3 Add tablet results screen scaling rules
    - Inside the 768px media query, add:
      - `.results-card { padding: 56px 32px; }`
      - `.results-card h2 { font-size: 36px; }`
      - `.result-stat strong { font-size: 32px; }`
    - _Requirements: Design Component 4 (Results Screen)_

- [ ] 2. Add desktop breakpoint styles (≥1024px)
  - [ ] 2.1 Add the desktop media query with floating card treatment
    - Append `@media (min-width: 1024px)` block after the tablet media query in `styles.css`
    - Set `body` to `display: flex`, `align-items: flex-start`, `justify-content: center`
    - Set `.app` to `max-width: 720px`, `padding: 32px 48px 56px`, `background: var(--surface)`, `border-radius: 24px`, `box-shadow: 0 0 80px rgba(0, 0, 0, 0.4)`, `margin-top: 24px`, `margin-bottom: 24px`, `min-height: calc(100vh - 48px)`
    - _Requirements: Design Function 4 (Depth/Polish), Component 1 (App Shell)_

  - [ ] 2.2 Add desktop landing and hero scaling rules
    - Inside the 1024px media query, add:
      - `.landing-tagline { font-size: 38px; }`
      - `.hero-silhouette { width: 240px; height: 240px; }`
      - `.mode-card { padding: 24px; }`
      - `.mode-title { font-size: 20px; }`
      - `.mode-desc { font-size: 14px; }`
      - `.stats-bar { border-radius: 16px; margin-top: 28px; }`
      - `.stat strong { font-size: 26px; }`
      - `.stat span { font-size: 11px; }`
      - `.diff-btn { padding: 12px 0; font-size: 14px; }`
    - _Requirements: Design Component 2 (Landing Screen)_

  - [ ] 2.3 Add desktop game screen scaling rules
    - Inside the 1024px media query, add:
      - `.silhouette-box { min-height: 380px; padding: 48px; border-radius: 24px; }`
      - `.silhouette-box > img { max-height: 280px; }`
      - `.choice-btn { padding: 20px 16px; font-size: 17px; border-radius: 16px; }`
      - `.know-btn, .options-btn { padding: 24px 20px; font-size: 18px; border-radius: 16px; }`
      - `.score-pill { font-size: 22px; padding: 8px 18px; }`
      - `.timer-container { width: 72px; height: 72px; }`
      - `.timer-text { font-size: 20px; }`
      - `.hint-btn { padding: 12px 20px; font-size: 14px; }`
      - `.type-answer input { padding: 18px; font-size: 17px; }`
      - `.feedback { border-radius: 24px; }`
      - `.reveal-name { font-size: 32px; }`
    - _Requirements: Design Component 3 (Game Screen)_

  - [ ] 2.4 Add desktop results screen and CTA constraint rules
    - Inside the 1024px media query, add:
      - `.results-card { padding: 64px 40px; }`
      - `.results-card h2 { font-size: 40px; }`
      - `.result-stat strong { font-size: 36px; }`
      - `.result-stat { padding: 24px 16px; }`
      - `.cta { max-width: 400px; margin-left: auto; margin-right: auto; }`
    - _Requirements: Design Component 4 (Results Screen), Correctness Property 3 (touch targets)_

- [ ] 3. Checkpoint - Verify tablet and desktop layouts
  - Ensure all styles are syntactically correct and the page renders without errors at 768px and 1024px widths, ask the user if questions arise.

- [ ] 4. Cross-cutting concerns and polish
  - [ ] 4.1 Verify dark mode compatibility at desktop
    - Open `styles.css` and confirm no media query overrides CSS custom properties (--bg, --surface, --ink, etc.)
    - Ensure the floating card `background: var(--surface)` uses the variable so dark/light mode cascades correctly
    - If `dark-mode.js` toggles a class that redefines variables, verify those still apply inside the 1024px media query
    - _Requirements: Design Correctness Property 4 (dark mode variables cascade)_

  - [ ] 4.2 Verify hidden screen behavior under flexbox
    - Confirm `.hidden { display: none !important; }` still overrides the flex layout on `.app`
    - The `!important` declaration ensures `display: none` takes precedence over any flex child styles
    - _Requirements: Design Correctness Property 5 (only one screen visible)_

  - [ ]* 4.3 Write a visual regression test page for responsive breakpoints
    - Create `tests/responsive-layout-check.html` that loads `styles.css` and contains viewport-width assertions
    - Test that `.app` computed max-width matches 600px at 768px viewport and 720px at 1024px viewport
    - Test that no horizontal scrollbar appears (document.documentElement.scrollWidth <= window.innerWidth)
    - **Property 1: App is horizontally centered at all viewports**
    - **Property 2: No horizontal scrollbar at ≥768px**
    - **Validates: Design Correctness Properties 1, 2**

  - [ ]* 4.4 Write a touch target size verification test
    - Create assertions in `tests/responsive-layout-check.html` that all `.choice-btn`, `.know-btn`, `.options-btn`, `.hint-btn` have rendered height ≥ 44px at 1024px viewport
    - **Property 3: All interactive elements ≥ 44px touch target**
    - **Validates: Design Correctness Property 3**

- [ ] 5. Final checkpoint - Confirm no regressions
  - Ensure all styles pass syntax validation, no horizontal overflow occurs at any breakpoint, and mobile layout (≤480px) is unchanged. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All changes target `styles.css` exclusively — no other files are modified
- The design provides exact CSS rules; tasks reference those directly
- Checkpoints ensure incremental validation
- Property tests validate visual correctness properties from the design document
- Mobile layout (≤480px) must remain completely unchanged per Correctness Property 6

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 4, "tasks": ["4.1", "4.2"] },
    { "id": 5, "tasks": ["4.3", "4.4"] }
  ]
}
```
