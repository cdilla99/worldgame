# EARTHLING design brief

Status: exploration brief, not an approved redesign. Owner: user; design direction and review: current Codex task. Implementation: one editing agent at a time.

## Product intent
Make geographic discovery feel like opening a beautiful atlas you can play with. Curious, confident, tactile, welcoming to adults and children. Geography supplies the personality: silhouettes, locations, flags, and relationships between places.

Success: in five seconds a newcomer can identify the country, understand how to browse, and find how to play. The screen should be recognizable without relying on the logo.

## First design slice
Shapes Explore only, at 1440 x 900 and 390 x 844. Use identical content in both concepts: Japan, Asia, Tokyo, an accurate existing outline and flag. Also check Canada, Indonesia, and a long country name for layout resilience. Read facts and geometry from existing project sources; do not invent data or redraw geography.

Content hierarchy:
1. Country name and outline are the main visual event.
2. Previous / country chooser / Next remain obvious and near the name.
3. Capital and region are concise supporting facts.
4. Shape Quiz is the clear route into play; Globe remains obvious navigation.
5. Preview has an explicit Pause/Play affordance in the concept.

Proposed later behavior, not authorized in the defect-fix task: preserve a manually chosen country when returning; restart previews deliberately. A future Find on globe transition can connect an outline to its location. No need to build that animation in this slice.

## Two visual directions
### A: Field Atlas (preferred hypothesis)
Warm paper #F4F0E6, ocean #123E52, ink #182C31, coral #D94A38 used sparingly. These are starting swatches, not validated contrast pairs. Oversized editorial country title, precise readable control typography, an open composition, fine rules rather than nested cards. Geography feels printed with care. No fake paper distress, sepia nostalgia, or ornamental compass.

### B: Geography Studio
Warm white #FFF9EE, cobalt #2448C8, ink #182243, restrained yellow #F2C94C. Bolder type, solid geographic forms, playful proportions, crisp controls. Energy comes from composition and geometry. No mascot, floating blobs, or generic illustration package.

Both concepts need genuinely different composition and typography, not a palette swap. Use existing/local fonts or honest system fallbacks initially; list the exact fonts used. Do not download font packages or introduce dependencies for exploration.

## Craft rules
- Country name receives more emphasis than instructional headings.
- Remove redundant headings and framing; do not box every content group.
- No glow, glass panels, decorative gradients, or meaningless graph grids.
- Cartographic annotations must be geographically meaningful. No fabricated scale or coordinates.
- Keep visible text labels for Globe and Shapes. Do not replace navigation with unexplained icons.
- Mobile opening viewport must show country identity, browsing controls, and meaningful outline area; no horizontal scrolling.
- Preserve visible focus, readable selected/hover states, adequate text contrast, and touch targets of at least 44px.
- Motion should connect states, respect reduced motion, and never delay control input.
- Use short, warm language. Avoid tooltips explaining obvious controls or repeated instructional copy.
- Passport stamps and collection ideas are deferred until this screen's direction is approved.

## Review gate
Compare the four screenshots before implementing a redesign. Judge country prominence, distinctive identity, obvious browsing, mobile composition, readable states, and feasibility with real data. Reject attractive mockups that hide necessary controls or rely on invented artwork.

## Release boundary
Work locally on earthling2. Preserve current uncommitted work. Production, backend, game rules, data sources, script order, and compatibility APIs remain governed by AGENTS.md. No commit, push, merge, or deployment in these assignments.

## Handoff discipline
Read this brief and AGENTS.md instead of replaying chat history. One owner edits runtime files at a time. Return concise evidence: changed files, checks with pass/fail, screenshots, and remaining issues. A skipped check is not a pass.
