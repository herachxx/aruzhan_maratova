# Aruzhan Maratova's portfolio

A physical 3D desk with immediate access to a readable CV, real projects and source links.

## Run

Requires Node 22.13 or newer. Install with `npm install`, then run `npm run dev`. `npm run build` creates the Cloudflare Worker bundle. The Sites build integration and `.openai/hosting.json` are required for hosting. Credentials are not included in the source.

## Files

- `app/page.tsx`: navigation, project reader, biography, interests and optional guitar/cube interactions.
- `components/DeskScene.tsx`: Three.js geometry, texture creation, lighting, object picking and bounded photo movement.
- `components/MusicProvider.tsx`: persistent Spotify playback and personal playlist preview.
- `components/Sudoku.tsx`: optional Sudoku with session-only progress saving.
- `app/cv/page.tsx`: server-rendered, responsive HTML CV.
- `lib/projects.ts`: factual project descriptions, contributions, status and source links.
- `public/aruzhan-maratova-cv.pdf`: single-page A4 CV. Keep the HTML and PDF aligned when updating facts.
- `app/globals.css` and `DESIGN.md`: visual system, accessibility and responsive rules.

## Content

Photographs were supplied by Aruzhan. The ICO screenshot is from her public repository; qualifier fourth place is distinct from national-final ninth of forty. Desk hardware is illustrative. The Glass Box is an educational project, not a production password manager. ARAL WATCH is a prototype, not a launched satellite. Personal interests and new security practice come from the user's November 2026 answers.

No first-party tracking, accounts, microphone or camera access is implemented. Guitar audio is synthesized locally after Enable sound. Spotify embeds are third-party players: the personal playlist appears in Music and the Minecraft player stays mounted in the root layout. Playback remains subject to Spotify availability and browser autoplay rules. Pause controls are available in the workspace and reading panels.

## Interaction and accessibility

All content is reachable using ordinary buttons, links and a mobile project selector. The canvas is decorative for assistive technology. Dialogs support keyboard navigation, focus containment, Escape, Close, browser Back and direct `#view/project-id` links. The CV works without JavaScript. If WebGL fails, a photograph replaces the scene and navigation stays available. Reduced motion disables camera parallax and interface animation.

DM Sans and Caveat font files are distributed with their OFL licenses in `public/fonts`. DM Sans is the reading font; the scene may use a short handwritten photograph caption.
