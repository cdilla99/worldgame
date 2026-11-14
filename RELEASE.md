# Mobile gameplay release candidate

This checkpoint combines the navigation and visual work inherited from Copilot with the phone experience, Daily discovery flow, silhouette fixes and practice-session improvements reviewed in this workspace.

## Player-visible changes

- Phones open on Play, with bottom navigation to Play, Explore and Daily.
- Easy Practice offers five countries with immediate answer choices, visible progress, a discovery summary and replay. Revealed answers count as explored countries and appear in the review.
- Explore keeps country facts in an expandable sheet. Quiz preferences persist on the device.
- Daily shows submitted guesses, compass bearings, warmer feedback and the closest distance reached. Completion reveals a country fact and offers an Explore action.
- Country shapes use the local Natural Earth renderer. The compact longitude frame no longer stretches western-hemisphere vertices across a full turn. Regression coverage checks all 197 outlines and preserves the source geometry.

## Reproduce validation

```text
npm ci
npm run check
npm run test:e2e
```

The browser suite runs against the production build. The iPhone and Pixel touch tests are Chromium emulation; they do not validate physical Safari or Android keyboards.

The clean-install review also updates the pinned Vite build tool to 8.1.6 and the lockfile's Nano ID and source-map-js dependencies. These address the reported [Vite editor-launch advisory](https://github.com/advisories/GHSA-587h-7wmj-h5pm), [Nano ID advisory](https://github.com/advisories/GHSA-2v37-7h3g-55p8), and [source-map-js advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).

## Deployment preparation

Netlify builds with `npm run build` and publishes `dist/`. A static deployment archive must contain the contents of `dist/` at its root. Build outputs and release archives remain outside Git.

Physical device sign-off remains pending in [the phone release check](tests/manual/phone-release-check.md). Record those results before calling this release fully validated on phones. This checkpoint does not publish or push the application.
