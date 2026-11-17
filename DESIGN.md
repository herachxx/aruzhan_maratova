# Aruzhan Maratova

## Interface

A full-viewport physical workspace. Objects are rendered in Three.js with actual supplied photographs. The name, navigation and One-page CV button remain normal HTML above the scene. There is no introductory gate, loading requirement for the CV, fictional story or educational security game.

The desk starts in evening light. A lamp control changes the lighting. Photos can be moved with a pointer and returned with Tidy up. The laptop opens the CV, the notebook opens projects, the CubeSat opens ARAL WATCH, the photographs open About and competitions, and headphones open the user's actual Spotify playlist panel. Optional interests include guitar strings, a cube, a panda sticker and a hidden cat. These objects are illustrative, not photographs of owned hardware or proof of engineering work.

Every content panel is accessible through HTML navigation. The scene is supplementary. Native dialogs provide focus containment, Escape, Close, browser Back and direct fragment links. Content changes update the URL and move focus to the heading. The CV is a separate server-rendered route and a downloadable single-page A4 PDF.

## Tokens

- Typeface: self-hosted DM Sans variable, 400 body, 550 headings, 650 compact emphasis. System monospace only for the optional flag. No decorative display wordmark.
- Text: #292720. Secondary text: #726b60. Paper: #FAF7F0. Rules: #D9D2C5. Link/focus accent: #A44929. Evening text: #F2E5CC.
- Main identity: 25px / 1.15 on desktop, 19px on mobile. Panel headings: 36px / 1.15 desktop, 29px mobile. Panel body: 15px / 1.75, 14px mobile. CV has a separate compact print scale.
- Spacing base: 4px. Common gaps: 8, 12, 16, 20, 24, 30, 40, 48px. Desktop outer gutter: 40px, 50px above 1600px. Mobile gutter: 20px.
- Corners: 5px buttons, 8 to 10px readers, 12px object menu. Physical objects have their own bevels; content does not use nested cards.
- Shadows: soft contact shadows for scene objects; a restrained cast shadow under dialogs and the menu. Gradients are used only to model physical surfaces and light.
- Motion: 150ms press, 220ms panel arrival, 250ms light switch, 600ms deliberate cube turns. No automatic camera orbit, flashing or particle loop. The user requested background Minecraft music; the Spotify player attempts playback where allowed and always offers playback controls. Rendering stops when the scene settles or the page is hidden.
- Reduced motion: CSS transitions and animations disabled; camera parallax disabled. Mouse gestures are optional and never required to read content.
- Responsive breakpoints: 1100px, 700px and 360px. Small-screen projects use a labelled select instead of a squeezed sidebar. The mobile desk rearranges physical objects; the page does not require horizontal panning.

## Voice and evidence

Warm first person, specific contributions and ordinary sentences. A casual welcome and small jokes belong in the desk and personal sections; the CV stays concise. Keep qualifier fourth place separate from national-final ninth of forty. Distinguish prototypes, team outcomes, learning tools and production work. Do not claim expertise from listing a tool.

No decorative arrows, repeated middle-dot separators, artificial progress percentages, hacker slogans, fake contact details, fake screenshots or invented accomplishments. No stock icon tiles. Photos and source links carry the evidence. Personal interests come from the user's own answers. Exam scores belong in the application CV, not the GitHub profile. Intimate personal disclosures are not public site content.
